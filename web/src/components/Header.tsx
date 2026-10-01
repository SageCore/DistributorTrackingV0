import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { checkHealth } from '../api/health';
import { fetchAlerts, markAlertRead } from '../api/alerts';
import { Alert } from '../types';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Today Operational Dashboard',
  '/live': 'Live Employee Tracking',
  '/employees': 'Employee Management',
  '/employees/new': 'Create New Employee',
  '/locations': 'Customer & Shop Locations',
  '/locations/new': 'Add New Location',
  '/assignments': 'Daily Location Assignments',
  '/assignments/new': 'Create Daily Assignment',
  '/reports': 'Shift & Delivery Reports',
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [showAlerts, setShowAlerts] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const { data: health, isError: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 20000,
    retry: 1,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const isConnected = !healthError && health?.status === 'ok';
  const unreadAlerts = alerts.filter((a) => !a.isRead);
  const distributorName = user?.distributorName || 'Al-Rehman Distribution';

  // Get current page title
  const currentTitle =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/employees/') ? 'Employee Detail' :
     location.pathname.startsWith('/locations/') ? 'Edit Location' :
     location.pathname.startsWith('/reports/') ? 'Shift Report Details' :
     location.pathname.startsWith('/assignments/') ? 'Edit Assignment' : 'Workforce Tracker');

  const handleAlertClick = (alert: Alert) => {
    if (!alert.isRead) {
      markReadMutation.mutate(alert.id);
    }
    setShowAlerts(false);
    if (alert.shiftId) {
      navigate(`/reports/shifts/${alert.shiftId}`);
    } else if (alert.employeeId) {
      navigate(`/employees/${alert.employeeId}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="page-title">{currentTitle}</h1>
      </div>

      <div className="header-right">
        {/* Connectivity indicator */}
        <div
          className={`connectivity-badge ${isConnected ? 'connected' : 'unavailable'}`}
          title="Backend System Status"
        >
          <span className="status-dot"></span>
          <span>{isConnected ? 'API Connected' : 'API Standby'}</span>
        </div>

        {/* Distributor Badge */}
        <div className="distributor-badge" title="Active Distributor Account">
          <span className="badge-icon">🏢</span>
          <span className="distributor-name">{distributorName}</span>
        </div>

        {/* Missed-Visit Alert Bell */}
        <div className="notification-wrapper">
          <button
            className={`notification-bell ${unreadAlerts.length > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowAlerts(!showAlerts)}
            title="In-app Alerts & Missed Shift Visits"
            type="button"
          >
            🔔
            {unreadAlerts.length > 0 && (
              <span className="unread-count">{unreadAlerts.length}</span>
            )}
          </button>

          {showAlerts && (
            <div className="alerts-dropdown">
              <div className="dropdown-header">
                <h3>Notifications & Alerts</h3>
                <span className="alert-count-pill">{alerts.length} total</span>
              </div>
              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <div className="empty-alerts">No notifications right now.</div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`alert-item ${!alert.isRead ? 'unread' : 'read'}`}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="alert-item-header">
                        <span className="alert-icon">⚠️</span>
                        <span className="alert-time">
                          {new Date(alert.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="alert-message">{alert.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / Account Dropdown */}
        <div className="user-dropdown-wrapper">
          <button
            className="user-menu-btn"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            type="button"
          >
            <div className="avatar-circle">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <span className="user-name">{user?.name || user?.username || 'Admin User'}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {showAccountMenu && (
            <div className="account-dropdown">
              <div className="account-info">
                <div className="account-title">{user?.name || 'Administrator'}</div>
                <div className="account-email">{user?.username || 'admin@distributor.com'}</div>
                <div className="account-role">Role: {user?.role || 'Admin'}</div>
              </div>
              <div className="dropdown-divider"></div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                type="button"
              >
                🚪 Sign Out / Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
