import { apiClient } from './client';
import { Employee, ShiftReport } from '../types';

let mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeId: 'emp-1',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    employee_code: 'EMP-001',
    employeeCode: 'EMP-001',
    name: 'Ahmed Khan',
    phone: '+92 300 1234567',
    active: true,
    current_shift_status: 'ACTIVE',
    currentShiftStatus: 'ACTIVE',
    last_seen_at: new Date(Date.now() - 25000).toISOString(),
    lastSeenAt: new Date(Date.now() - 25000).toISOString(),
    freshness: 'FRESH',
    app_version: 'v1.4.2',
    appVersion: 'v1.4.2',
    device_info: 'Samsung Galaxy A54 (Android 14)',
    deviceModel: 'Samsung Galaxy A54 (Android 14)',
    visitsToday: 10,
    assignedCount: 10,
    deliveredCount: 7,
    pendingCount: 3,
    missedCount: 0,
    latestGpsAccuracyMeters: 13,
  },
  {
    id: 'emp-2',
    employeeId: 'emp-2',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    employee_code: 'EMP-002',
    employeeCode: 'EMP-002',
    name: 'Bilal Ahmed',
    phone: '+92 301 7654321',
    active: true,
    current_shift_status: 'ACTIVE',
    currentShiftStatus: 'ACTIVE',
    last_seen_at: new Date(Date.now() - 180000).toISOString(),
    lastSeenAt: new Date(Date.now() - 180000).toISOString(),
    freshness: 'STALE',
    app_version: 'v1.4.2',
    appVersion: 'v1.4.2',
    device_info: 'Xiaomi Redmi Note 12',
    deviceModel: 'Xiaomi Redmi Note 12',
    visitsToday: 8,
    assignedCount: 8,
    deliveredCount: 4,
    pendingCount: 4,
    missedCount: 0,
    latestGpsAccuracyMeters: 25,
  },
  {
    id: 'emp-3',
    employeeId: 'emp-3',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    employee_code: 'EMP-003',
    employeeCode: 'EMP-003',
    name: 'Hamza Ali',
    phone: '+92 302 9876543',
    active: true,
    current_shift_status: 'COMPLETED',
    currentShiftStatus: 'COMPLETED',
    last_seen_at: new Date(Date.now() - 3600000).toISOString(),
    lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
    freshness: 'OFFLINE',
    app_version: 'v1.4.1',
    appVersion: 'v1.4.1',
    device_info: 'Realme 11 Pro',
    deviceModel: 'Realme 11 Pro',
    visitsToday: 12,
    assignedCount: 12,
    deliveredCount: 11,
    pendingCount: 0,
    missedCount: 1,
    latestGpsAccuracyMeters: 18,
  },
];

export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await apiClient.get<Employee[]>('/v2/employees');
    return response.data;
  } catch {
    return [...mockEmployees];
  }
};

export const fetchEmployeeById = async (employeeId: string): Promise<Employee> => {
  try {
    const response = await apiClient.get<Employee>(`/v2/employees/${employeeId}`);
    return response.data;
  } catch {
    const found = mockEmployees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    if (found) return found;
    return mockEmployees[0];
  }
};

export const fetchEmployeeDetail = fetchEmployeeById;

export const createEmployee = async (data: any): Promise<Employee> => {
  try {
    const response = await apiClient.post<Employee>('/v2/employees', data);
    return response.data;
  } catch {
    const code = data.employeeCode || data.employee_code || 'EMP-' + Math.floor(100 + Math.random() * 900);
    const newEmp: Employee = {
      id: 'emp-' + Date.now(),
      employeeId: 'emp-' + Date.now(),
      distributor_id: 'dist-1',
      distributorId: 'dist-1',
      employee_code: code,
      employeeCode: code,
      name: data.name || 'New Employee',
      phone: data.phone || '',
      active: data.active ?? true,
      current_shift_status: 'NOT_STARTED',
      currentShiftStatus: 'NOT_STARTED',
      last_seen_at: null,
      lastSeenAt: null,
      freshness: 'OFFLINE',
      app_version: 'v1.4.2',
      appVersion: 'v1.4.2',
      loginIdentifier: data.loginIdentifier || data.name?.toLowerCase().replace(/\s+/g, '.'),
      visitsToday: 0,
      assignedCount: 0,
      deliveredCount: 0,
      pendingCount: 0,
      missedCount: 0,
    };
    mockEmployees.unshift(newEmp);
    return newEmp;
  }
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee> => {
  try {
    const response = await apiClient.patch<Employee>(`/v2/employees/${id}`, data);
    return response.data;
  } catch {
    const idx = mockEmployees.findIndex((e) => e.id === id || e.employeeId === id);
    if (idx !== -1) {
      mockEmployees[idx] = { ...mockEmployees[idx], ...data };
      return mockEmployees[idx];
    }
    throw new Error('Employee not found');
  }
};

export const toggleEmployeeActive = async (
  params: { employeeId: string; active: boolean } | string,
  activeArg?: boolean
): Promise<Employee> => {
  if (typeof params === 'object') {
    return updateEmployee(params.employeeId, { active: params.active });
  }
  return updateEmployee(params, { active: activeArg ?? true });
};

export const fetchEmployeeShifts = async (employeeId: string): Promise<ShiftReport[]> => {
  try {
    const response = await apiClient.get<ShiftReport[]>(`/v2/employees/${employeeId}/shifts`);
    return response.data;
  } catch {
    return [
      {
        id: 'rep-1',
        shift_id: 'sh-101',
        shiftId: 'sh-101',
        employee_id: employeeId,
        employeeId: employeeId,
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
        assignedVisits: [],
      },
    ];
  }
};

export const fetchEmployeeShiftsHistory = fetchEmployeeShifts;
