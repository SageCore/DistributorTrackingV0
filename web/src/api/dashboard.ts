import { apiClient } from './client';
import { DashboardSummary, Employee } from '../types';

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get<DashboardSummary>('/v2/dashboard/summary');
  return response.data;
};

export const fetchTodayEmployeeProgress = async (): Promise<Employee[]> => {
  const response = await apiClient.get<Employee[]>('/v2/dashboard/today-progress');
  return response.data;
};
