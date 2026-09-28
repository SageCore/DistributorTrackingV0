import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { ShiftListPage } from './pages/ShiftListPage';
import { ShiftDetailPage } from './pages/ShiftDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/shifts" replace />} />
              <Route path="/shifts" element={<ShiftListPage />} />
              <Route path="/shifts/:shiftId" element={<ShiftDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
