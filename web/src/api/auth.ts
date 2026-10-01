import { apiClient } from './client';
import { AuthResponse } from '../types';

export const loginAdmin = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/v2/auth/login', {
    username,
    password,
  });
  return response.data;
};

export const loginApi = loginAdmin;
