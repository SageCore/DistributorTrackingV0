import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShiftReport, RoutePoint } from '../../types';
import { formatTimestamp, formatFallback, sortPointsByDeviceTimestamp } from '../../utils/formatting';

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
  showGpsPoints?: boolean;
  selectedPointId?: string | null;
  onSelectPoint?: (point: RoutePoint) => void;
}

const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [map, points]);
  return null;
};

const MapPanFocus: React.FC<{ selectedPoint: RoutePoint | null }> = ({ selectedPoint }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedPoint && typeof selectedPoint.latitude === 'number' && typeof selectedPoint.longitude === 'number') {
      map.panTo([selectedPoint.latitude, selectedPoint.longitude], { animate: true });
    }
  }, [selectedPoint, map]);
  return null;
};

export const ShiftReportMap: React.FC<ShiftReportMapProps> = ({
  report,
  showGpsPoints = true,
  selectedPointId = null,
  onSelectPoint,
}) => {
  const rawRoutePts = report.routePoints || report.route_points || [];
  const visits = report.assignedVisits || (report as any).visits || [];

  // Filter valid coordinates
  const validRoutePts = rawRoutePts.filter(
    (pt) =>
      pt &&
      typeof pt.latitude === 'number' &&
      typeof pt.longitude === 'number' &&
      !isNaN(pt.latitude) &&
      !isNaN(pt.longitude) &&
      pt.latitude >= -90 &&
      pt.latitude <= 90 &&
      pt.longitude >= -180 &&
      pt.longitude <= 180
  );

  const routePts = sortPointsByDeviceTimestamp(validRoutePts);

  const boundsPoints: [number, number][] = [];

  routePts.forEach((pt) => {
    boundsPoints.push([pt.latitude, pt.longitude]);
  });

  visits.forEach((visit: any) => {
    if (visit.location && typeof visit.location.latitude === 'number' && typeof visit.location.longitude === 'number') {
      boundsPoints.push([visit.location.latitude, visit.location.longitude]);
    }
  });

  const defaultCenter: [number, number] =
    boundsPoints.length > 0 ? boundsPoints[0] : [31.5204, 74.3587];

  const firstPoint = routePts[0];
  const lastPoint = routePts.length > 1 ? routePts[routePts.length - 1] : null;
  const selectedPoint = routePts.find((pt) => pt.id === selectedPointId) || null;

  return (
    <div style={{ height: '420px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
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
        <MapPanFocus selectedPoint={selectedPoint} />

        {/* Route Polyline */}
        {routePts.length > 1 && (
          <Polyline
            positions={routePts.map((pt) => [pt.latitude, pt.longitude])}
            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
          />
        )}

        {/* Recorded GPS Dots Inspection Layer */}
        {showGpsPoints &&
          routePts.map((pt, idx) => {
            const isSelected = pt.id === selectedPointId;
            const deviceTime = pt.device_timestamp || pt.deviceTimestamp;
            const accuracy = pt.accuracy_meters ?? pt.gpsAccuracyMeters;
            const speed = pt.speed_mps ?? pt.speedMps;
            const bearing = pt.bearing_degrees ?? pt.bearingDegrees;

            return (
              <CircleMarker
                key={pt.id || idx}
                center={[pt.latitude, pt.longitude]}
                radius={isSelected ? 8 : 4}
                pathOptions={{
                  color: isSelected ? '#f59e0b' : '#1d4ed8',
                  fillColor: isSelected ? '#fbbf24' : '#3b82f6',
                  fillOpacity: isSelected ? 1 : 0.75,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => onSelectPoint && onSelectPoint(pt),
                }}
              >
                <Popup>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.4', minWidth: '180px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                      GPS Record #{idx + 1}
                    </div>
                    <div><strong>Recorded At:</strong> {formatTimestamp(deviceTime)}</div>
                    <div><strong>Latitude:</strong> {pt.latitude.toFixed(6)}</div>
                    <div><strong>Longitude:</strong> {pt.longitude.toFixed(6)}</div>
                    <div><strong>Accuracy:</strong> {formatFallback(accuracy, 'm')}</div>
                    <div><strong>Speed:</strong> {formatFallback(speed, 'm/s')}</div>
                    <div><strong>Bearing:</strong> {formatFallback(bearing, '°')}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Start Position Marker */}
        {firstPoint && (
          <Marker position={[firstPoint.latitude, firstPoint.longitude]} icon={startIcon}>
            <Popup>
              <div>
                <strong>Shift Start Location</strong>
                <div>{formatTimestamp(firstPoint.device_timestamp || firstPoint.deviceTimestamp)}</div>
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
                <div>{formatTimestamp(lastPoint.device_timestamp || lastPoint.deviceTimestamp)}</div>
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
                        {formatTimestamp(visit.deliveredAt || visit.delivered_at)}
                      </div>
                      <div>
                        <strong>Verified Distance:</strong>{' '}
                        {formatFallback(visit.verifiedDistanceMeters ?? visit.verified_distance_meters, 'm')}
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
