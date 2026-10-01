import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardSummary, fetchTodayEmployeeProgress } from '../api/dashboard';
import { formatFreshnessStatus, getFreshnessBadgeClass } from '../utils/freshness';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 15000,
  });

  const { data: progressList = [], isLoading: isProgressLoading, isError: isProgressError } = useQuery({
    queryKey: ['todayEmployeeProgress'],
    queryFn: fetchTodayEmployeeProgress,
    refetchInterval: 15000,
  });

  const isLoading = isSummaryLoading || isProgressLoading;
  const isError = isSummaryError || isProgressError;

  return (
    <div className="dashboard-page">
      {/* Today Operational Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">👥</span>
            <span className="card-title">Total Employees</span>
          </div>
          <div className="card-value">{summary?.totalEmployees ?? summary?.total_employees ?? '—'}</div>
          <div className="card-subtext">Active Workforce</div>
        </div>

        <div className="summary-card highlight-active">
          <div className="card-header">
            <span className="card-icon">🟢</span>
            <span className="card-title">On Shift Right Now</span>
          </div>
          <div className="card-value">{summary?.activeShifts ?? summary?.on_shift ?? '—'}</div>
          <div className="card-subtext">Active GPS Tracked</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">📍</span>
            <span className="card-title">Visits Assigned Today</span>
          </div>
          <div className="card-value">{summary?.totalAssignedToday ?? summary?.visits_assigned_today ?? '—'}</div>
          <div className="card-subtext">Target Shop Locations</div>
        </div>

        <div className="summary-card success-card">
          <div className="card-header">
            <span className="card-icon">✓</span>
            <span className="card-title">Delivered</span>
          </div>
          <div className="card-value">{summary?.deliveredToday ?? summary?.delivered_today ?? '—'}</div>
          <div className="card-subtext">Verified Visits</div>
        </div>

        <div className="summary-card warning-card">
          <div className="card-header">
            <span className="card-icon">⏳</span>
            <span className="card-title">Pending</span>
          </div>
          <div className="card-value">{summary?.pendingToday ?? summary?.pending_today ?? '—'}</div>
          <div className="card-subtext">In Progress Shifts</div>
        </div>

        <div className="summary-card danger-card">
          <div className="card-header">
            <span className="card-icon">⚠️</span>
            <span className="card-title">Missed</span>
          </div>
          <div className="card-value">{summary?.missedToday ?? summary?.missed_today ?? '—'}</div>
          <div className="card-subtext">Completed Shift Missed</div>
        </div>
      </div>

      {/* Today Employee Progress Section */}
      <div className="content-section">
        <div className="section-header">
          <div className="section-title-area">
            <h2>Today Employee Progress</h2>
            <p className="section-description">
              Near-live operational progress of all assigned employees for today.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <span>Fetching today's workforce progress...</span>
          </div>
        ) : isError ? (
          <div className="error-box">
            Failed to load dashboard progress data. Please retry.
          </div>
        ) : progressList.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">📋</div>
            <h3>No Active Employees Today</h3>
            <p>Assign locations to employees for today to start tracking operational progress.</p>
            <button className="primary-btn" onClick={() => navigate('/assignments')}>
              Go to Daily Assignments
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Shift Status</th>
                  <th>Visit Progress</th>
                  <th>Delivered</th>
                  <th>Pending</th>
                  <th>Missed</th>
                  <th>Last Seen</th>
                  <th>Latest GPS Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {progressList.map((row) => {
                  const empId = row.id || row.employeeId || '';
                  const empName = row.name || '';
                  const empCode = row.employeeCode || row.employee_code || '';
                  const status = row.currentShiftStatus || row.current_shift_status || 'NOT_STARTED';
                  const assigned = row.assignedCount ?? row.total_assigned_today ?? 0;
                  const delivered = row.deliveredCount ?? row.total_delivered_today ?? 0;
                  const pending = row.pendingCount ?? (assigned - delivered);
                  const missed = row.missedCount ?? 0;
                  const freshness = row.freshness || 'OFFLINE';

                  return (
                    <tr
                      key={empId}
                      className="clickable-row"
                      onClick={() => navigate(`/employees/${empId}`)}
                    >
                      <td>
                        <div className="employee-cell">
                          <span className="employee-name">{empName}</span>
                          <span className="employee-code">{empCode}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${assigned > 0 ? (delivered / assigned) * 100 : 0}%`,
                            }}
                          ></div>
                          <span className="progress-bar-text">
                            {delivered} / {assigned}
                          </span>
                        </div>
                      </td>
                      <td className="text-success font-semibold">{delivered}</td>
                      <td className="text-warning font-semibold">{pending}</td>
                      <td className="text-danger font-semibold">{missed}</td>
                      <td>
                        <span className={`freshness-badge ${getFreshnessBadgeClass(freshness)}`}>
                          {formatFreshnessStatus(freshness, row.lastSeenAt || row.last_seen_at)}
                        </span>
                      </td>
                      <td>
                        {row.latestGpsAccuracyMeters !== undefined
                          ? `${row.latestGpsAccuracyMeters} m`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
