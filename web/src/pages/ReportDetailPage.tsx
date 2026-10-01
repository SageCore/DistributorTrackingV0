import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchShiftReportDetail } from '../api/reports';
import { ShiftReportMap } from '../components/map/ShiftReportMap';
import { RoutePointTable } from '../components/RoutePointTable';
import { RoutePoint } from '../types';
import { formatDuration, formatTimestamp, formatFallback, sortPointsByDeviceTimestamp } from '../utils/formatting';

export const ReportDetailPage: React.FC = () => {
  const { shiftId } = useParams<{ shiftId: string }>();
  const navigate = useNavigate();

  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  const [showGpsPoints, setShowGpsPoints] = useState<boolean>(true);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['shiftReportDetail', shiftId],
    queryFn: () => (shiftId ? fetchShiftReportDetail(shiftId) : null),
    enabled: !!shiftId,
  });

  if (isLoading) {
    return (
      <div className="table-loader">
        <div className="spinner"></div>
        <span>Loading detailed shift report...</span>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="error-box">
        Failed to load shift report details.{' '}
        <button className="primary-btn" onClick={() => navigate('/reports')}>
          Back to Reports
        </button>
      </div>
    );
  }

  const rawPoints = report.routePoints || report.route_points || [];
  const routePoints = sortPointsByDeviceTimestamp(rawPoints);

  const handleSelectPoint = (pt: RoutePoint) => {
    setSelectedPoint(pt);
    // Smooth scroll to GPS point row in table if triggered from map
    const rowEl = document.getElementById(`gps-row-${pt.id}`);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="report-detail-page">
      {/* Report Header Card */}
      <div className="detail-header-card">
        <div className="header-info-main">
          <div className="report-icon-large">📋</div>
          <div>
            <h2>Shift Report — {report.employeeName}</h2>
            <div className="report-meta-line">
              <span>Date: {report.date}</span> •{' '}
              <span>
                Start: {report.startTime ? formatTimestamp(report.startTime) : '—'}
              </span>{' '}
              •{' '}
              <span>
                End: {report.endTime ? formatTimestamp(report.endTime) : '—'}
              </span>{' '}
              • <span>Duration: {formatDuration(report.durationMinutes)}</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button className="secondary-btn" onClick={() => navigate('/reports')} type="button">
            ← Back to Shift Reports
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="card-title">Assigned Visits</div>
          <div className="card-value">{report.totalAssigned}</div>
          <div className="card-subtext">Target Shop Locations</div>
        </div>

        <div className="summary-card success-card">
          <div className="card-title">Delivered</div>
          <div className="card-value">{report.deliveredCount}</div>
          <div className="card-subtext">Verified Locations</div>
        </div>

        <div className="summary-card danger-card">
          <div className="card-title">Missed</div>
          <div className="card-value">{report.missedCount}</div>
          <div className="card-subtext">Incomplete at Shift End</div>
        </div>

        <div className="summary-card highlight-card">
          <div className="card-title">Completion Rate</div>
          <div className="card-value">{report.completionPercentage}%</div>
          <div className="card-subtext">Verified Deliveries Rate</div>
        </div>
      </div>

      {/* Route & Visit Locations Map */}
      <div className="content-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3>Actual Tracked Route vs Assigned Locations</h3>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#334155', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <input
              type="checkbox"
              checked={showGpsPoints}
              onChange={(e) => setShowGpsPoints(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            GPS Points ({routePoints.length})
          </label>
        </div>
        <ShiftReportMap
          report={report}
          showGpsPoints={showGpsPoints}
          selectedPointId={selectedPoint?.id || null}
          onSelectPoint={handleSelectPoint}
        />
      </div>

      {/* Selected GPS Point Metadata Panel */}
      {selectedPoint && (
        <div className="content-section" style={{ marginTop: '20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>
              Selected GPS Point Details
            </h4>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => setSelectedPoint(null)}
            >
              Clear Selection
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.875rem' }}>
            <div><strong>Recorded At:</strong> {formatTimestamp(selectedPoint.device_timestamp || selectedPoint.deviceTimestamp)}</div>
            <div><strong>Latitude:</strong> {selectedPoint.latitude.toFixed(6)}</div>
            <div><strong>Longitude:</strong> {selectedPoint.longitude.toFixed(6)}</div>
            <div><strong>Accuracy:</strong> {formatFallback(selectedPoint.accuracy_meters ?? selectedPoint.gpsAccuracyMeters, 'm')}</div>
            <div><strong>Speed:</strong> {formatFallback(selectedPoint.speed_mps ?? selectedPoint.speedMps, 'm/s')}</div>
            <div><strong>Bearing:</strong> {formatFallback(selectedPoint.bearing_degrees ?? selectedPoint.bearingDegrees, '°')}</div>
            <div style={{ gridColumn: '1 / -1', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
              Point ID: {selectedPoint.id}
            </div>
          </div>
        </div>
      )}

      {/* GPS Route Points Inspection Table */}
      <div className="content-section" style={{ marginTop: '24px' }}>
        <div className="section-header">
          <h3>GPS Route Points ({routePoints.length})</h3>
        </div>
        <RoutePointTable
          points={routePoints}
          selectedPointId={selectedPoint?.id || null}
          onSelectPoint={handleSelectPoint}
        />
      </div>

      {/* Visit Verification Table */}
      <div className="content-section" style={{ marginTop: '24px' }}>
        <div className="section-header">
          <h3>Assigned Location Visits Breakdown</h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Status</th>
                <th>Delivered Timestamp</th>
                <th>Verified Distance</th>
                <th>GPS Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {report.assignedVisits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className="location-cell">
                      <span className="location-name">{visit.location?.name || 'Location'}</span>
                      <span className="location-code">{visit.location?.code || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${visit.status.toLowerCase()}`}>
                      {visit.status}
                    </span>
                  </td>
                  <td>
                    {visit.deliveredAt || visit.delivered_at
                      ? formatTimestamp(visit.deliveredAt || visit.delivered_at)
                      : '—'}
                  </td>
                  <td>
                    {formatFallback(visit.verifiedDistanceMeters ?? visit.verified_distance_meters, 'm')}
                  </td>
                  <td>
                    {formatFallback(visit.gpsAccuracyMeters ?? visit.gps_accuracy_meters, 'm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
