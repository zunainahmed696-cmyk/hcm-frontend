import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { HRDashboard } from './HRDashboard';

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'hr') {
    return <HRDashboard />;
  }

  // Employees do not see dashboards — redirect to their Clock In / Out terminal
  return <Navigate to="/clockin-out" replace />;
};

export default DashboardRouter;
