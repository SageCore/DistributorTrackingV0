import { apiClient } from './client';
import { DailyAssignment } from '../types';
import { fetchLocations } from './locations';

let mockAssignments: DailyAssignment[] = [
  {
    id: 'asgn-1',
    employeeId: 'emp-1',
    employee_id: 'emp-1',
    employeeName: 'Ahmed Khan',
    employee_name: 'Ahmed Khan',
    employeeCode: 'EMP-001',
    date: new Date().toISOString().split('T')[0],
    assignedLocationIds: ['loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5', 'loc-6'],
    assigned_location_ids: ['loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5', 'loc-6'],
    assignedVisits: [
      { id: 'v1', status: 'DELIVERED', location: { id: 'loc-1', name: 'Metro Cash & Carry', active: true, latitude: 31.4851, longitude: 74.3262 } },
      { id: 'v2', status: 'DELIVERED', location: { id: 'loc-2', name: 'Hyperstar Supermarket', active: true, latitude: 31.5085, longitude: 74.3524 } },
      { id: 'v3', status: 'PENDING', location: { id: 'loc-3', name: 'Al-Fateh Mall', active: true, latitude: 31.4697, longitude: 74.2728 } },
    ],
    shiftStatus: 'ACTIVE',
    deliveredCount: 4,
    pendingCount: 2,
    missedCount: 0,
  },
  {
    id: 'asgn-2',
    employeeId: 'emp-2',
    employee_id: 'emp-2',
    employeeName: 'Bilal Ahmed',
    employee_name: 'Bilal Ahmed',
    employeeCode: 'EMP-002',
    date: new Date().toISOString().split('T')[0],
    assignedLocationIds: ['loc-2', 'loc-4', 'loc-6'],
    assigned_location_ids: ['loc-2', 'loc-4', 'loc-6'],
    assignedVisits: [
      { id: 'v4', status: 'DELIVERED', location: { id: 'loc-4', name: 'Esajee & Co.', active: true, latitude: 31.4722, longitude: 74.3792 } },
      { id: 'v5', status: 'PENDING', location: { id: 'loc-5', name: 'Imtiaz Market', active: true, latitude: 31.4612, longitude: 74.4015 } },
    ],
    shiftStatus: 'ACTIVE',
    deliveredCount: 1,
    pendingCount: 2,
    missedCount: 0,
  },
  {
    id: 'asgn-3',
    employeeId: 'emp-3',
    employee_id: 'emp-3',
    employeeName: 'Hamza Ali',
    employee_name: 'Hamza Ali',
    employeeCode: 'EMP-003',
    date: new Date().toISOString().split('T')[0],
    assignedLocationIds: ['loc-1', 'loc-3', 'loc-5'],
    assigned_location_ids: ['loc-1', 'loc-3', 'loc-5'],
    assignedVisits: [
      { id: 'v6', status: 'DELIVERED', location: { id: 'loc-1', name: 'Metro Cash & Carry', active: true, latitude: 31.4851, longitude: 74.3262 } },
      { id: 'v7', status: 'MISSED', location: { id: 'loc-5', name: 'Imtiaz Market', active: true, latitude: 31.4612, longitude: 74.4015 } },
    ],
    shiftStatus: 'COMPLETED',
    deliveredCount: 2,
    pendingCount: 0,
    missedCount: 1,
  },
];

export const fetchAssignments = async (date: string): Promise<DailyAssignment[]> => {
  try {
    const response = await apiClient.get<DailyAssignment[]>('/v2/assignments', {
      params: { date },
    });
    return response.data;
  } catch {
    const allLocations = await fetchLocations();
    const filtered = mockAssignments.filter((a) => a.date === date || a.date === new Date().toISOString().split('T')[0]);
    
    return filtered.map((asgn) => ({
      ...asgn,
      date,
      assignedLocations: allLocations.filter((l) => asgn.assignedLocationIds?.includes(l.id)),
    }));
  }
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

  try {
    const response = await apiClient.post<DailyAssignment>('/v2/assignments', {
      employee_id: employeeId,
      date,
      assigned_location_ids: locationIds,
    });
    return response.data;
  } catch {
    const newAsgn: DailyAssignment = {
      id: 'asgn-' + Date.now(),
      employeeId: employeeId,
      employee_id: employeeId,
      date,
      assignedLocationIds: locationIds,
      assigned_location_ids: locationIds,
      assignedVisits: locationIds.map((id, idx) => ({
        id: `v-${Date.now()}-${idx}`,
        locationId: id,
        status: 'PENDING',
      })),
      shiftStatus: 'NOT_STARTED',
      deliveredCount: 0,
      pendingCount: locationIds.length,
      missedCount: 0,
    };
    mockAssignments = mockAssignments.filter((a) => !(a.employeeId === employeeId && a.date === date));
    mockAssignments.push(newAsgn);
    return newAsgn;
  }
};

export const createDailyAssignment = createAssignment;
