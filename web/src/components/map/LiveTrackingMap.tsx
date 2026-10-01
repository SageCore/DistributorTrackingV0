import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LiveEmployeeTracking } from '../../types';
import { formatFreshnessStatus, getFreshnessBadgeClass } from '../../utils/freshness';

const createCustomIcon = (color: string, label?: string) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
      ">
        ${label || ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const employeeIcon = createCustomIcon('#2563eb', '👤');
const pendingLocationIcon = createCustomIcon('#f59e0b', '📍');
const deliveredLocationIcon = createCustomIcon('#10b981', '✓');
const missedLocationIcon = createCustomIcon('#ef4444', '✕');

interface LiveTrackingMapProps {
  employeeTracking?: LiveEmployeeTracking | null;
  allTrackingData?: LiveEmployeeTracking[];
  onSelectEmployee?: (employeeId: string) => void;
}

const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [map, points]);
  return null;
};

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  employeeTracking,
  allTrackingData = [],
  onSelectEmployee,
}) => {
  const boundsPoints: [number, number][] = [];

  if (employeeTracking) {
    const lastLoc = employeeTracking.latestLocation || employeeTracking.last_location;
    if (lastLoc) {
      boundsPoints.push([lastLoc.latitude, lastLoc.longitude]);
    }
    const routePts = employeeTracking.routePoints || employeeTracking.route_points || [];
    routePts.forEach((pt) => {
      boundsPoints.push([pt.latitude, pt.longitude]);
    });
    const visits = employeeTracking.assignedVisits || employeeTracking.assigned_visits || [];
    visits.forEach((v) => {
      if (v.location) {
        boundsPoints.push([v.location.latitude, v.location.longitude]);
      }
    });
  } else {
    allTrackingData.forEach((emp) => {
      const lastLoc = emp.latestLocation || emp.last_location;
      if (lastLoc) {
        boundsPoints.push([lastLoc.latitude, lastLoc.longitude]);
      }
    });
  }

  const defaultCenter: [number, number] =
    boundsPoints.length > 0 ? boundsPoints[0] : [24.8607, 67.0011];

  const currentLastLoc = employeeTracking?.latestLocation || employeeTracking?.last_location;
  const currentRoutePts = employeeTracking?.routePoints || employeeTracking?.route_points || [];
  const currentVisits = employeeTracking?.assignedVisits || employeeTracking?.assigned_visits || [];
  const empName = employeeTracking?.employeeName || employeeTracking?.employee_name || 'Employee';
  const shiftStatus = employeeTracking?.shiftStatus || employeeTracking?.shift_status || 'ACTIVE';
  const lastSeen = employeeTracking?.lastSeenAt || employeeTracking?.last_seen_at;
  const freshness = employeeTracking?.freshness || 'OFFLINE';
  const deliveredCount = employeeTracking?.deliveredCount ?? employeeTracking?.delivered_count ?? 0;
  const assignedCount = employeeTracking?.assignedCount ?? employeeTracking?.assigned_count ?? 0;

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {boundsPoints.length > 0 && <FitBounds points={boundsPoints} />}

        {/* Selected Employee Detailed Route & Markers */}
        {employeeTracking ? (
          <>
            {/* Route Polyline */}
            {currentRoutePts.length > 1 && (
              <Polyline
                positions={currentRoutePts.map((pt) => [pt.latitude, pt.longitude])}
                pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
              />
            )}

            {/* Latest Position Marker */}
            {currentLastLoc && (
              <Marker
                position={[currentLastLoc.latitude, currentLastLoc.longitude]}
                icon={employeeIcon}
              >
                <Popup>
                  <div className="map-popup-content">
                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>{empName}</h4>
                    <div>
                      <strong>Status:</strong>{' '}
                      <span className={`status-badge ${shiftStatus.toLowerCase()}`}>
                        {shiftStatus}
                      </span>
                    </div>
                    <div>
                      <strong>Freshness:</strong>{' '}
                      <span className={`freshness-badge ${getFreshnessBadgeClass(freshness)}`}>
                        {formatFreshnessStatus(freshness, lastSeen)}
                      </span>
                    </div>
                    <div>
                      <strong>Visits Progress:</strong> {deliveredCount} / {assignedCount} delivered
                    </div>
                    {(currentLastLoc.gpsAccuracyMeters !== undefined ||
                      currentLastLoc.accuracy_meters !== null) && (
                      <div>
                        <strong>GPS Accuracy:</strong>{' '}
                        {currentLastLoc.gpsAccuracyMeters ?? currentLastLoc.accuracy_meters} m
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Assigned Locations Markers */}
            {currentVisits.map((visit) => {
              if (!visit.location) return null;
              const icon =
                visit.status === 'DELIVERED'
                  ? deliveredLocationIcon
                  : visit.status === 'MISSED'
                  ? missedLocationIcon
                  : pendingLocationIcon;

              return (
                <Marker
                  key={visit.id}
                  position={[visit.location.latitude, visit.location.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="map-popup-content">
                      <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>
                        {visit.location.name}
                      </h4>
                      <div>
                        <strong>Code:</strong> {visit.location.code || '—'}
                      </div>
                      <div>
                        <strong>Status:</strong>{' '}
                        <span className={`status-badge ${visit.status.toLowerCase()}`}>
                          {visit.status}
                        </span>
                      </div>
                      {visit.status === 'DELIVERED' && (
                        <>
                          <div>
                            <strong>Delivered At:</strong>{' '}
                            {visit.deliveredAt || visit.delivered_at
                              ? new Date(visit.deliveredAt || visit.delivered_at!).toLocaleTimeString()
                              : '—'}
                          </div>
                          <div>
                            <strong>Verified Distance:</strong>{' '}
                            {visit.verifiedDistanceMeters ?? visit.verified_distance_meters ?? '—'} m
                          </div>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        ) : (
          /* All Active Employees Overview */
          allTrackingData.map((emp) => {
            const loc = emp.latestLocation || emp.last_location;
            if (!loc) return null;
            const id = emp.employeeId || emp.employee_id || '';
            const name = emp.employeeName || emp.employee_name || '';
            const del = emp.deliveredCount ?? emp.delivered_count ?? 0;
            const asg = emp.assignedCount ?? emp.assigned_count ?? 0;
            const fresh = emp.freshness || 'OFFLINE';

            return (
              <Marker
                key={id}
                position={[loc.latitude, loc.longitude]}
                icon={employeeIcon}
                eventHandlers={{
                  click: () => onSelectEmployee && onSelectEmployee(id),
                }}
              >
                <Popup>
                  <div className="map-popup-content">
                    <h4 style={{ margin: '0 0 6px 0' }}>{name}</h4>
                    <div>
                      <strong>Progress:</strong> {del} / {asg} delivered
                    </div>
                    <div>
                      <strong>Freshness:</strong>{' '}
                      <span className={`freshness-badge ${getFreshnessBadgeClass(fresh)}`}>
                        {formatFreshnessStatus(fresh, emp.lastSeenAt || emp.last_seen_at)}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
};
