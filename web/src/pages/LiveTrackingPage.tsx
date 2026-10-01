import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveEmployees, fetchEmployeeLiveDetails } from '../api/live';
import { LiveTrackingMap } from '../components/map/LiveTrackingMap';
import { formatFreshnessStatus, getFreshnessBadgeClass } from '../utils/freshness';
import { LiveEmployeeTracking } from '../types';

export const LiveTrackingPage: React.FC = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Poll live employees list every 20 seconds
  const { data: employeesList = [], isLoading: isListLoading } = useQuery<LiveEmployeeTracking[]>({
    queryKey: ['liveEmployees'],
    queryFn: fetchLiveEmployees,
    refetchInterval: 20000,
  });

  // Fetch detailed route & assigned locations for selected employee, polling every 15s
  const { data: employeeDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['employeeLiveDetails', selectedEmployeeId],
    queryFn: () => (selectedEmployeeId ? fetchEmployeeLiveDetails(selectedEmployeeId) : null),
    enabled: !!selectedEmployeeId,
    refetchInterval: 15000,
  });

  const activeEmployee =
    employeeDetails ||
    employeesList.find(
      (e) => e.employeeId === selectedEmployeeId || e.employee_id === selectedEmployeeId
    );

  return (
    <div className="live-tracking-layout">
      {/* Left Employee List Panel */}
      <aside className="live-employee-sidebar">
        <div className="sidebar-section-header">
          <h3>Today's Active Employees</h3>
          <span className="live-pulse-dot" title="Near-live Polling Active"></span>
        </div>

        {isListLoading ? (
          <div className="sidebar-loader">
            <div className="spinner"></div>
            <span>Polling active locations...</span>
          </div>
        ) : employeesList.length === 0 ? (
          <div className="empty-sidebar-notice">
            No active shifts or assigned employees found for today.
          </div>
        ) : (
          <div className="employee-cards-list">
            <button
              className={`employee-list-card ${selectedEmployeeId === null ? 'selected' : ''}`}
              onClick={() => setSelectedEmployeeId(null)}
              type="button"
            >
              <div className="card-top-row">
                <span className="emp-name">🌐 All Active Employees</span>
                <span className="emp-count-pill">{employeesList.length}</span>
              </div>
              <div className="card-sub-info">Overview map view</div>
            </button>

            {employeesList.map((emp) => {
              const empId = emp.employeeId || emp.employee_id || '';
              const isSelected = selectedEmployeeId === empId;
              const name = emp.employeeName || emp.employee_name || 'Employee';
              const status = emp.shiftStatus || emp.shift_status || 'ACTIVE';
              const del = emp.deliveredCount ?? emp.delivered_count ?? 0;
              const asg = emp.assignedCount ?? emp.assigned_count ?? 0;
              const freshness = emp.freshness || 'OFFLINE';
              const lastSeen = emp.lastSeenAt || emp.last_seen_at;

              return (
                <button
                  key={empId}
                  className={`employee-list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedEmployeeId(empId)}
                  type="button"
                >
                  <div className="card-top-row">
                    <span className="emp-name">{name}</span>
                    <span className={`status-badge ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>

                  <div className="card-middle-row">
                    <span className="progress-info">
                      {del} / {asg} delivered
                    </span>
                  </div>

                  <div className="card-bottom-row">
                    <span className={`freshness-badge ${getFreshnessBadgeClass(freshness)}`}>
                      {formatFreshnessStatus(freshness, lastSeen)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* Main Live Map View */}
      <div className="live-map-area">
        {selectedEmployeeId && isDetailsLoading ? (
          <div className="map-loading-overlay">
            <div className="spinner"></div>
            <span>Loading employee route & assigned visits...</span>
          </div>
        ) : null}

        <LiveTrackingMap
          employeeTracking={activeEmployee}
          allTrackingData={employeesList}
          onSelectEmployee={(id) => setSelectedEmployeeId(id)}
        />
      </div>
    </div>
  );
};
