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
