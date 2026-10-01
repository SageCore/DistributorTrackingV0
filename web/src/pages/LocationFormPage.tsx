import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLocationDetail, createLocation, updateLocation } from '../api/locations';
import { LocationMapPicker } from '../components/map/LocationMapPicker';

export const LocationFormPage: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!locationId;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number>(24.8607);
  const [longitude, setLongitude] = useState<number>(67.0011);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: existingLocation, isLoading: isFetching } = useQuery({
    queryKey: ['locationDetail', locationId],
    queryFn: () => (locationId ? fetchLocationDetail(locationId) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingLocation) {
      setName(existingLocation.name);
      setCode(existingLocation.code || '');
      setAddress(existingLocation.address || '');
      setContactName(existingLocation.contactName || '');
      setPhone(existingLocation.phone || '');
      setNotes(existingLocation.notes || '');
      setLatitude(existingLocation.latitude);
      setLongitude(existingLocation.longitude);
      setActive(existingLocation.active);
    }
  }, [existingLocation]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit && locationId
        ? updateLocation(locationId, payload)
        : createLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      navigate('/locations');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Failed to save location. Please check coordinates.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Location Name is required.');
      return;
    }
    if (isNaN(latitude) || isNaN(longitude) || (latitude === 0 && longitude === 0)) {
      setError('Please select valid latitude and longitude coordinates on the map.');
      return;
    }

    saveMutation.mutate({
      name,
      code,
      address,
      contactName,
      phone,
      notes,
      latitude: Number(latitude),
      longitude: Number(longitude),
      active,
    });
  };

  if (isEdit && isFetching) {
    return (
      <div className="table-loader">
        <div className="spinner"></div>
        <span>Loading location details...</span>
      </div>
    );
  }

  return (
    <div className="form-page-container">
      <div className="form-card">
        <div className="form-card-header">
          <h2>{isEdit ? 'Edit Location' : 'Add New Customer Location'}</h2>
          <p>
            Define business / shop location details and set coordinates via map pin placement.
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-row">
            <div className="form-group">
              <label>Location Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Al-Madina Superstore"
                required
              />
            </div>

            <div className="form-group">
              <label>Location / Shop Code</label>
              <input
                type="text"
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SHOP-402"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Main Commercial Area, Block 4, Gulshan-e-Iqbal"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Tariq Mehmood"
              />
            </div>

            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 321 9876543"
              />
            </div>
          </div>

          {/* Map Pin Placement Section */}
          <div className="form-section-title">
            <h3>Coordinates & Map Location Selection *</h3>
            <span className="radius-info-tag">
              ℹ️ Delivery verification uses 50 metres radius around these coordinates.
            </span>
          </div>

          <div className="map-selection-box">
            <LocationMapPicker
              latitude={latitude}
              longitude={longitude}
              onPositionChange={(lat, lng) => {
                setLatitude(Number(lat.toFixed(6)));
                setLongitude(Number(lng.toFixed(6)));
              }}
            />
          </div>

          <div className="form-row" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label>Latitude *</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label>Longitude *</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes / Delivery Instructions (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Back door delivery access only."
            ></textarea>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>Active Location (Available for daily assignment)</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/locations')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving Location...' : 'Save Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
