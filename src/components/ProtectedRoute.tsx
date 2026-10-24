import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Permission, hasPermission } from '../config/rbac';
import { FullPageSpinner } from './ui';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredPermission }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner label="Verifying your session…" />;
  if (!isAuthenticated || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  if (requiredPermission && !hasPermission(user, requiredPermission)) return <Navigate to="/unauthorized" replace />;
  return children;
};

