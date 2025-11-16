

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
// IMPORTANT: Replace with your actual Client ID and API Key from the Google Cloud Console.
const CLIENT_ID = '491446243605-n7p1jb6p7k0flvoq61mudl2vp0c5pjqq.apps.googleusercontent.com';
const API_KEY = process.env.API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// --- Module State ---
let tokenClient: any = null;
let accessToken: string | null = null;
let gapiInited = false;
let gisInited = false;

let onLoginSuccessCallback: ((profile: UserProfile) => void) | null = null;
let onLogoutCallback: (() => void) | null = null;

// --- Helper Functions ---
const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
};

const getUserProfile = async (token: string): Promise<UserProfile> => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch user profile.');
    }
    const profile = await response.json();
    return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
    };
};

// --- Core Authentication Flow ---

/**
 * Initializes the Google authentication service.
 * Loads necessary scripts and sets up the token client.
 */
export const init = (
    onLogin: (profile: UserProfile) => void,
    onLogout: () => void
) => {
    onLoginSuccessCallback = onLogin;
    onLogoutCallback = onLogout;

    // FIX: Removed an obsolete check for a placeholder CLIENT_ID.
    // The CLIENT_ID constant has been assigned a value, making the check always false and causing a TypeScript error.
    
    // Load both scripts in parallel
    Promise.all([loadScript('https://apis.google.com/js/api.js', 'gapi-script'), loadScript('https://accounts.google.com/gsi/client', 'gis-script')])
        .then(() => {
            // Initialize GAPI client
            window.gapi.load('client', async () => {
                await window.gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                });
                gapiInited = true;
            });

            // Initialize GIS client
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: async (tokenResponse: any) => {
                    if (tokenResponse.error) {
                        console.error('Google Auth Error:', tokenResponse.error);
                        return;
                    }
                    accessToken = tokenResponse.access_token;
                    window.gapi.client.setToken({ access_token: accessToken });

                    try {
                        const profile = await getUserProfile(accessToken);
                        if (onLoginSuccessCallback) {
                            onLoginSuccessCallback(profile);
                        }
                    } catch (error) {
                        console.error('Failed to get user profile:', error);
                    }
                },
            });
            gisInited = true;
        })
        .catch(error => {
            console.error(error);
            throw new Error("Failed to load Google authentication scripts. Please check your network connection.");
        });
};

/**
 * Triggers the Google Sign-In popup flow.
 */
export const signIn = () => {
    if (!gisInited) {
        alert("Google Auth is not ready yet. Please wait a moment and try again.");
        return;
    }
    if (accessToken) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
};

/**
 * Signs the user out by revoking the current access token.
 */
export const signOut = () => {
    if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
            if (onLogoutCallback) {
                onLogoutCallback();
            }
        });
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
