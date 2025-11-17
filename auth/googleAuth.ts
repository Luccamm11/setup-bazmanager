// This file handles the entire Google Sign-In and API client flow.
// It uses Google Identity Services (GIS) for Web.

// --- TypeScript Declarations for Google APIs ---
declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

// --- Configuration ---
const CLIENT_ID = '491446243605-n7p1jb6p7k0flvoq61mudl2vp0c5pjqq.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// --- Module State ---
let onLoginSuccessCallback: ((profile: UserProfile, apiAuthorized: boolean) => void) | null = null;
let onLogoutCallback: (() => void) | null = null;
let accessToken: string | null = null;
let gapiInited = false;
let gapiScriptLoaded = false;

// --- Helper Functions ---

/**
 * Decodes the JWT credential returned by Google Sign-In to extract user profile information.
 */
const decodeJwtResponse = (token: string): UserProfile => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        return {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
        };
    } catch (e) {
        console.error("Error decoding JWT", e);
        throw new Error("Invalid JWT token received.");
    }
};


// --- Core Authentication Flow ---

/**
 * This callback is triggered by Google after a user successfully signs in
 * via One Tap or the Sign-In button.
 */
const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
        console.error("Credential response is missing credential.", response);
        return;
    }

    const profile = decodeJwtResponse(response.credential);

    // After identifying the user, get an access token for Google API calls (e.g., Calendar).
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
                console.error('Token Error:', tokenResponse.error, tokenResponse.error_description);
                if (onLoginSuccessCallback) {
                    // Notify app of login, but signal that API authorization failed.
                    onLoginSuccessCallback(profile, false);
                }
                return;
            }
            accessToken = tokenResponse.access_token;
            
            // Wait for GAPI to be ready before setting the token
            const checkGapi = () => {
                if (gapiInited) {
                    window.gapi.client.setToken({ access_token: accessToken });
                    if (onLoginSuccessCallback) {
                        onLoginSuccessCallback(profile, true); // API access granted
                    }
                } else {
                    setTimeout(checkGapi, 100);
                }
            };
            checkGapi();
        },
    });
    
    // Request an access token. Since the user just signed in, this should not require a new popup.
    tokenClient.requestAccessToken({ prompt: '' });
};

/**
 * Polls until the Google Identity Services (GIS) script is loaded and ready.
 */
const initializeGis = () => {
    if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: true, // Enables automatic sign-in for returning users
        });

        // Render the official "Sign in with Google" button into the specified element.
        const signInButtonElement = document.getElementById('google-signin-button');
        if (signInButtonElement) {
            window.google.accounts.id.renderButton(
                signInButtonElement,
                { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', width: '280' }
            );
        }
        
        // Display the One Tap prompt for returning users.
        window.google.accounts.id.prompt();
    } else {
        setTimeout(initializeGis, 100);
    }
};

/**
 * Initializes the entire Google authentication service.
 * Sets up GIS for sign-in and loads GAPI for Calendar API access.
 */
export const init = (
    onLogin: (profile: UserProfile, apiAuthorized: boolean) => void,
    onLogout: () => void
) => {
    onLoginSuccessCallback = onLogin;
    onLogoutCallback = onLogout;

    // Start polling for the GIS script (loaded from index.html)
    initializeGis();

    // Dynamically load the GAPI script for Calendar API access.
    if (!gapiScriptLoaded) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.id = 'gapi-script';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({
                    discoveryDocs: [
                        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
                    ],
                });
                gapiInited = true;
            });
        };
        document.body.appendChild(script);
        gapiScriptLoaded = true;
    }
};

/**
 * Signs the user out by disabling One Tap for the session and revoking the access token.
 */
export const signOut = () => {
    if (window.google?.accounts?.id) {
        // Prevents the One Tap prompt from appearing immediately after manual sign-out.
        window.google.accounts.id.disableAutoSelect();
    }

    if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
            if (onLogoutCallback) {
                onLogoutCallback();
            }
        });
    } else if (onLogoutCallback) {
        // If there was no token, still ensure the app's state is logged out.
        onLogoutCallback();
    }
};

/**
 * Returns the initialized GAPI client, ready for API calls.
 * Waits for initialization if it's not ready yet.
 */
export const getGapiClient = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const checkGapi = () => {
            if (gapiInited) {
                resolve(window.gapi);
            } else {
                setTimeout(checkGapi, 100);
            }
        };
        checkGapi();
    });
};
