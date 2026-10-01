import { apiClient } from './client';
import { CustomerLocation, RoutePoint } from '../types';

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

// Customer / Shop Locations Management
let mockLocations: CustomerLocation[] = [
  {
    id: 'loc-1',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    name: 'Metro Cash & Carry (Model Town)',
    code: 'LOC-101',
    address: 'Block M, Model Town, Lahore',
    contact_name: 'Mr. Tariq',
    contactName: 'Mr. Tariq',
    phone: '+92 321 1112233',
    latitude: 31.4851,
    longitude: 74.3262,
    active: true,
  },
  {
    id: 'loc-2',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    name: 'Hyperstar Supermarket (Gulberg)',
    code: 'LOC-102',
    address: 'MM Alam Road, Gulberg III, Lahore',
    contact_name: 'Zahid Hussain',
    contactName: 'Zahid Hussain',
    phone: '+92 321 4445566',
    latitude: 31.5085,
    longitude: 74.3524,
    active: true,
  },
  {
    id: 'loc-3',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    name: 'Al-Fateh Shopping Mall (Johar Town)',
    code: 'LOC-103',
    address: 'G1 Market, Johar Town, Lahore',
    contact_name: 'Salman Butt',
    contactName: 'Salman Butt',
    phone: '+92 321 7778899',
    latitude: 31.4697,
    longitude: 74.2728,
    active: true,
  },
  {
    id: 'loc-4',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    name: 'Esajee & Co. (DHA Phase 3)',
    code: 'LOC-104',
    address: 'Y Block Market, DHA Phase 3, Lahore',
    contact_name: 'Kamran Ali',
    contactName: 'Kamran Ali',
    phone: '+92 322 1239876',
    latitude: 31.4722,
    longitude: 74.3792,
    active: true,
  },
  {
    id: 'loc-5',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    name: 'Imtiaz Super Market (DHA Phase 5)',
    code: 'LOC-105',
    address: 'Bedian Road, DHA Phase 5, Lahore',
    contact_name: 'Haroon Rashid',
    contactName: 'Haroon Rashid',
    phone: '+92 322 4567890',
    latitude: 31.4612,
    longitude: 74.4015,
    active: true,
  },
  {
    id: 'loc-6',
    distributor_id: 'dist-1',
    distributorId: 'dist-1',
    name: 'Pakeeza Department Store (Faisal Town)',
    code: 'LOC-106',
    address: 'Faisal Town Main Blvd, Lahore',
    contact_name: 'Akram Sheikh',
    contactName: 'Akram Sheikh',
    phone: '+92 323 8889900',
    latitude: 31.4789,
    longitude: 74.3095,
    active: true,
  },
];

export const fetchLocations = async (): Promise<CustomerLocation[]> => {
  try {
    const response = await apiClient.get<CustomerLocation[]>('/v2/locations');
    return response.data;
  } catch {
    return [...mockLocations];
  }
};

export const fetchLocationById = async (id: string): Promise<CustomerLocation> => {
  try {
    const response = await apiClient.get<CustomerLocation>(`/v2/locations/${id}`);
    return response.data;
  } catch {
    const found = mockLocations.find((l) => l.id === id);
    if (found) return found;
    return mockLocations[0];
  }
};

export const fetchLocationDetail = fetchLocationById;

export const createLocation = async (data: Partial<CustomerLocation>): Promise<CustomerLocation> => {
  try {
    const response = await apiClient.post<CustomerLocation>('/v2/locations', data);
    return response.data;
  } catch {
    const newLoc: CustomerLocation = {
      id: 'loc-' + Date.now(),
      distributor_id: 'dist-1',
      distributorId: 'dist-1',
      name: data.name || 'New Location',
      code: data.code || 'LOC-' + Math.floor(100 + Math.random() * 900),
      address: data.address || '',
      contact_name: data.contact_name || data.contactName || '',
      contactName: data.contactName || data.contact_name || '',
      phone: data.phone || '',
      notes: data.notes || '',
      latitude: data.latitude || 31.5204,
      longitude: data.longitude || 74.3587,
      active: data.active ?? true,
    };
    mockLocations.unshift(newLoc);
    return newLoc;
  }
};

export const updateLocation = async (id: string, data: Partial<CustomerLocation>): Promise<CustomerLocation> => {
  try {
    const response = await apiClient.patch<CustomerLocation>(`/v2/locations/${id}`, data);
    return response.data;
  } catch {
    const idx = mockLocations.findIndex((l) => l.id === id);
    if (idx !== -1) {
      mockLocations[idx] = { ...mockLocations[idx], ...data };
      return mockLocations[idx];
    }
    throw new Error('Location not found');
  }
};

export const toggleLocationActive = async (
  params: { locationId: string; active: boolean } | string,
  activeArg?: boolean
): Promise<CustomerLocation> => {
  if (typeof params === 'object') {
    return updateLocation(params.locationId, { active: params.active });
  }
  return updateLocation(params, { active: activeArg ?? true });
};
