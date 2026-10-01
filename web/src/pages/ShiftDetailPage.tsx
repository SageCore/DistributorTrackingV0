import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { fetchShiftById } from '../api/shifts';
import { fetchShiftLocations } from '../api/locations';
import { RouteMap } from '../components/RouteMap';
import { RoutePointTable } from '../components/RoutePointTable';
import { StatusBadge } from '../components/StatusBadge';
import { RoutePoint } from '../types';
import { formatFallback, formatTimestamp, sortPointsByDeviceTimestamp } from '../utils/formatting';

export const ShiftDetailPage: React.FC = () => {
  const { shiftId } = useParams<{ shiftId: string }>();
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  const [showGpsPoints, setShowGpsPoints] = useState<boolean>(true);

  // 1. Fetch Shift Details
  const {
    data: shift,
    isLoading: isShiftLoading,
    isError: isShiftError,
    error: shiftError,
    refetch: refetchShift,
    isRefetching: isShiftRefetching,
  } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: () => fetchShiftById(shiftId!),
    enabled: Boolean(shiftId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'ACTIVE' ? 30000 : false;
    },
  });

  // 2. Fetch Route Points for Shift
  const {
    data: rawLocations,
    isLoading: isLocsLoading,
    isError: isLocsError,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ['locations', shiftId],
    queryFn: () => fetchShiftLocations(shiftId!),
    enabled: Boolean(shiftId),
    refetchInterval: () => {
      return shift?.status === 'ACTIVE' ? 30000 : false;
    },
  });

  // Defensive sorting of points by device timestamp ASC
  const locations = sortPointsByDeviceTimestamp(rawLocations || []);

  const handleRefresh = () => {
    refetchShift();
    refetchLocations();
  };

  const handleSelectPoint = (pt: RoutePoint) => {
    setSelectedPoint(pt);
    const rowEl = document.getElementById(`gps-row-${pt.id}`);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  if (isShiftLoading) {
    return (
      <div className="card state-box">
        <div className="spinner" style={{ marginBottom: '0.75rem' }}></div>
        <p className="state-title">Loading shift details...</p>
      </div>
    );
  }

  if (isShiftError || !shift) {
    return (
      <div className="card state-box" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
        <p className="state-title" style={{ color: '#b91c1c' }}>Shift Not Found</p>
        <p className="state-desc" style={{ color: '#991b1b' }}>
          {shiftError instanceof Error ? shiftError.message : `Shift '${shiftId}' does not exist on server.`}
        </p>
        <Link to="/shifts" className="btn btn-primary">
          Back to Shifts List
        </Link>
      </div>
    );
  }

  const isActive = shift.status === 'ACTIVE';

  return (
    <div className="shift-detail-page">
      {/* Navigation & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/shifts" className="btn">
            &larr; Back to Shifts
          </Link>
          <StatusBadge status={shift.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isActive && (
            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 500, backgroundColor: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
              Auto-refreshing every 30s
            </span>
          )}
          <button className="btn" onClick={handleRefresh} disabled={isShiftRefetching}>
            {isShiftRefetching ? <span className="spinner"></span> : 'Refresh Route'}
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.01em' }}>
          Shift Summary
        </h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Shift UUID</div>
            <div className="metric-value" style={{ fontSize: '0.9rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {shift.id}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Device ID</div>
            <div className="metric-value" style={{ fontSize: '1rem', fontFamily: 'monospace' }}>
              {shift.device_id}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Synchronized Points</div>
            <div className="metric-value" style={{ color: '#2563eb' }}>
              {locations.length}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Started At</div>
            <div className="metric-value" style={{ fontSize: '0.95rem' }}>
              {formatTimestamp(shift.started_at)}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Ended At</div>
            <div className="metric-value" style={{ fontSize: '0.95rem' }}>
              {formatTimestamp(shift.ended_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Point Metadata Card */}
      {selectedPoint && (
        <div className="card" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>
              Selected Route Point Metadata
            </h3>
            <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedPoint(null)}>
              Close Details
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div><strong>Recorded At:</strong> {formatTimestamp(selectedPoint.device_timestamp || selectedPoint.deviceTimestamp)}</div>
            <div><strong>Latitude:</strong> {selectedPoint.latitude.toFixed(6)}</div>
            <div><strong>Longitude:</strong> {selectedPoint.longitude.toFixed(6)}</div>
            <div><strong>Accuracy:</strong> {formatFallback(selectedPoint.accuracy_meters ?? selectedPoint.gpsAccuracyMeters, 'm')}</div>
            <div><strong>Speed:</strong> {formatFallback(selectedPoint.speed_mps ?? selectedPoint.speedMps, 'm/s')}</div>
            <div><strong>Bearing:</strong> {formatFallback(selectedPoint.bearing_degrees ?? selectedPoint.bearingDegrees, '°')}</div>
            <div style={{ gridColumn: '1 / -1', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
              Point UUID: {selectedPoint.id}
            </div>
          </div>
        </div>
      )}

      {/* Route Map Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            Synchronized Route Map
          </h2>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#334155', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <input
              type="checkbox"
              checked={showGpsPoints}
              onChange={(e) => setShowGpsPoints(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            GPS Points ({locations.length})
          </label>
        </div>
        {isLocsLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ marginBottom: '0.5rem' }}></div>
            <p>Loading route polylines and points...</p>
          </div>
        ) : isLocsError ? (
          <div style={{ padding: '2rem', color: '#b91c1c', textAlign: 'center' }}>
            Unable to load route points for this shift.
          </div>
        ) : (
          <RouteMap
            points={locations}
            showGpsPoints={showGpsPoints}
            selectedPointId={selectedPoint?.id || null}
            onSelectPoint={handleSelectPoint}
          />
        )}
      </div>

      {/* Persistent Locations Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
          Persistent Location Records ({locations.length})
        </h2>
        <RoutePointTable
          points={locations}
          selectedPointId={selectedPoint?.id || null}
          onSelectPoint={handleSelectPoint}
        />
      </div>
    </div>
  );
};
