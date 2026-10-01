import { apiClient } from './client';
import { ShiftReport } from '../types';

export const fetchShiftReports = async (
  filterOrEmployeeId?: string | { employeeId?: string; date?: string }
): Promise<ShiftReport[]> => {
  let employeeId: string | undefined;
  let date: string | undefined;

  if (typeof filterOrEmployeeId === 'object') {
    employeeId = filterOrEmployeeId.employeeId;
    date = filterOrEmployeeId.date;
  } else {
    employeeId = filterOrEmployeeId;
  }

  const response = await apiClient.get<ShiftReport[]>('/v2/reports/shifts', {
    params: { employee_id: employeeId, date },
  });
  return response.data;
};

export const fetchShiftReportDetail = async (shiftIdOrReportId: string): Promise<ShiftReport | null> => {
  const response = await apiClient.get<ShiftReport>(`/v2/reports/shifts/${shiftIdOrReportId}`);
  return response.data;
};
