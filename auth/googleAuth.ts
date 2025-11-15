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
const GSI_SCRIPT_ID = 'gsi-script';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let onLoginSuccessCallback: ((profile: UserProfile) => void) | null = null;
let onLogoutCallback: (() => void) | null = null;

export const init = (
    onLogin: (profile: UserProfile) => void,
    onLogout: () => void
) => {
    onLoginSuccessCallback = onLogin;
    onLogoutCallback = onLogout;

    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken) {
        handleTokenResponse({ access_token: savedToken } as google.accounts.oauth2.TokenResponse);
    }

    // Initialize the token client
    if (window.google && window.google.accounts) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: handleTokenResponse,
            error_callback: (error) => {
                console.error("Google Auth Error:", error);
            }
        });
    } else {
        console.error("Google Identity Services script not loaded.");
    }
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
        console.error("Token client is not initialized.");
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