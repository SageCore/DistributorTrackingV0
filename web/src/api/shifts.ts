import { apiClient } from './client';
import { Shift } from '../types';

export const fetchShifts = async (
  statusFilter?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Shift[]> => {
  const params: Record<string, string | number> = { limit, offset };
  if (statusFilter && statusFilter !== 'ALL') {
    params.status = statusFilter;
  }
  const response = await apiClient.get<Shift[]>('/api/v0/shifts', { params });
  return response.data;
};

export const fetchShiftById = async (shiftId: string): Promise<Shift> => {
  const response = await apiClient.get<Shift>(`/api/v0/shifts/${shiftId}`);
  return response.data;
};
