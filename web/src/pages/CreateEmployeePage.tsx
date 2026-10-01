import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createEmployee } from '../api/employees';

export const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate('/employees');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Failed to create employee. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeCode.trim() || !loginIdentifier.trim()) {
      setError('Please fill in all required fields marked with *');
      return;
    }
    createMutation.mutate({
      name,
      employeeCode,
      phone,
      loginIdentifier,
      password,
      active,
    });
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <div className="form-card-header">
          <h2>Create New Employee</h2>
          <p>Register a field employee for daily GPS tracking and location assignments.</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-row">
            <div className="form-group">
              <label>Employee Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed Khan"
                required
              />
            </div>

            <div className="form-group">
              <label>Employee Code *</label>
              <input
                type="text"
                className="form-input"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="e.g. EMP-101"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
              />
            </div>

            <div className="form-group">
              <label>App Login Identifier / Username *</label>
              <input
                type="text"
                className="form-input"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. ahmed.khan"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>App Password / Activation Pin *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span>Account Active (Permit Login)</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/employees')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
