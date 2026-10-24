import {
  LayoutDashboard, Building2, Users, Clock, CalendarDays, Wallet,
  Bell, ScrollText, Sparkles, UserCircle, ShieldCheck, LucideIcon,
  Megaphone, Calendar
} from 'lucide-react';
import { UserRole } from '../types';

export type NavCategory = 'General' | 'Operations' | 'Finance & Analytics' | 'System';

export interface NavItem {
  path: string;
  label: string;
  category: NavCategory;
  icon: LucideIcon;
  roles: UserRole[];
  phase: string;
  description: string;
}

// ────────────────────────────────────────────────────────────────────────────
// OWNER / ADMIN – Full company control
// Sidebar order per user request: departments, attendance then leave.
// ────────────────────────────────────────────────────────────────────────────
export const ADMIN_NAV_ITEMS: NavItem[] = [
  // General
  { path: '/dashboard',           label: 'Dashboard',               category: 'General',               icon: LayoutDashboard, roles: ['admin'], phase: 'Phase 1', description: 'Live attendance, HR count, on-leave metrics and pending leave approvals.' },

  // Operations (User requested order: departments, attendance then leave, employees)
  { path: '/organization',        label: 'Departments',             category: 'Operations',            icon: Building2,       roles: ['admin'], phase: 'Phase 2', description: 'Company setup, departments, designations, leave types and holidays.' },
  { path: '/attendance',          label: 'Attendance',              category: 'Operations',            icon: Clock,           roles: ['admin'], phase: 'Phase 4', description: 'Daily attendance board, company punch logs, and correction reviews.' },
  { path: '/leave',               label: 'Leave',                   category: 'Operations',            icon: Calendar,        roles: ['admin'], phase: 'Phase 5', description: 'Review and approve/reject all employee leave requests.' },
  { path: '/employees',           label: 'Employees',               category: 'Operations',            icon: Users,           roles: ['admin'], phase: 'Phase 3', description: 'Directory, Employee 360 profile and CSV import/export.' },

  // Finance & Analytics
  { path: '/payroll',             label: 'Payroll',                 category: 'Finance & Analytics',   icon: Wallet,          roles: ['admin'], phase: 'Phase 6', description: 'Salary calculations, monthly runs and finalization.' },
  { path: '/assistant',           label: 'AI Assistant',            category: 'Finance & Analytics',   icon: Sparkles,        roles: ['admin'], phase: 'Phase 9', description: 'AI assistant on all company data and policies.' },

  // System
  { path: '/users',               label: 'Manage Logins',           category: 'System',                icon: ShieldCheck,     roles: ['admin'], phase: 'Phase 2', description: 'Create HR logins, deactivate or reset any login.' },
  { path: '/audit',               label: 'Audit Log',               category: 'System',                icon: ScrollText,      roles: ['admin'], phase: 'Phase 7', description: 'Every important action with before/after values.' },
  { path: '/notifications',       label: 'Announcements',           category: 'System',                icon: Megaphone,        roles: ['admin'], phase: 'Phase 7', description: 'Company-wide notices and admin notifications.' },
];

// ────────────────────────────────────────────────────────────────────────────
// HR OFFICER – People management, attendance board and leave approvals
// ────────────────────────────────────────────────────────────────────────────
export const HR_NAV_ITEMS: NavItem[] = [
  // General
  { path: '/dashboard',           label: 'HR Dashboard',            category: 'General',               icon: LayoutDashboard, roles: ['hr'], phase: 'Phase 1', description: 'Live attendance overview, headcount, late-comers, and pending leaves.' },

  // Operations
  { path: '/organization',        label: 'Departments',             category: 'Operations',            icon: Building2,       roles: ['hr'], phase: 'Phase 2', description: 'View company departments, designations, and leave policies.' },
  { path: '/attendance',          label: 'Attendance',              category: 'Operations',            icon: Clock,           roles: ['hr'], phase: 'Phase 4', description: 'Daily attendance board and correction approvals.' },
  { path: '/leave',               label: 'Leave',                   category: 'Operations',            icon: Calendar,        roles: ['hr'], phase: 'Phase 5', description: 'Review, approve or reject employee leave requests.' },
  { path: '/employees',           label: 'Employees',               category: 'Operations',            icon: Users,           roles: ['hr'], phase: 'Phase 3', description: 'Register new hires, manage profiles and employee records.' },

  // Finance & Analytics
  { path: '/payroll',             label: 'Payroll',                 category: 'Finance & Analytics',   icon: Wallet,          roles: ['hr'], phase: 'Phase 6', description: 'Generate monthly salary draft and review payslips.' },
  { path: '/assistant',           label: 'AI Assistant',            category: 'Finance & Analytics',   icon: Sparkles,        roles: ['hr'], phase: 'Phase 9', description: 'AI assistant on HR data and company policies.' },

  // System
  { path: '/notifications',       label: 'Announcements',           category: 'System',                icon: Megaphone,        roles: ['hr'], phase: 'Phase 7', description: 'Company-wide notices and HR notifications.' },
];

