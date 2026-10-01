import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchLocations, toggleLocationActive } from '../api/locations';

export const LocationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: locations = [], isLoading, isError } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  });

  const toggleMutation = useMutation({
    mutationFn: (params: { locationId: string; active: boolean }) =>
      toggleLocationActive(params.locationId, params.active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.code && loc.code.toLowerCase().includes(search.toLowerCase())) ||
      (loc.address && loc.address.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggleStatus = (id: string, currentActive: boolean, name: string) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (
      window.confirm(
        `Are you sure you want to ${action} location "${name}"? Historical visit records will be preserved.`
      )
    ) {
      toggleMutation.mutate({ locationId: id, active: !currentActive });
    }
  };

  return (
    <div className="locations-page">
      <div className="table-actions-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search location name, code, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
        <button
          className="primary-btn"
          onClick={() => navigate('/locations/new')}
          type="button"
        >
          ➕ Add Location
        </button>
      </div>

      {isLoading ? (
        <div className="table-loader">
          <div className="spinner"></div>
          <span>Loading customer locations...</span>
        </div>
      ) : isError ? (
        <div className="error-box">Failed to load customer locations.</div>
      ) : filteredLocations.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon">🏢</div>
          <h3>No Locations Found</h3>
          <p>Add customer, shop, or business destination locations to assign them to employees.</p>
          <button className="primary-btn" onClick={() => navigate('/locations/new')}>
            Add Your First Location
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Location Name & Code</th>
                <th>Address</th>
                <th>Coordinates (Lat, Lng)</th>
                <th>Status</th>
                <th>Verification Radius</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((loc) => (
                <tr key={loc.id}>
                  <td>
                    <div className="location-cell">
                      <span className="location-name">{loc.name}</span>
                      <span className="location-code">{loc.code || '—'}</span>
                    </div>
                  </td>
                  <td>{loc.address || '—'}</td>
                  <td>
                    <span className="coords-badge">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${loc.active ? 'active' : 'inactive'}`}>
                      {loc.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className="radius-pill">50 m</span>
                  </td>
                  <td>
                    <div className="action-buttons-group">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => navigate(`/locations/${loc.id}/edit`)}
                        title="Edit Location Details"
                        type="button"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className={`action-btn ${loc.active ? 'deactivate-btn' : 'activate-btn'}`}
                        onClick={() => handleToggleStatus(loc.id, loc.active, loc.name)}
                        type="button"
                      >
                        {loc.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
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
