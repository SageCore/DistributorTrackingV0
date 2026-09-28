import React from 'react';
import { ShiftStatus } from '../types';

interface StatusBadgeProps {
  status: ShiftStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`badge ${isActive ? 'badge-active' : 'badge-completed'}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isActive ? '#10b981' : '#64748b',
          display: 'inline-block',
        }}
      ></span>
      {status}
    </span>
  );
};
