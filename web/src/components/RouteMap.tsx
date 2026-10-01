import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RoutePoint } from '../types';
import { formatFallback, formatTimestamp, sortPointsByDeviceTimestamp } from '../utils/formatting';
import { GpsQualityBadge } from './GpsQualityBadge';

interface RouteMapProps {
  points: RoutePoint[];
  showGpsPoints?: boolean;
  selectedPointId: string | null;
  onSelectPoint: (point: RoutePoint) => void;
}

// Custom DivIcons for map markers
const startIcon = L.divIcon({
  className: 'custom-start-marker',
  html: `<div style="background-color: #2563eb; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">S</div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const endIcon = L.divIcon({
  className: 'custom-end-marker',
  html: `<div style="background-color: #475569; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">E</div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Helper component to auto-fit map bounds when route points change
const MapBoundsFitter: React.FC<{ points: RoutePoint[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const latLngs: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 15);
    } else {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [points, map]);

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

export const RouteMap: React.FC<RouteMapProps> = ({
  points,
  showGpsPoints = true,
  selectedPointId,
  onSelectPoint,
}) => {
  const validPoints = (points || []).filter(
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

  const sortedPoints = sortPointsByDeviceTimestamp(validPoints);

  if (!sortedPoints || sortedPoints.length === 0) {
    return (
      <div className="map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', minHeight: '300px' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontWeight: 600 }}>No GPS route points were recorded for this shift.</p>
        </div>
      </div>
    );
  }

  const polylineCoords: [number, number][] = sortedPoints.map((p) => [p.latitude, p.longitude]);
  const defaultCenter: [number, number] = [sortedPoints[0].latitude, sortedPoints[0].longitude];
  const selectedPoint = sortedPoints.find((pt) => pt.id === selectedPointId) || null;

  const firstPoint = sortedPoints[0];
  const lastPoint = sortedPoints.length > 1 ? sortedPoints[sortedPoints.length - 1] : null;

  return (
    <div className="map-container">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsFitter points={sortedPoints} />
        <MapPanFocus selectedPoint={selectedPoint} />

        {/* Chronological Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline positions={polylineCoords} color="#2563eb" weight={4} opacity={0.8} />
        )}

        {/* Individual GPS Point Dots */}
        {showGpsPoints &&
          sortedPoints.map((pt, idx) => {
            const isSelected = pt.id === selectedPointId;
            const accuracy = pt.accuracy_meters ?? pt.gpsAccuracyMeters;
            const speed = pt.speed_mps ?? pt.speedMps;
            const bearing = pt.bearing_degrees ?? pt.bearingDegrees;
            const deviceTime = pt.device_timestamp || pt.deviceTimestamp;

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
                  click: () => onSelectPoint(pt),
                }}
              >
                <Popup>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      Point #{idx + 1}
                    </div>
                    <div><strong>Recorded At:</strong> {formatTimestamp(deviceTime)}</div>
                    <div><strong>Lat/Lng:</strong> {pt.latitude.toFixed(6)}, {pt.longitude.toFixed(6)}</div>
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>GPS Quality:</strong> <GpsQualityBadge accuracyMeters={accuracy} />
                    </div>
                    <div><strong>Accuracy:</strong> {formatFallback(accuracy, 'm')}</div>
                    <div><strong>Speed:</strong> {formatFallback(speed, 'm/s')}</div>
                    <div><strong>Bearing:</strong> {formatFallback(bearing, '°')}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Start Marker */}
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

        {/* End Marker */}
        {lastPoint && (
          <Marker position={[lastPoint.latitude, lastPoint.longitude]} icon={endIcon}>
            <Popup>
              <div>
                <strong>Shift End / Latest Location</strong>
                <div>{formatTimestamp(lastPoint.device_timestamp || lastPoint.deviceTimestamp)}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