// ────────────────────────────────────────────────────────────────────────────
// EMPLOYEE – Self-service portal (strictly isolated per user wireframe)
// Hand-drawn in media_1792874974938.png:
// 1. clockin/out
// 2. attendance calendar
// 3. Leave apply/cancel
// 4. announcements/notifications
// 5. profile setting
// Plus My Payslips, AI Assistant, and My Dashboard.
// ────────────────────────────────────────────────────────────────────────────
export const EMPLOYEE_NAV_ITEMS: NavItem[] = [
  // Self Service
  { path: '/clockin-out',         label: 'Clock In / Out',          category: 'Operations',            icon: Clock,           roles: ['employee'], phase: 'Phase 4', description: 'Web check in/out with optional camera snapshot and location.' },
  { path: '/attendance/calendar', label: 'Attendance Calendar',     category: 'Operations',            icon: CalendarDays,    roles: ['employee'], phase: 'Phase 4', description: 'Own monthly attendance calendar and correction requests.' },
  { path: '/leave',               label: 'Leave Apply / Cancel',    category: 'Operations',            icon: Calendar,        roles: ['employee'], phase: 'Phase 5', description: 'Apply or cancel leave, view balances and smart leave in plain words.' },
  { path: '/notifications',       label: 'Announcements / Alerts',  category: 'Operations',            icon: Megaphone,        roles: ['employee'], phase: 'Phase 7', description: 'Company announcements and your personal alerts.' },
  { path: '/profile',             label: 'Profile Settings',        category: 'Operations',            icon: UserCircle,      roles: ['employee'], phase: 'Phase 3', description: 'View your own profile; edit phone and address.' },

  // Additional Self-Service Capabilities
  { path: '/payslips',            label: 'My Payslips',             category: 'Finance & Analytics',   icon: Wallet,          roles: ['employee'], phase: 'Phase 6', description: 'Download own payslips and salary breakdown.' },
  { path: '/assistant',           label: 'AI Assistant',            category: 'Finance & Analytics',   icon: Sparkles,        roles: ['employee'], phase: 'Phase 9', description: 'AI assistant on your own attendance, leave and company policies.' },
  { path: '/dashboard',           label: 'My Dashboard',            category: 'General',               icon: LayoutDashboard, roles: ['employee'], phase: 'Phase 8', description: 'Hours worked, late count, leave balance, last payslip.' },
];

// ────────────────────────────────────────────────────────────────────────────
// Master list for route registration (union of all roles, deduplicated by path)
// ────────────────────────────────────────────────────────────────────────────
export const NAV_ITEMS: NavItem[] = (() => {
  const seen = new Set<string>();
  const all = [...ADMIN_NAV_ITEMS, ...HR_NAV_ITEMS, ...EMPLOYEE_NAV_ITEMS];
  return all.map((item) => {
    return item;
  }).filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  }).map((item) => {
    const roles = [...ADMIN_NAV_ITEMS, ...HR_NAV_ITEMS, ...EMPLOYEE_NAV_ITEMS]
      .filter((i) => i.path === item.path)
      .flatMap((i) => i.roles);
    return { ...item, roles: [...new Set(roles)] as UserRole[] };
  });
})();

/** Return navigation items for the given role */
export const navForRole = (role: UserRole): NavItem[] => {
  if (role === 'admin') return ADMIN_NAV_ITEMS;
  if (role === 'hr') return HR_NAV_ITEMS;
  return EMPLOYEE_NAV_ITEMS;
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Owner / Admin',
  hr: 'HR Officer',
  employee: 'Employee',
};

export const ROLE_BADGE_STYLE: Record<UserRole, { variant: 'indigo' | 'emerald' | 'amber'; text: string }> = {
  admin:    { variant: 'indigo',  text: 'Admin'      },
  hr:       { variant: 'amber',   text: 'HR Officer' },
  employee: { variant: 'emerald', text: 'Employee'   },
};
