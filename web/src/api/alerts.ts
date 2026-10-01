import client from './client';
import { Alert } from '../types';

const DEMO_ALERTS: Alert[] = [
  {
    id: 'alt-1',
    distributorId: 'dist-1',
    employeeId: 'emp-2',
    employeeName: 'Bilal Ahmed',
    shiftId: 'shift-102',
    type: 'MISSED_VISITS',
    message: 'Bilal Ahmed completed shift with 2 missed assigned locations.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
  },
  {
    id: 'alt-2',
    distributorId: 'dist-1',
    employeeId: 'emp-3',
    employeeName: 'Hamza Ali',
    shiftId: 'shift-103',
    type: 'MISSED_VISITS',
    message: 'Hamza Ali completed shift with 1 missed assigned location.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
  },
];

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const response = await client.get('/v2/alerts');
    return response.data;
  } catch (error) {
    console.warn('Backend GET /v2/alerts not available, using demo fallback.');
    return DEMO_ALERTS;
  }
}

export async function markAlertRead(alertId: string): Promise<Alert> {
  try {
    const response = await client.patch(`/v2/alerts/${alertId}`, { isRead: true });
    return response.data;
  } catch (error) {
    console.warn(`Backend PATCH /v2/alerts/${alertId} not available, updating local demo state.`);
    const alert = DEMO_ALERTS.find((a) => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      return { ...alert };
    }
    throw error;
  }
}
