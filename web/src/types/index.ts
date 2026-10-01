export type ShiftStatus = 'ACTIVE' | 'COMPLETED' | 'NOT_STARTED' | 'OFFLINE';
export type VisitStatus = 'PENDING' | 'DELIVERED' | 'MISSED';
export type FreshnessStatus = 'FRESH' | 'STALE' | 'OFFLINE';
export type GpsQuality = 'EXCELLENT' | 'ACCEPTABLE' | 'LOW CONFIDENCE' | 'POOR';

export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  role: string;
  distributor_name?: string;
  distributorName?: string;
  distributorId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

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
  shift_id?: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
  altitude_meters?: number | null;
  speed_mps?: number | null;
  bearing_degrees?: number | null;
  device_timestamp: string;
  recorded_timestamp?: string | null;
  is_mock?: boolean;
  received_at?: string;
  created_at?: string;
  // camelCase aliases
  shiftId?: string;
  gpsAccuracyMeters?: number | null;
  speedMps?: number | null;
  bearingDegrees?: number | null;
  deviceTimestamp?: string;
}

export interface HealthCheckResponse {
  status: string;
  database: string;
}

export interface CustomerLocation {
  id: string;
  distributor_id?: string;
  distributorId?: string;
  name: string;
  code?: string;
  address?: string;
  contact_name?: string;
  contactName?: string;
  phone?: string;
  notes?: string;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface Employee {
  id: string;
  employeeId?: string;
  distributor_id?: string;
  distributorId?: string;
  employee_code?: string;
  employeeCode: string;
  name: string;
  phone?: string;
  active: boolean;
  current_shift_status?: ShiftStatus;
  currentShiftStatus?: ShiftStatus;
  last_seen_at?: string | null;
  lastSeenAt?: string | null;
  freshness?: FreshnessStatus;
  app_version?: string;
  appVersion?: string;
  device_info?: string;
  deviceInfo?: string;
  deviceModel?: string;
  deviceId?: string;
  batteryLevel?: number;
  loginIdentifier?: string;
  visitsToday?: number;
  assignedCount?: number;
  deliveredCount?: number;
  pendingCount?: number;
  missedCount?: number;
  latestGpsAccuracyMeters?: number;
  total_assigned_today?: number;
  total_delivered_today?: number;
}

export interface AssignedVisit {
  id: string;
  assignment_id?: string;
  assignmentId?: string;
  location_id?: string;
  locationId?: string;
  location_name?: string;
  locationName?: string;
  location_code?: string;
  locationCode?: string;
  latitude?: number;
  longitude?: number;
  location?: CustomerLocation;
  status: VisitStatus;
  delivered_at?: string | null;
  deliveredAt?: string | null;
  verified_distance_meters?: number | null;
  verifiedDistanceMeters?: number | null;
  gps_accuracy_meters?: number | null;
  gpsAccuracyMeters?: number | null;
  employee_coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface DailyAssignment {
  id: string;
  employee_id?: string;
  employeeId: string;
  employee_name?: string;
  employeeName?: string;
  employee_code?: string;
  employeeCode?: string;
  date: string;
  assigned_location_ids?: string[];
  assignedLocationIds?: string[];
  assigned_locations?: CustomerLocation[];
  assignedLocations?: CustomerLocation[];
  assignedVisits: AssignedVisit[];
  shiftStatus?: ShiftStatus;
  deliveredCount: number;
  pendingCount: number;
  missedCount: number;
}

export interface LiveEmployeeTracking {
  employee_id?: string;
  employeeId: string;
  employee_name?: string;
  employeeName: string;
  employee_code?: string;
  employeeCode: string;
  shift_status?: ShiftStatus;
  shiftStatus: ShiftStatus;
  shift_start_time?: string | null;
  shiftStartTime?: string | null;
  last_location?: RoutePoint | null;
  latestLocation?: RoutePoint | null;
  last_seen_at?: string | null;
  lastSeenAt?: string | null;
  freshness: FreshnessStatus;
  delivered_count?: number;
  deliveredCount: number;
  assigned_count?: number;
  assignedCount: number;
  pendingCount?: number;
  missedCount?: number;
  route_points?: RoutePoint[];
  routePoints?: RoutePoint[];
  assigned_visits?: AssignedVisit[];
  assignedVisits?: AssignedVisit[];
}

export interface ShiftReport {
  id: string;
  shift_id?: string;
  shiftId?: string;
  employee_id?: string;
  employeeId?: string;
  employee_name?: string;
  employeeName: string;
  employee_code?: string;
  employeeCode: string;
  date: string;
  started_at?: string;
  startTime?: string;
  ended_at?: string | null;
  endTime?: string | null;
  duration_minutes?: number | null;
  durationMinutes?: number | null;
  status: ShiftStatus;
  assigned_count?: number;
  totalAssigned: number;
  delivered_count?: number;
  deliveredCount: number;
  missed_count?: number;
  missedCount: number;
  pending_count?: number;
  pendingCount?: number;
  completion_percentage?: number;
  completionPercentage: number;
  route_points?: RoutePoint[];
  routePoints?: RoutePoint[];
  assignedVisits: AssignedVisit[];
}

export interface Alert {
  id: string;
  distributorId?: string;
  employeeId?: string;
  employee_id?: string;
  employeeName?: string;
  shiftId?: string;
  shift_id?: string;
  type: 'MISSED_VISIT' | 'MISSED_VISITS';
  message: string;
  created_at?: string;
  createdAt: string;
  read?: boolean;
  isRead?: boolean;
}

export interface DashboardSummary {
  total_employees?: number;
  totalEmployees: number;
  on_shift?: number;
  activeShifts: number;
  visits_assigned_today?: number;
  totalAssignedToday: number;
  delivered_today?: number;
  deliveredToday: number;
  pending_today?: number;
  pendingToday: number;
  missed_today?: number;
  missedToday: number;
}
