import { apiClient } from './client';
import { Alert } from '../types';

export async function fetchAlerts(): Promise<Alert[]> {
  const response = await apiClient.get<Alert[]>('/v2/alerts');
  return response.data;
}

export async function markAlertRead(alertId: string): Promise<Alert> {
  const response = await apiClient.patch<Alert>(`/v2/alerts/${alertId}`, { isRead: true });
  return response.data;
}
