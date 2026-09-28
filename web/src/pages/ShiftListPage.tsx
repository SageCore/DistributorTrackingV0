import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchShifts } from '../api/shifts';
import { StatusBadge } from '../components/StatusBadge';
import { formatFallback, formatTimestamp } from '../utils/formatting';

export const ShiftListPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  const {
    data: shifts,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['shifts', statusFilter],
    queryFn: () => fetchShifts(statusFilter),
    refetchInterval: 30000,
  });

  return (
    <div className="shifts-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Synchronized Shifts</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Centralized server tracking records synchronized from Android devices.
            </p>
          </div>
          <button className="btn" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? <span className="spinner"></span> : 'Refresh'}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginRight: '0.25rem' }}>
              Filter Status:
            </span>
            <button
              className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Shifts
            </button>
            <button
              className={`filter-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Active Only
            </button>
            <button
              className={`filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Completed Only
            </button>
          </div>

          {shifts && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
              Showing {shifts.length} shift(s)
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="state-box">
            <div className="spinner" style={{ marginBottom: '0.75rem' }}></div>
            <p className="state-title">Loading synchronized shifts...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="state-box" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
            <p className="state-title" style={{ color: '#b91c1c' }}>Unable to load shifts</p>
            <p className="state-desc" style={{ color: '#991b1b' }}>
              {error instanceof Error ? error.message : 'Unable to reach FastAPI backend.'}
            </p>
            <button className="btn btn-primary" onClick={() => refetch()}>
              Retry Request
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && shifts && shifts.length === 0 && (
          <div className="state-box">
            <p className="state-title">No synchronized shifts found</p>
            <p className="state-desc">
              {statusFilter !== 'ALL'
                ? `There are currently no ${statusFilter.toLowerCase()} shifts recorded.`
                : 'No shifts have been registered by Android clients yet.'}
            </p>
          </div>
        )}

        {/* Shift Table */}
        {!isLoading && !isError && shifts && shifts.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Shift UUID</th>
                  <th>Device ID</th>
                  <th>Started At</th>
                  <th>Ended At</th>
                  <th>Synced Points</th>
                  <th>Latest Point Time</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="clickable"
                    onClick={() => navigate(`/shifts/${shift.id}`)}
                  >
                    <td>
                      <StatusBadge status={shift.status} />
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{shift.id}</td>
                    <td style={{ color: '#475569' }}>{shift.device_id}</td>
                    <td>{formatTimestamp(shift.started_at)}</td>
                    <td>{formatTimestamp(shift.ended_at)}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: shift.location_count > 0 ? '#2563eb' : '#94a3b8',
                        }}
                      >
                        {shift.location_count} point(s)
                      </span>
                    </td>
                    <td>{formatFallback(formatTimestamp(shift.last_location_time))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
