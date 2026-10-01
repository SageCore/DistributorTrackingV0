import { apiClient } from './client';
import { LiveEmployeeTracking } from '../types';

export const fetchLiveEmployees = async (): Promise<LiveEmployeeTracking[]> => {
  const response = await apiClient.get<LiveEmployeeTracking[]>('/v2/employees/live');
  return response.data;
};

export const fetchLiveTracking = fetchLiveEmployees;

export const fetchEmployeeLiveDetails = async (employeeId: string): Promise<LiveEmployeeTracking | null> => {
  const all = await fetchLiveEmployees();
  const found = all.find((e) => e.employeeId === employeeId || e.employee_id === employeeId);
  return found || (all.length > 0 ? all[0] : null);
};
