import { apiClient } from './client';
import { ShiftReport } from '../types';

let mockReports: ShiftReport[] = [
  {
    id: 'rep-101',
    shift_id: 'sh-101',
    shiftId: 'sh-101',
    employee_id: 'emp-1',
    employeeId: 'emp-1',
    employee_name: 'Ahmed Khan',
    employeeName: 'Ahmed Khan',
    employee_code: 'EMP-001',
    employeeCode: 'EMP-001',
    date: new Date().toISOString().split('T')[0],
    started_at: new Date(Date.now() - 14400000).toISOString(),
    startTime: new Date(Date.now() - 14400000).toISOString(),
    ended_at: null,
    endTime: null,
    duration_minutes: 240,
    durationMinutes: 240,
    status: 'ACTIVE',
    assigned_count: 10,
    totalAssigned: 10,
    delivered_count: 7,
    deliveredCount: 7,
    missed_count: 0,
    missedCount: 0,
    pending_count: 3,
    pendingCount: 3,
    completion_percentage: 70,
    completionPercentage: 70,
    routePoints: [
      {
        id: 'p1',
        shift_id: 'sh-101',
        latitude: 31.4800,
        longitude: 74.3200,
        accuracy_meters: 10,
        altitude_meters: null,
        speed_mps: null,
        bearing_degrees: null,
        device_timestamp: new Date(Date.now() - 14400000).toISOString(),
        recorded_timestamp: null,
        is_mock: false,
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'p2',
        shift_id: 'sh-101',
        latitude: 31.5085,
        longitude: 74.3524,
        accuracy_meters: 15,
        altitude_meters: null,
        speed_mps: null,
        bearing_degrees: null,
        device_timestamp: new Date(Date.now() - 3600000).toISOString(),
        recorded_timestamp: null,
        is_mock: false,
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ],
    assignedVisits: [
      {
        id: 'vst-1',
        location: {
          id: 'loc-1',
          name: 'Metro Cash & Carry (Model Town)',
          code: 'LOC-101',
          address: 'Block M, Model Town',
          latitude: 31.4851,
          longitude: 74.3262,
          active: true,
        },
        status: 'DELIVERED',
        deliveredAt: new Date(Date.now() - 10000000).toISOString(),
        verifiedDistanceMeters: 18,
        gpsAccuracyMeters: 12,
      },
      {
        id: 'vst-2',
        location: {
          id: 'loc-2',
          name: 'Hyperstar Supermarket (Gulberg)',
          code: 'LOC-102',
          address: 'MM Alam Road, Gulberg',
          latitude: 31.5085,
          longitude: 74.3524,
          active: true,
        },
        status: 'DELIVERED',
        deliveredAt: new Date(Date.now() - 5000000).toISOString(),
        verifiedDistanceMeters: 25,
        gpsAccuracyMeters: 15,
      },
    ],
  },
];

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

  try {
    const response = await apiClient.get<ShiftReport[]>('/v2/reports/shifts', {
      params: { employee_id: employeeId, date },
    });
    return response.data;
  } catch {
    let filtered = [...mockReports];
    if (employeeId) {
      filtered = filtered.filter((r) => r.employeeId === employeeId || r.employee_id === employeeId);
    }
    if (date) {
      filtered = filtered.filter((r) => r.date === date);
    }
    return filtered;
  }
};

export const fetchShiftReportDetail = async (shiftIdOrReportId: string): Promise<ShiftReport | null> => {
  try {
    const response = await apiClient.get<ShiftReport>(`/v2/reports/shifts/${shiftIdOrReportId}`);
    return response.data;
  } catch {
    const found = mockReports.find(
      (r) => r.id === shiftIdOrReportId || r.shiftId === shiftIdOrReportId || r.shift_id === shiftIdOrReportId
    );
    return found || mockReports[0];
  }
};
