import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchShiftReportDetail } from '../api/reports';
import { ShiftReportMap } from '../components/map/ShiftReportMap';
import { formatDuration } from '../utils/formatting';

export const ReportDetailPage: React.FC = () => {
  const { shiftId } = useParams<{ shiftId: string }>();
  const navigate = useNavigate();

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
                Start: {report.startTime ? new Date(report.startTime).toLocaleTimeString() : '—'}
              </span>{' '}
              •{' '}
              <span>
                End: {report.endTime ? new Date(report.endTime).toLocaleTimeString() : '—'}
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
        <div className="section-header">
          <h3>Actual Tracked Route vs Assigned Locations</h3>
        </div>
        <ShiftReportMap report={report} />
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
                    {visit.deliveredAt
                      ? new Date(visit.deliveredAt).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td>
                    {visit.verifiedDistanceMeters !== undefined
                      ? `${visit.verifiedDistanceMeters} m`
                      : '—'}
                  </td>
                  <td>
                    {visit.gpsAccuracyMeters !== undefined
                      ? `${visit.gpsAccuracyMeters} m`
                      : '—'}
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
