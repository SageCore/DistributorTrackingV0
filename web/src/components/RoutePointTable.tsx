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
      <div className="state-box">
        <p className="state-title">No persistent route points</p>
        <p className="state-desc">This shift does not contain any synchronized location records yet.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Device Timestamp</th>
            <th>Server Received</th>
            <th>GPS Quality</th>
            <th>Accuracy</th>
            <th>Speed</th>
            <th>Bearing</th>
            <th>Mock</th>
            <th>Coordinates</th>
            <th>Point UUID</th>
          </tr>
        </thead>
        <tbody>
          {points.map((pt, idx) => {
            const isSelected = pt.id === selectedPointId;
            return (
              <tr
                key={pt.id}
                className={`clickable ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectPoint(pt)}
              >
                <td style={{ fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                <td>{formatTimestamp(pt.device_timestamp)}</td>
                <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatTimestamp(pt.received_at)}</td>
                <td>
                  <GpsQualityBadge accuracyMeters={pt.accuracy_meters} />
                </td>
                <td>{formatFallback(pt.accuracy_meters, 'm')}</td>
                <td>{formatFallback(pt.speed_mps, 'm/s')}</td>
                <td>{formatFallback(pt.bearing_degrees, '°')}</td>
                <td>
                  {pt.is_mock ? (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>Yes</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>No</span>
                  )}
                </td>
                <td>
                  {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                  {pt.id}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
