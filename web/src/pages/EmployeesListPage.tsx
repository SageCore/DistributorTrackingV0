import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, toggleEmployeeActive } from '../api/employees';
import { formatFreshnessStatus, getFreshnessBadgeClass } from '../utils/freshness';

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: employees = [], isLoading, isError } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  const toggleMutation = useMutation({
    mutationFn: (params: { employeeId: string; active: boolean }) =>
      toggleEmployeeActive(params.employeeId, params.active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggleStatus = (employeeId: string, currentActive: boolean, name: string) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} employee "${name}"?`)) {
      toggleMutation.mutate({ employeeId, active: !currentActive });
    }
  };

  return (
    <div className="employees-page">
      <div className="table-actions-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search employee name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
        <button
          className="primary-btn"
          onClick={() => navigate('/employees/new')}
          type="button"
        >
          ➕ Add New Employee
        </button>
      </div>

      {isLoading ? (
        <div className="table-loader">
          <div className="spinner"></div>
          <span>Loading employee list...</span>
        </div>
      ) : isError ? (
        <div className="error-box">Failed to load employees.</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon">👥</div>
          <h3>No Employees Found</h3>
          <p>Get started by creating your first employee profile.</p>
          <button className="primary-btn" onClick={() => navigate('/employees/new')}>
            Create Employee
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name & Code</th>
                <th>Phone</th>
                <th>Account Status</th>
                <th>Current Shift</th>
                <th>Visits Today</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const empId = emp.id || emp.employeeId || '';
                const empCode = emp.employeeCode || emp.employee_code || '';
                const shiftStatus = emp.currentShiftStatus || emp.current_shift_status;
                const freshness = emp.freshness || 'OFFLINE';
                const lastSeen = emp.lastSeenAt || emp.last_seen_at;

                return (
                  <tr key={empId}>
                    <td>
                      <div className="employee-cell">
                        <span className="employee-name">{emp.name}</span>
                        <span className="employee-code">{empCode}</span>
                      </div>
                    </td>
                    <td>{emp.phone || '—'}</td>
                    <td>
                      <span className={`status-badge ${emp.active ? 'active' : 'inactive'}`}>
                        {emp.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          shiftStatus ? shiftStatus.toLowerCase() : 'not_started'
                        }`}
                      >
                        {shiftStatus || 'Not Started'}
                      </span>
                    </td>
                    <td>{emp.visitsToday !== undefined ? emp.visitsToday : emp.assignedCount ?? '—'}</td>
                    <td>
                      <span className={`freshness-badge ${getFreshnessBadgeClass(freshness)}`}>
                        {formatFreshnessStatus(freshness, lastSeen)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          className="action-btn view-btn"
                          onClick={() => navigate(`/employees/${empId}`)}
                          title="View Employee Detail"
                          type="button"
                        >
                          👁 View
                        </button>
                        <button
                          className={`action-btn ${emp.active ? 'deactivate-btn' : 'activate-btn'}`}
                          onClick={() => handleToggleStatus(empId, emp.active, emp.name)}
                          type="button"
                        >
                          {emp.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
