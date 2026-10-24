import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { Landing } from './pages/Landing';
import { Setup } from './pages/Setup';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';
import { Organization } from './pages/Organization';
import { Logins } from './pages/Logins';
import { Employees } from './pages/Employees';
import { AttendanceBoard } from './pages/AttendanceBoard';
import { ClockInOut } from './pages/ClockInOut';
import { AttendanceCalendar } from './pages/AttendanceCalendar';
import { Leave } from './pages/Leave';
import { Payroll } from './pages/Payroll';
import { AuditLogPage } from './pages/AuditLogPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AnnouncementsNotifications } from './pages/AnnouncementsNotifications';
import { Profile } from './pages/Profile';
import { DashboardRouter } from './pages/DashboardRouter';
import { Payslips } from './pages/Payslips';
import { NAV_ITEMS } from './config/nav';

// Map route paths to their dedicated page components.
const PAGES: Record<string, React.ReactElement> = {
  '/dashboard':           <DashboardRouter />,            // AdminDashboard, HRDashboard, or EmployeeDashboard
  '/organization':        <Organization />,               // Admin + HR: Departments, Designations, Leave Types, Rules
  '/attendance':          <AttendanceBoard />,            // Admin + HR: Daily Attendance Board & Correction Review
  '/clockin-out':         <ClockInOut />,                 // Employee: Camera Face + Web Clock In / Out
  '/attendance/calendar': <AttendanceCalendar />,         // Employee: Own monthly attendance calendar & corrections
  '/leave':               <Leave />,                      // Role-adapted: Employee self-service / Admin & HR review
  '/employees':           <Employees />,                  // Admin + HR: Directory, Employee 360, CSV Import/Export
  '/payroll':             <Payroll />,                    // Admin + HR: Monthly salary runs, tax slabs, lock month
  '/users':               <Logins />,                     // Admin only: create/manage HR logins
  '/audit':               <AuditLogPage />,               // Admin only: immutable audit logs
  '/notifications':       <AnnouncementsNotifications />,    // All roles: Announcements & in-app notifications
  '/profile':             <Profile />,                    // Employee: own profile edit
  '/payslips':            <Payslips />,                   // Employee: own payslip download
  '/assistant':           <AIAssistantPage />,            // All roles: Role-scoped AI Assistant
};

export const App: React.FC = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/"               element={<Landing />} />
    <Route path="/setup"          element={<Setup />} />
    <Route path="/signup"         element={<Setup />} />
    <Route path="/login"          element={<Login />} />
    <Route path="/change-password" element={<ChangePassword />} />
    <Route path="/unauthorized"   element={<Unauthorized />} />

    {/* Protected app shell with strictly role-scoped sidebar */}
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      {/*
        Register every unique route from NAV_ITEMS.
        Each route is guarded by allowedRoles – unauthorized roles are blocked.
      */}
      {NAV_ITEMS.map((item) => (
        <Route
          key={item.path}
          path={item.path}
          element={
            <ProtectedRoute allowedRoles={item.roles}>
              {PAGES[item.path] ?? <DashboardRouter />}
            </ProtectedRoute>
          }
        />
      ))}
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
