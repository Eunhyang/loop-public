import axios, { AxiosError } from 'axios';
import { authStorage } from '../features/auth/storage';

const API_BASE_URL = ''; // Use relative path to support Vite proxy
// const API_BASE_URL = 'https://mcp.sosilab.synology.me'; // Direct URL blocked by CORS

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token from localStorage
httpClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 Unauthorized
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      authStorage.clearAll();
      // Respect SPA basename in production
      const loginPath = import.meta.env.PROD ? '/v2/login' : '/login';
      // Prevent infinite redirect loop if already on login page
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);
