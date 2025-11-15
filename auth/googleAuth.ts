// FIX: Add global type declarations for Google Identity Services and GAPI client
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: google.accounts.oauth2.TokenResponse) => void;
            error_callback: (error: any) => void;
          }) => google.accounts.oauth2.TokenClient;
        };
      };
    };
    gapi?: {
      load: (apis: string, callback: () => void) => void;
      client: {
        init: (args: any) => Promise<void>;
        load: (discoveryUrl: string) => Promise<void>;
        setToken: (token: { access_token: string } | null) => void;
        calendar?: {
          events: {
            list: (args: any) => Promise<{ result: { items: any[] } }>;
          };
        };
      };
    };
  }
  
  namespace google {
    namespace accounts {
      namespace oauth2 {
        interface TokenClient {
          requestAccessToken: () => void;
        }
        interface TokenResponse {
          access_token: string;
        }
      }
    }
  }
}

// You must get this from the Google Cloud Console
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // IMPORTANT: Replace with your actual Client ID

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile';
const GAPI_SCRIPT_ID = 'gapi-script';
const GSI_SCRIPT_ID = 'gsi-client-script';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let onLoginSuccessCallback: ((profile: UserProfile) => void) | null = null;
let onLogoutCallback: (() => void) | null = null;

let gsiScriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
    if (gsiScriptPromise) {
        return gsiScriptPromise;
    }

    gsiScriptPromise = new Promise((resolve, reject) => {
        if (document.getElementById(GSI_SCRIPT_ID) || (window.google && window.google.accounts)) {
            return resolve();
        }

        const script = document.createElement('script');
        script.id = GSI_SCRIPT_ID;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            console.error("Failed to load Google Identity Services script.");
            reject(new Error("Failed to load GSI script."));
        };
        document.body.appendChild(script);
    });

    return gsiScriptPromise;
}

export const init = async (
    onLogin: (profile: UserProfile) => void,
    onLogout: () => void
) => {
    onLoginSuccessCallback = onLogin;
    onLogoutCallback = onLogout;

    try {
        await loadGsiScript();
    } catch (error) {
        console.error("Cannot initialize Google Auth due to script loading failure:", error);
        return;
    }
    
    if (!window.google || !window.google.accounts) {
        console.error("GSI script loaded but window.google.accounts is not available. Authentication cannot be initialized.");
        return;
    }

    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken) {
        handleTokenResponse({ access_token: savedToken } as google.accounts.oauth2.TokenResponse);
    }

    // Initialize the token client
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
        error_callback: (error: any) => {
            console.error("Google Auth Error:", error);
            if (error && error.type === 'popup_closed') {
                alert("Login popup was closed unexpectedly. \n\nThis might be due to:\n1. A popup blocker.\n2. Third-party cookies being disabled for Google.\n3. A misconfiguration in your Google Cloud Console (check your 'Authorized JavaScript origins').");
            }
        }
    });
};

const handleTokenResponse = async (response: google.accounts.oauth2.TokenResponse) => {
    if (response.access_token) {
        localStorage.setItem('google_access_token', response.access_token);
        
        // Fetch user profile
        try {
            const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${response.access_token}`
                }
            });
            if (!profileResponse.ok) {
                 if (profileResponse.status === 401) {
                    console.log("Access token expired or invalid. Signing out.");
                    signOut();
                }
                throw new Error(`Failed to fetch profile: ${profileResponse.statusText}`);
            }

            const profileData = await profileResponse.json();
            const userProfile: UserProfile = {
                id: profileData.sub,
                name: profileData.name,
                email: profileData.email,
                picture: profileData.picture
            };

            if (onLoginSuccessCallback) {
                onLoginSuccessCallback(userProfile);
            }

            // Load GAPI client for API calls
            await loadGapiClient();

        } catch (error) {
            console.error("Error fetching user profile:", error);
            signOut();
        }

    } else {
        console.error("No access token in response");
    }
};

export const signIn = () => {
    if (tokenClient) {
        tokenClient.requestAccessToken();
    } else {
        console.error("Token client is not initialized. This may be due to a script loading failure or a race condition. The app tried to initiate login before the Google script was ready.");
        alert("Google Sign-In is not ready. Please wait a moment and try again. If this persists, check the console for errors.");
    }
};

export const signOut = () => {
    localStorage.removeItem('google_access_token');
    if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null);
    }
    if (onLogoutCallback) {
        onLogoutCallback();
    }
};

// --- GAPI Loader for API Calls ---
let gapiLoaded = false;
let gapiClientPromise: Promise<any> | null = null;

const loadGapiClient = (): Promise<any> => {
    if (gapiClientPromise) {
        return gapiClientPromise;
    }

    gapiClientPromise = new Promise((resolve, reject) => {
        if (gapiLoaded && window.gapi) {
            resolve(window.gapi);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.id = GAPI_SCRIPT_ID;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (!window.gapi) {
                const err = new Error("GAPI script loaded but window.gapi is not defined.");
                console.error(err);
                return reject(err);
            }
            window.gapi.load('client', async () => {
                try {
                     if (!window.gapi) {
                        const err = new Error("window.gapi is not defined inside gapi.load callback.");
                        console.error(err);
                        return reject(err);
                    }
                    await window.gapi.client.init({
                        // No API key needed since we are using OAuth
                    });
                    await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest');
                    gapiLoaded = true;
                    const token = localStorage.getItem('google_access_token');
                    if (token) {
                        window.gapi.client.setToken({ access_token: token });
                    }
                    resolve(window.gapi);
                } catch (e) {
                    console.error("GAPI client init error", e);
                    reject(e);
                }
            });
        };
        script.onerror = (e) => {
            console.error("Failed to load GAPI script", e);
            reject(e);
        };
        document.body.appendChild(script);
    });

    return gapiClientPromise;
};

export const getGapiClient = async (): Promise<any> => {
    return await loadGapiClient();
};