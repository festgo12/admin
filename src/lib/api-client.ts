import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * On 401 the session is expired/invalid: clear stored tokens and send the
 * user back to the login page. The login page itself only calls
 * `/auth/login` and `/auth/profile` on boot, and `/auth/profile` failure is
 * already handled by the auth provider, so a plain reload-based redirect
 * here cannot loop. We still guard: if the failing request was made without
 * an access token (e.g. a probe), don't redirect.
 */
let isRedirectingToLogin = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestConfig = error.config as
        | (InternalAxiosRequestConfig & { skipAuthRedirect?: boolean })
        | undefined;

      // Never redirect for requests that opted out, or that were made while
      // already unauthenticated (nothing to clear).
      const hadToken = Boolean(localStorage.getItem('accessToken'));
      if (!requestConfig?.skipAuthRedirect && hadToken && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Full navigation so the auth provider re-runs its boot check.
        window.location.assign('/');
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
