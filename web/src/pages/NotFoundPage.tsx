import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="card state-box" style={{ marginTop: '3rem' }}>
      <h1 className="state-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        404 — Page Not Found
      </h1>
      <p className="state-desc">The requested page does not exist in the Distributor GPS Tracking web application.</p>
      <Link to="/shifts" className="btn btn-primary">
        Return to Shifts List
      </Link>
    </div>
  );
};
