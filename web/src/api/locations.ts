import { apiClient } from './client';
import { RoutePoint } from '../types';

export const fetchShiftLocations = async (
  shiftId: string,
  limit: number = 1000
): Promise<RoutePoint[]> => {
  const response = await apiClient.get<RoutePoint[]>(
    `/v0/shifts/${shiftId}/locations`,
    {
      params: { order: 'asc', limit },
    }
  );
  return response.data;
};
