import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RoutePoint } from '../types';
import { formatFallback, formatTimestamp } from '../utils/formatting';
import { GpsQualityBadge } from './GpsQualityBadge';

interface RouteMapProps {
  points: RoutePoint[];
  selectedPointId: string | null;
  onSelectPoint: (point: RoutePoint) => void;
}

// Custom DivIcons for map markers
const startIcon = L.divIcon({
  className: 'custom-start-marker',
  html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const endIcon = L.divIcon({
  className: 'custom-end-marker',
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const pointIcon = L.divIcon({
  className: 'custom-point-marker',
  html: `<div style="background-color: #2563eb; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const selectedIcon = L.divIcon({
  className: 'custom-selected-marker',
  html: `<div style="background-color: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px #f59e0b;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);

  return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({ points, selectedPointId, onSelectPoint }) => {
  if (!points || points.length === 0) {
    return (
      <div className="map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontWeight: 600 }}>No synchronized GPS points yet</p>
          <p style={{ fontSize: '0.85rem' }}>Map will populate as Android synchronizes persistent route points.</p>
        </div>
      </div>
    );
  }

  const polylineCoords: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
  const defaultCenter: [number, number] = [points[0].latitude, points[0].longitude];

  return (
    <div className="map-container">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsFitter points={points} />

        {/* Chronological Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline positions={polylineCoords} color="#2563eb" weight={4} opacity={0.8} />
        )}

        {/* Route Point Markers */}
        {points.map((pt, idx) => {
          const isSelected = pt.id === selectedPointId;
          const isStart = idx === 0;
          const isEnd = idx === points.length - 1 && points.length > 1;

          let icon = pointIcon;
          if (isSelected) icon = selectedIcon;
          else if (isStart) icon = startIcon;
          else if (isEnd) icon = endIcon;

          return (
            <Marker
              key={pt.id}
              position={[pt.latitude, pt.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectPoint(pt),
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                    Point #{idx + 1} {isStart ? '(Start)' : isEnd ? '(Latest)' : ''}
                  </div>
                  <div><strong>Device Time:</strong> {formatTimestamp(pt.device_timestamp)}</div>
                  <div><strong>Server Received:</strong> {formatTimestamp(pt.received_at)}</div>
                  <div><strong>Lat/Lng:</strong> {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}</div>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong>GPS Quality:</strong> <GpsQualityBadge accuracyMeters={pt.accuracy_meters} />
                  </div>
                  <div><strong>Reported Accuracy:</strong> {formatFallback(pt.accuracy_meters, 'm')}</div>
                  <div><strong>Speed:</strong> {formatFallback(pt.speed_mps, 'm/s')}</div>
                  <div><strong>Bearing:</strong> {formatFallback(pt.bearing_degrees, '°')}</div>
                  <div><strong>Mock Location:</strong> {formatFallback(pt.is_mock)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>
                    ID: {pt.id}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
