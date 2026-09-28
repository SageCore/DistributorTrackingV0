import { apiClient } from './client';
import { HealthCheckResponse } from '../types';

export const checkHealth = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<HealthCheckResponse>('/health');
  return response.data;
};
