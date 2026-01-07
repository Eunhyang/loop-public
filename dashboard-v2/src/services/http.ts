import axios, { AxiosError } from 'axios';

const API_BASE_URL = ''; // Use relative path to support Vite proxy
// const API_BASE_URL = 'https://mcp.sosilab.synology.me'; // Direct URL blocked by CORS

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token from localStorage OR use static bypass token
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('LOOP_API_TOKEN');

  // BYPASS: Use static token if no user token exists
  const effectiveToken = token || "loop_2024_kanban_secret";

  if (effectiveToken) {
    config.headers.Authorization = `Bearer ${effectiveToken}`;
    // Also add x-api-token just in case key-based auth is preferred in some paths
    config.headers['x-api-token'] = effectiveToken;
  }
  return config;
});

// Response interceptor: Handle 401 Unauthorized
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn("401 Unauthorized - Login required but bypass active");
      // localStorage.removeItem('LOOP_API_TOKEN');
      // window.location.href = '/login'; // Redirect disabled for bypass
    }
    return Promise.reject(error);
  }
);
