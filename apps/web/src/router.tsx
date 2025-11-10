import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/pages/dashboard/dashboard-page';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardPage />} path="/" />
      </Routes>
    </BrowserRouter>
  );
}
