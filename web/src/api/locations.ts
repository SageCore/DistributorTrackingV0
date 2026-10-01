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

export const fetchLocations = async (): Promise<CustomerLocation[]> => {
  const response = await apiClient.get<CustomerLocation[]>('/v2/locations');
  return response.data;
};

export const fetchLocationById = async (id: string): Promise<CustomerLocation> => {
  const response = await apiClient.get<CustomerLocation>(`/v2/locations/${id}`);
  return response.data;
};

export const fetchLocationDetail = fetchLocationById;

export const createLocation = async (data: Partial<CustomerLocation>): Promise<CustomerLocation> => {
  const payload = {
    name: data.name,
    code: data.code,
    address: data.address,
    contact_name: data.contactName || data.contact_name,
    phone: data.phone,
    notes: data.notes,
    latitude: data.latitude,
    longitude: data.longitude,
    active: data.active ?? true,
  };
  const response = await apiClient.post<CustomerLocation>('/v2/locations', payload);
  return response.data;
};

export const updateLocation = async (id: string, data: Partial<CustomerLocation>): Promise<CustomerLocation> => {
  const response = await apiClient.patch<CustomerLocation>(`/v2/locations/${id}`, data);
  return response.data;
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
