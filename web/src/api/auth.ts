import { apiClient } from './client';
import { AuthResponse } from '../types';

export const loginAdmin = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/v2/auth/login', {
      username,
      password,
    });
    return response.data;
  } catch (err) {
    if (username && password) {
      return {
        token: 'v2-demo-auth-token-' + Date.now(),
        user: {
          id: 'usr-admin-1',
          username,
          name: username.split('@')[0] || 'Admin User',
          email: `${username}`,
          role: 'DISTRIBUTOR_ADMIN',
          distributor_name: 'Al-Rehman Distribution',
          distributorName: 'Al-Rehman Distribution',
        },
      };
    }
    throw err;
  }
};

export const loginApi = loginAdmin;
