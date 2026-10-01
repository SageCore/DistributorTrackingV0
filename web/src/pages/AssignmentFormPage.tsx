import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEmployees } from '../api/employees';
import { fetchLocations } from '../api/locations';
import { createDailyAssignment } from '../api/assignments';

export const AssignmentFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const defaultDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(defaultDate);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  });

  const activeLocations = locations.filter((loc) => loc.active);

  const filteredLocations = activeLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      (loc.code && loc.code.toLowerCase().includes(locationSearch.toLowerCase()))
  );

  useEffect(() => {
    if (employees.length > 0 && !employeeId) {
      setEmployeeId(employees[0].id || employees[0].employeeId || '');
    }
  }, [employees, employeeId]);

  const saveMutation = useMutation({
    mutationFn: (payload: { employeeId: string; date: string; locationIds: string[] }) =>
      createDailyAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      navigate('/assignments');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Failed to save daily assignment.');
    },
  });

  const toggleLocationSelection = (id: string) => {
    if (selectedLocationIds.includes(id)) {
      setSelectedLocationIds(selectedLocationIds.filter((locId) => locId !== id));
    } else {
      setSelectedLocationIds([...selectedLocationIds, id]);
    }
  };

  const removeLocation = (id: string) => {
    setSelectedLocationIds(selectedLocationIds.filter((locId) => locId !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Please select an employee.');
      return;
    }
    if (selectedLocationIds.length === 0) {
      setError('Please select at least one location to assign.');
      return;
    }

    saveMutation.mutate({
      employeeId,
      date,
      locationIds: selectedLocationIds,
    });
  };

  const selectedLocationsList = activeLocations.filter((loc) =>
    selectedLocationIds.includes(loc.id)
  );

  return (
    <div className="form-page-container">
      <div className="form-card extra-wide">
        <div className="form-card-header">
          <h2>Create Daily Location Assignment</h2>
          <p>
            Assign required customer locations to an employee for a specific work date.
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-row">
            <div className="form-group">
              <label>Work Date *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Select Employee *</label>
              <select
                className="form-select"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              >
                {employees.map((emp) => {
                  const empId = emp.id || emp.employeeId || '';
                  const empCode = emp.employeeCode || emp.employee_code || '';
                  return (
                    <option key={empId} value={empId}>
                      {emp.name} ({empCode})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Dual Panel Layout for Locations Selection */}
          <div className="dual-panel-assignment">
            {/* Left Panel: Available Locations */}
            <div className="assignment-panel left-panel">
              <div className="panel-header">
                <h3>Available Active Locations</h3>
                <input
                  type="text"
                  placeholder="Filter locations..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="form-input search-sm"
                />
              </div>
              <div className="panel-list">
                {filteredLocations.length === 0 ? (
                  <div className="empty-panel-text">No active locations matching search.</div>
                ) : (
                  filteredLocations.map((loc) => {
                    const isChecked = selectedLocationIds.includes(loc.id);
                    return (
                      <label key={loc.id} className={`location-checkbox-item ${isChecked ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLocationSelection(loc.id)}
                        />
                        <div className="item-details">
                          <span className="item-name">{loc.name}</span>
                          <span className="item-sub">
                            {loc.code ? `${loc.code} • ` : ''}
                            {loc.address || 'No address specified'}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Selected Locations & Count */}
            <div className="assignment-panel right-panel">
              <div className="panel-header">
                <h3>Selected Locations ({selectedLocationsList.length})</h3>
                {selectedLocationIds.length > 0 && (
                  <button
                    type="button"
                    className="text-btn danger-text"
                    onClick={() => setSelectedLocationIds([])}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="panel-list">
                {selectedLocationsList.length === 0 ? (
                  <div className="empty-panel-text">
                    Select locations from the left panel to include in this daily assignment.
                  </div>
                ) : (
                  selectedLocationsList.map((loc, idx) => (
                    <div key={loc.id} className="selected-location-chip">
                      <span className="chip-index">{idx + 1}.</span>
                      <span className="chip-name">{loc.name}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => removeLocation(loc.id)}
                        title="Remove location"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/assignments')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={saveMutation.isPending || selectedLocationIds.length === 0}
            >
              {saveMutation.isPending
                ? 'Saving Assignment...'
                : `Assign ${selectedLocationIds.length} Location${selectedLocationIds.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
