import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { checkHealth } from '../api/health';

export const Header: React.FC = () => {
  const { data: health, isError } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 15000,
    retry: 1,
  });

  const isConnected = !isError && health?.status === 'ok';

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/shifts" className="brand-section">
          <div className="brand-icon">GPS</div>
          <span className="brand-title">Distributor GPS Tracking</span>
        </Link>

        <div className="header-right">
          <div
            className={`connectivity-badge ${
              isConnected ? 'connected' : 'unavailable'
            }`}
            title="Backend Connectivity Status"
          >
            <span className="status-dot"></span>
            <span>{isConnected ? 'Backend Connected' : 'Backend Unavailable'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
