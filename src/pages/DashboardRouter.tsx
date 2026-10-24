import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { HRDashboard } from './HRDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'hr') {
    return <HRDashboard />;
  }

  return <EmployeeDashboard />;
};

export default DashboardRouter;
