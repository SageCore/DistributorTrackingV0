import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShiftReport } from '../../types';

const createCustomIcon = (color: string, label: string) => {
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
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const startIcon = createCustomIcon('#2563eb', 'S');
const endIcon = createCustomIcon('#475569', 'E');
const deliveredIcon = createCustomIcon('#10b981', '✓');
const missedIcon = createCustomIcon('#ef4444', '✕');
const pendingIcon = createCustomIcon('#f59e0b', '📍');

interface ShiftReportMapProps {
  report: ShiftReport;
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

export const ShiftReportMap: React.FC<ShiftReportMapProps> = ({ report }) => {
  const routePts = report.routePoints || report.route_points || [];
  const visits = report.assignedVisits || (report as any).visits || [];

  const boundsPoints: [number, number][] = [];

  routePts.forEach((pt) => {
    boundsPoints.push([pt.latitude, pt.longitude]);
  });

  visits.forEach((visit: any) => {
    if (visit.location) {
      boundsPoints.push([visit.location.latitude, visit.location.longitude]);
    }
  });

  const defaultCenter: [number, number] =
    boundsPoints.length > 0 ? boundsPoints[0] : [24.8607, 67.0011];

  const firstPoint = routePts[0];
  const lastPoint = routePts.length > 1 ? routePts[routePts.length - 1] : null;

  return (
    <div style={{ height: '380px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
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

        {/* Route Polyline */}
        {routePts.length > 1 && (
          <Polyline
            positions={routePts.map((pt) => [pt.latitude, pt.longitude])}
            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
          />
        )}

        {/* Start Position Marker */}
        {firstPoint && (
          <Marker position={[firstPoint.latitude, firstPoint.longitude]} icon={startIcon}>
            <Popup>
              <div>
                <strong>Shift Start Location</strong>
                <div>
                  {firstPoint.deviceTimestamp || firstPoint.device_timestamp
                    ? new Date(firstPoint.deviceTimestamp || firstPoint.device_timestamp).toLocaleTimeString()
                    : '—'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* End Position Marker */}
        {lastPoint && (
          <Marker position={[lastPoint.latitude, lastPoint.longitude]} icon={endIcon}>
            <Popup>
              <div>
                <strong>Shift End / Last Recorded Location</strong>
                <div>
                  {lastPoint.deviceTimestamp || lastPoint.device_timestamp
                    ? new Date(lastPoint.deviceTimestamp || lastPoint.device_timestamp).toLocaleTimeString()
                    : '—'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Assigned Location Markers */}
        {visits.map((visit: any) => {
          if (!visit.location) return null;
          const icon =
            visit.status === 'DELIVERED'
              ? deliveredIcon
              : visit.status === 'MISSED'
              ? missedIcon
              : pendingIcon;

          return (
            <Marker
              key={visit.id}
              position={[visit.location.latitude, visit.location.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="map-popup-content">
                  <h4 style={{ margin: '0 0 6px 0' }}>{visit.location.name}</h4>
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
                          ? new Date(visit.deliveredAt || visit.delivered_at).toLocaleTimeString()
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
      </MapContainer>
    </div>
  );
};
