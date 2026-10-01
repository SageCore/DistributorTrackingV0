import axios from 'axios';
import { ENV } from '../config/env';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': ENV.API_KEY,
  },
});

// Interceptor to attach Authorization Bearer token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('v2_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized / expired auth responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 if unauthenticated
      if (localStorage.getItem('v2_auth_token')) {
        localStorage.removeItem('v2_auth_token');
        localStorage.removeItem('v2_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
