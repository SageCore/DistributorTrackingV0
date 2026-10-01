import React from 'react';
import { RoutePoint } from '../types';
import { formatFallback, formatTimestamp } from '../utils/formatting';
import { GpsQualityBadge } from './GpsQualityBadge';

interface RoutePointTableProps {
  points: RoutePoint[];
  selectedPointId: string | null;
  onSelectPoint: (point: RoutePoint) => void;
}

export const RoutePointTable: React.FC<RoutePointTableProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
}) => {
  if (!points || points.length === 0) {
    return (
      <div className="state-box" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="state-title" style={{ fontWeight: 600, color: '#64748b' }}>No persistent route points</p>
        <p className="state-desc" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          No valid GPS route points were recorded for this shift.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Recorded At</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Accuracy</th>
            <th>Speed (m/s)</th>
            <th>Bearing</th>
          </tr>
        </thead>
        <tbody>
          {points.map((pt, idx) => {
            const isSelected = pt.id === selectedPointId;
            const accuracy = pt.accuracy_meters ?? pt.gpsAccuracyMeters;
            const speed = pt.speed_mps ?? pt.speedMps;
            const bearing = pt.bearing_degrees ?? pt.bearingDegrees;
            const deviceTime = pt.device_timestamp || pt.deviceTimestamp;

            return (
              <tr
                key={pt.id || idx}
                id={`gps-row-${pt.id}`}
                className={`clickable ${isSelected ? 'selected' : ''}`}
                style={{
                  backgroundColor: isSelected ? '#eff6ff' : undefined,
                  borderLeft: isSelected ? '4px solid #2563eb' : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => onSelectPoint(pt)}
              >
                <td style={{ fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                <td>{formatTimestamp(deviceTime)}</td>
                <td>{pt.latitude != null ? pt.latitude.toFixed(6) : '—'}</td>
                <td>{pt.longitude != null ? pt.longitude.toFixed(6) : '—'}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {formatFallback(accuracy, 'm')}
                    {accuracy != null && <GpsQualityBadge accuracyMeters={accuracy} />}
                  </span>
                </td>
                <td>{formatFallback(speed, 'm/s')}</td>
                <td>{formatFallback(bearing, '°')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
