import { apiClient } from './client';
import { DailyAssignment } from '../types';

export const fetchAssignments = async (date: string): Promise<DailyAssignment[]> => {
  const response = await apiClient.get<DailyAssignment[]>('/v2/assignments', {
    params: { date },
  });
  return response.data;
};

export const fetchDailyAssignments = fetchAssignments;

export const createAssignment = async (
  employeeIdOrPayload: string | { employeeId: string; date: string; locationIds: string[] },
  dateArg?: string,
  locationIdsArg?: string[]
): Promise<DailyAssignment> => {
  let employeeId = '';
  let date = '';
  let locationIds: string[] = [];

  if (typeof employeeIdOrPayload === 'object') {
    employeeId = employeeIdOrPayload.employeeId;
    date = employeeIdOrPayload.date;
    locationIds = employeeIdOrPayload.locationIds;
  } else {
    employeeId = employeeIdOrPayload;
    date = dateArg || new Date().toISOString().split('T')[0];
    locationIds = locationIdsArg || [];
  }

  const response = await apiClient.post<DailyAssignment>('/v2/assignments', {
    employee_id: employeeId,
    date,
    assigned_location_ids: locationIds,
  });
  return response.data;
};

export const createDailyAssignment = createAssignment;
