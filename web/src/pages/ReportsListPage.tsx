import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchShiftReports } from '../api/reports';
import { fetchEmployees } from '../api/employees';
import { formatDuration } from '../utils/formatting';

export const ReportsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string>('');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['shiftReports', employeeIdFilter],
    queryFn: () => fetchShiftReports({ employeeId: employeeIdFilter || undefined }),
  });

  return (
    <div className="reports-page">
      {/* Filters Bar */}
      <div className="table-actions-header">
        <div className="filters-group">
          <div className="filter-item">
            <label>Filter by Employee:</label>
            <select
              className="form-select"
              value={employeeIdFilter}
              onChange={(e) => setEmployeeIdFilter(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="table-loader">
          <div className="spinner"></div>
          <span>Loading shift reports...</span>
        </div>
      ) : isError ? (
        <div className="error-box">Failed to load shift reports.</div>
      ) : reports.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon">📋</div>
          <h3>No Shift Reports Found</h3>
          <p>Completed field workforce shifts will be listed here.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Shift Start</th>
                <th>Shift End</th>
                <th>Duration</th>
                <th>Assigned</th>
                <th>Delivered</th>
                <th>Missed</th>
                <th>Completion %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="clickable-row"
                  onClick={() => navigate(`/reports/shifts/${report.id}`)}
                >
                  <td>{report.date}</td>
                  <td>
                    <div className="employee-cell">
                      <span className="employee-name">{report.employeeName}</span>
                      <span className="employee-code">{report.employeeCode}</span>
                    </div>
                  </td>
                  <td>{report.startTime ? new Date(report.startTime).toLocaleTimeString() : '—'}</td>
                  <td>{report.endTime ? new Date(report.endTime).toLocaleTimeString() : '—'}</td>
                  <td>{formatDuration(report.durationMinutes)}</td>
                  <td>{report.totalAssigned}</td>
                  <td className="text-success font-semibold">{report.deliveredCount}</td>
                  <td className="text-danger font-semibold">{report.missedCount}</td>
                  <td>
                    <div className="completion-percentage-pill">
                      {report.completionPercentage}%
                    </div>
                  </td>
                  <td>
                    <button
                      className="action-btn view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/reports/shifts/${report.id}`);
                      }}
                      type="button"
                    >
                      📋 Inspect Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
