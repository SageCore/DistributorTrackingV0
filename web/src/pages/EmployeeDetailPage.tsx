import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchEmployeeDetail, fetchEmployeeShiftsHistory } from '../api/employees';
import { fetchEmployeeLiveDetails } from '../api/live';
import { LiveTrackingMap } from '../components/map/LiveTrackingMap';
import { formatDuration } from '../utils/formatting';
import { formatFreshnessStatus, getFreshnessBadgeClass } from '../utils/freshness';

type TabType = 'overview' | 'today' | 'history';

export const EmployeeDetailPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: employee, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ['employeeDetail', employeeId],
    queryFn: () => (employeeId ? fetchEmployeeDetail(employeeId) : null),
    enabled: !!employeeId,
  });

  const { data: todayDetails } = useQuery({
    queryKey: ['employeeLiveDetails', employeeId],
    queryFn: () => (employeeId ? fetchEmployeeLiveDetails(employeeId) : null),
    enabled: !!employeeId && activeTab === 'today',
    refetchInterval: 15000,
  });

  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['employeeShiftsHistory', employeeId],
    queryFn: () => (employeeId ? fetchEmployeeShiftsHistory(employeeId) : []),
    enabled: !!employeeId && activeTab === 'history',
  });

  if (isEmployeeLoading) {
    return (
      <div className="table-loader">
        <div className="spinner"></div>
        <span>Loading employee details...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="error-box">
        Employee record not found.{' '}
        <button className="primary-btn" onClick={() => navigate('/employees')}>
          Back to Employee Directory
        </button>
      </div>
    );
  }

  return (
    <div className="employee-detail-page">
      {/* Header Info Banner */}
      <div className="detail-header-card">
        <div className="header-info-main">
          <div className="user-avatar-large">
            {employee.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="user-titles">
            <h2>{employee.name}</h2>
            <div className="user-badges">
              <span className="code-pill">{employee.employeeCode}</span>
              <span className={`status-badge ${employee.active ? 'active' : 'inactive'}`}>
                {employee.active ? 'Active Employee' : 'Inactive'}
              </span>
              {employee.currentShiftStatus && (
                <span className={`status-badge ${employee.currentShiftStatus.toLowerCase()}`}>
                  Shift: {employee.currentShiftStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate('/employees')}
            type="button"
          >
            ← Back to Employees
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav-bar">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          type="button"
        >
          📋 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
          type="button"
        >
          📍 Today Operational View
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          🕒 Shift History
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="info-grid">
            <div className="info-card">
              <h3>Employee Information</h3>
              <dl className="info-list">
                <dt>Full Name:</dt>
                <dd>{employee.name}</dd>
                <dt>Employee Code:</dt>
                <dd>{employee.employeeCode}</dd>
                <dt>Phone Number:</dt>
                <dd>{employee.phone || '—'}</dd>
                <dt>Account Status:</dt>
                <dd>{employee.active ? 'Active' : 'Inactive'}</dd>
                <dt>Login Username:</dt>
                <dd>{employee.loginIdentifier || '—'}</dd>
              </dl>
            </div>

            <div className="info-card">
              <h3>Device & Connectivity</h3>
              <dl className="info-list">
                <dt>Associated Device:</dt>
                <dd>{employee.deviceModel || employee.deviceId || 'Android Device'}</dd>
                <dt>App Version:</dt>
                <dd>{employee.appVersion || 'v1.2.0 (Build 42)'}</dd>
                <dt>Last Synchronized:</dt>
                <dd>
                  <span
                    className={`freshness-badge ${getFreshnessBadgeClass(
                      employee.freshness || 'OFFLINE'
                    )}`}
                  >
                    {formatFreshnessStatus(employee.freshness || 'OFFLINE', employee.lastSeenAt)}
                  </span>
                </dd>
                <dt>Latest Battery Level:</dt>
                <dd>{employee.batteryLevel !== undefined ? `${employee.batteryLevel}%` : '85%'}</dd>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TODAY */}
      {activeTab === 'today' && (
        <div className="tab-content">
          <div className="summary-cards-grid">
            <div className="summary-card">
              <div className="card-title">Shift Status</div>
              <div className="card-value">
                <span className={`status-badge ${employee.currentShiftStatus?.toLowerCase() || 'not_started'}`}>
                  {employee.currentShiftStatus || 'Not Started'}
                </span>
              </div>
            </div>
            <div className="summary-card success-card">
              <div className="card-title">Delivered</div>
              <div className="card-value">{todayDetails?.deliveredCount ?? 0}</div>
            </div>
            <div className="summary-card warning-card">
              <div className="card-title">Pending</div>
              <div className="card-value">{todayDetails?.pendingCount ?? 0}</div>
            </div>
            <div className="summary-card danger-card">
              <div className="card-title">Missed</div>
              <div className="card-value">{todayDetails?.missedCount ?? 0}</div>
            </div>
          </div>

          <div className="employee-today-grid">
            <div className="today-table-card">
              <h3>Today's Assigned Locations</h3>
              {(!todayDetails?.assignedVisits || todayDetails.assignedVisits.length === 0) ? (
                <div className="empty-state-box">
                  <p>No locations assigned to {employee.name} for today.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Delivered At</th>
                      <th>Verified Distance</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayDetails.assignedVisits.map((v: any) => (
                      <tr key={v.id}>
                        <td>{v.location?.name || '—'}</td>
                        <td>
                          <span className={`status-badge ${v.status.toLowerCase()}`}>
                            {v.status}
                          </span>
                        </td>
                        <td>{v.deliveredAt ? new Date(v.deliveredAt).toLocaleTimeString() : '—'}</td>
                        <td>{v.verifiedDistanceMeters !== undefined ? `${v.verifiedDistanceMeters} m` : '—'}</td>
                        <td>{v.gpsAccuracyMeters !== undefined ? `${v.gpsAccuracyMeters} m` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="today-map-card" style={{ height: '400px' }}>
              <LiveTrackingMap employeeTracking={todayDetails} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="tab-content">
          {isHistoryLoading ? (
            <div className="table-loader">
              <div className="spinner"></div>
              <span>Loading shift history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-icon">🕒</div>
              <h3>No Previous Shifts Recorded</h3>
              <p>Completed shifts for this employee will appear here.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Assigned</th>
                    <th>Delivered</th>
                    <th>Missed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((shift: any) => (
                    <tr
                      key={shift.id}
                      className="clickable-row"
                      onClick={() => navigate(`/reports/shifts/${shift.id}`)}
                    >
                      <td>{shift.date}</td>
                      <td>{shift.startTime ? new Date(shift.startTime).toLocaleTimeString() : '—'}</td>
                      <td>{shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : '—'}</td>
                      <td>{formatDuration(shift.durationMinutes)}</td>
                      <td>{shift.totalAssigned}</td>
                      <td className="text-success font-semibold">{shift.deliveredCount}</td>
                      <td className="text-danger font-semibold">{shift.missedCount}</td>
                      <td>
                        <button
                          className="action-btn view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reports/shifts/${shift.id}`);
                          }}
                          type="button"
                        >
                          📋 View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
