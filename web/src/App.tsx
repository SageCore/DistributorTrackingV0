import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveTrackingPage } from './pages/LiveTrackingPage';
import { EmployeesListPage } from './pages/EmployeesListPage';
import { CreateEmployeePage } from './pages/CreateEmployeePage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { LocationsListPage } from './pages/LocationsListPage';
import { LocationFormPage } from './pages/LocationFormPage';
import { AssignmentsListPage } from './pages/AssignmentsListPage';
import { AssignmentFormPage } from './pages/AssignmentFormPage';
import { ReportsListPage } from './pages/ReportsListPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { ShiftListPage } from './pages/ShiftListPage';
import { ShiftDetailPage } from './pages/ShiftDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected V2 Authenticated Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="live" element={<LiveTrackingPage />} />

              {/* Employees Routes */}
              <Route path="employees" element={<EmployeesListPage />} />
              <Route path="employees/new" element={<CreateEmployeePage />} />
              <Route path="employees/:employeeId" element={<EmployeeDetailPage />} />

              {/* Customer Locations Routes */}
              <Route path="locations" element={<LocationsListPage />} />
              <Route path="locations/new" element={<LocationFormPage />} />
              <Route path="locations/:locationId/edit" element={<LocationFormPage />} />

              {/* Daily Assignments Routes */}
              <Route path="assignments" element={<AssignmentsListPage />} />
              <Route path="assignments/new" element={<AssignmentFormPage />} />
              <Route path="assignments/:assignmentId/edit" element={<AssignmentFormPage />} />

              {/* Shift & Delivery Reports Routes */}
              <Route path="reports" element={<ReportsListPage />} />
              <Route path="reports/shifts/:shiftId" element={<ReportDetailPage />} />

              {/* Backward compatibility for V1 Shift routes */}
              <Route path="shifts" element={<ShiftListPage />} />
              <Route path="shifts/:shiftId" element={<ShiftDetailPage />} />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
