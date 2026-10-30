import { UserRole } from '../types';

export const AUTH_TOKEN_KEY = 'bazmanager_auth_token';
export const AUTH_USER_KEY = 'bazmanager_auth_user';
export const AUTH_ROLE_KEY = 'bazmanager_auth_role';
export const AUTH_FOCUS_KEY = 'bazmanager_auth_focus';

export interface StoredSession {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  awardFocus: string | null;
}

export function getStoredSession(): StoredSession {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const username = localStorage.getItem(AUTH_USER_KEY);
    const role = (localStorage.getItem(AUTH_ROLE_KEY) as UserRole) || null;
    const awardFocus = localStorage.getItem(AUTH_FOCUS_KEY) || null;

    if (!token || !username) {
      return { token: null, username: null, role: null, awardFocus: null };
    }

    return { token, username, role: role || 'member', awardFocus };
  } catch (err) {
    console.error('Error reading auth session from localStorage:', err);
    return { token: null, username: null, role: null, awardFocus: null };
  }
}

export function saveSession(token: string, username: string, role: string, awardFocus?: string | null): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, username);
    localStorage.setItem(AUTH_ROLE_KEY, role);
    if (awardFocus) {
      localStorage.setItem(AUTH_FOCUS_KEY, awardFocus);
    } else {
      localStorage.removeItem(AUTH_FOCUS_KEY);
    }
  } catch (err) {
    console.error('Error saving auth session:', err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_FOCUS_KEY);
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
}

let interceptorInstalled = false;

/**
 * Automatically injects the Authorization: Bearer <token> header
 * on every outgoing /api/* request whenever a valid session exists in localStorage.
 */
export function setupAuthInterceptor(): void {
  if (interceptorInstalled || typeof window === 'undefined') return;
  interceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Only intercept requests directed to /api/
    const isApiRequest = url.startsWith('/api/') || url.includes('/api/');
    const isLoginEndpoint = url.includes('/api/members?action=login') || url.includes('action=login');

    if (isApiRequest && !isLoginEndpoint) {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const headers = new Headers(init?.headers || (typeof input === 'object' && 'headers' in input ? input.headers : undefined));
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        init = { ...init, headers };
      }
    }

    const response = await originalFetch(input, init);

    // If server rejects with 401 on an authenticated call, dispatch logout event
    if (response.status === 401 && isApiRequest && !isLoginEndpoint) {
      console.warn('API returned 401 Unauthorized. Session might be invalid or expired.');
      window.dispatchEvent(new CustomEvent('bazmanager_auth_unauthorized'));
    }

    return response;
  };
}
