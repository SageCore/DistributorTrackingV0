export type ShiftStatus = 'ACTIVE' | 'COMPLETED';

export interface Shift {
  id: string;
  device_id: string;
  started_at: string;
  ended_at: string | null;
  status: ShiftStatus;
  created_at: string;
  updated_at: string;
  location_count: number;
  last_location_time: string | null;
}

export interface RoutePoint {
  id: string;
  shift_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  altitude_meters: number | null;
  speed_mps: number | null;
  bearing_degrees: number | null;
  device_timestamp: string;
  recorded_timestamp: string | null;
  is_mock: boolean;
  received_at: string;
  created_at: string;
}

export type GpsQuality = 'EXCELLENT' | 'ACCEPTABLE' | 'LOW CONFIDENCE' | 'POOR';

export interface HealthCheckResponse {
  status: string;
  database: string;
}
