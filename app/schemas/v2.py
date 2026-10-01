from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    email: Optional[str] = None
    role: str
    distributor_name: str

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


# Employee Schemas
class EmployeeCreate(BaseModel):
    name: str
    employee_code: Optional[str] = None
    employeeCode: Optional[str] = None
    phone: Optional[str] = None
    login_identifier: Optional[str] = None
    loginIdentifier: Optional[str] = None
    password: Optional[str] = None
    active: bool = True


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    employee_code: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None


class EmployeeResponse(BaseModel):
    id: UUID
    distributor_id: str
    employee_code: str
    employeeCode: Optional[str] = None
    name: str
    phone: Optional[str] = None
    active: bool
    current_shift_status: str
    currentShiftStatus: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    lastSeenAt: Optional[datetime] = None
    freshness: Optional[str] = "OFFLINE"
    app_version: Optional[str] = "v1.4.2"
    device_info: Optional[str] = None
    assignedCount: Optional[int] = 0
    deliveredCount: Optional[int] = 0
    pendingCount: Optional[int] = 0
    missedCount: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# Customer Location Schemas
class LocationCreate(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contactName: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    latitude: float
    longitude: float
    active: bool = True


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    active: Optional[bool] = None


class LocationResponse(BaseModel):
    id: UUID
    distributor_id: str
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contactName: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    latitude: float
    longitude: float
    active: bool

    model_config = ConfigDict(from_attributes=True)


# Assigned Visit Schemas
class AssignedVisitResponse(BaseModel):
    id: UUID
    assignment_id: UUID
    location_id: UUID
    location: Optional[LocationResponse] = None
    status: str
    delivered_at: Optional[datetime] = None
    deliveredAt: Optional[datetime] = None
    verified_distance_meters: Optional[float] = None
    verifiedDistanceMeters: Optional[float] = None
    gps_accuracy_meters: Optional[float] = None
    gpsAccuracyMeters: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# Daily Assignment Schemas
class DailyAssignmentCreate(BaseModel):
    employee_id: Optional[UUID] = None
    employeeId: Optional[UUID] = None
    date: str
    assigned_location_ids: Optional[List[UUID]] = None
    locationIds: Optional[List[UUID]] = None


class DailyAssignmentResponse(BaseModel):
    id: UUID
    employee_id: UUID
    employeeId: Optional[UUID] = None
    employee_name: Optional[str] = None
    employeeName: Optional[str] = None
    employee_code: Optional[str] = None
    employeeCode: Optional[str] = None
    date: str
    assignedVisits: List[AssignedVisitResponse] = []
    shiftStatus: Optional[str] = "NOT_STARTED"
    deliveredCount: int = 0
    pendingCount: int = 0
    missedCount: int = 0

    model_config = ConfigDict(from_attributes=True)


# Live Employee Tracking Schema
class RoutePointResponse(BaseModel):
    id: UUID
    shift_id: UUID
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None
    gpsAccuracyMeters: Optional[float] = None
    speed_mps: Optional[float] = None
    speedMps: Optional[float] = None
    bearing_degrees: Optional[float] = None
    bearingDegrees: Optional[float] = None
    device_timestamp: datetime
    deviceTimestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LiveEmployeeTrackingResponse(BaseModel):
    employeeId: UUID
    employee_id: Optional[UUID] = None
    employeeName: str
    employee_name: Optional[str] = None
    employeeCode: str
    employee_code: Optional[str] = None
    shiftStatus: str
    shift_status: Optional[str] = None
    shiftStartTime: Optional[datetime] = None
    latestLocation: Optional[RoutePointResponse] = None
    last_location: Optional[RoutePointResponse] = None
    lastSeenAt: Optional[datetime] = None
    freshness: str = "OFFLINE"
    deliveredCount: int = 0
    assignedCount: int = 0
    pendingCount: int = 0
    missedCount: int = 0
    routePoints: List[RoutePointResponse] = []
    assignedVisits: List[AssignedVisitResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Dashboard Summary Schema
class DashboardSummaryResponse(BaseModel):
    total_employees: int
    totalEmployees: int
    on_shift: int
    activeShifts: int
    visits_assigned_today: int
    totalAssignedToday: int
    delivered_today: int
    deliveredToday: int
    pending_today: int
    pendingToday: int
    missed_today: int
    missedToday: int


# Shift Report Schema
class ShiftReportResponse(BaseModel):
    id: UUID
    shiftId: Optional[UUID] = None
    employeeId: Optional[UUID] = None
    employeeName: str
    employeeCode: str
    date: str
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    durationMinutes: Optional[int] = None
    status: str
    totalAssigned: int
    deliveredCount: int
    missedCount: int
    pendingCount: int
    completionPercentage: float
    routePoints: List[RoutePointResponse] = []
    assignedVisits: List[AssignedVisitResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Alert Schema
class AlertResponse(BaseModel):
    id: UUID
    employeeId: Optional[UUID] = None
    employeeName: Optional[str] = None
    shiftId: Optional[UUID] = None
    type: str = "MISSED_VISIT"
    message: str
    createdAt: datetime
    isRead: bool

    model_config = ConfigDict(from_attributes=True)
