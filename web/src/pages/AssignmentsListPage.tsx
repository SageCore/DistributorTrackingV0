import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchDailyAssignments } from '../api/assignments';

export const AssignmentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { data: assignments = [], isLoading, isError } = useQuery({
    queryKey: ['dailyAssignments', selectedDate],
    queryFn: () => fetchDailyAssignments(selectedDate),
  });

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="assignments-page">
      {/* Date Bar Control */}
      <div className="date-picker-bar">
        <div className="date-controls">
          <button className="secondary-btn" onClick={handlePrevDay} type="button">
            ◀ Prev Day
          </button>
          <input
            type="date"
            className="form-input date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="secondary-btn" onClick={handleNextDay} type="button">
            Next Day ▶
          </button>
          <button className="secondary-btn today-btn" onClick={handleToday} type="button">
            Today
          </button>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate(`/assignments/new?date=${selectedDate}`)}
          type="button"
        >
          ➕ Assign Locations
        </button>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="table-loader">
          <div className="spinner"></div>
          <span>Loading assignments for {selectedDate}...</span>
        </div>
      ) : isError ? (
        <div className="error-box">Failed to load assignments.</div>
      ) : assignments.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon">📅</div>
          <h3>No Daily Assignments for {selectedDate}</h3>
          <p>Assign customer locations to employees for this work date.</p>
          <button
            className="primary-btn"
            onClick={() => navigate(`/assignments/new?date=${selectedDate}`)}
          >
            Assign Locations Now
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Assigned Locations</th>
                <th>Delivered</th>
                <th>Pending</th>
                <th>Missed</th>
                <th>Shift Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>
                    <div className="employee-cell">
                      <span className="employee-name">{assignment.employeeName}</span>
                      <span className="employee-code">{assignment.employeeCode}</span>
                    </div>
                  </td>
                  <td>
                    <div className="locations-tags-list">
                      {assignment.assignedVisits.map((v) => (
                        <span
                          key={v.id}
                          className={`location-tag ${v.status.toLowerCase()}`}
                          title={`Status: ${v.status}`}
                        >
                          {v.location?.name || 'Shop'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-success font-semibold">{assignment.deliveredCount}</td>
                  <td className="text-warning font-semibold">{assignment.pendingCount}</td>
                  <td className="text-danger font-semibold">{assignment.missedCount}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        assignment.shiftStatus
                          ? assignment.shiftStatus.toLowerCase()
                          : 'not_started'
                      }`}
                    >
                      {assignment.shiftStatus || 'Not Started'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => navigate(`/assignments/${assignment.id}/edit`)}
                      type="button"
                    >
                      ✏️ Edit Assignment
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
