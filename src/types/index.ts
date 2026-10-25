export type UserRole = 'admin' | 'hr' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface ActionResult {
  success: boolean;
  message?: string;
}

export interface Employee {
  id: string;
  _id: string;
  employeeId: string;
  userId?: string;
  name: string;
  fullName?: string;
  fatherName: string;
  email: string;
  phone?: string;
  address?: string;
  department: string;
  designation: string;
  role: UserRole;
  dateOfJoining: string;
  basicSalary: number;
  grossSalary: number;
  allowances?: {
    hra: number;
    medical: number;
    total: number;
  };
  shiftName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  shiftGraceMinutes?: number;
  status: 'active' | 'probation' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentItem {
  _id: string;
  name: string;
  description?: string;
  shiftName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  shiftGraceMinutes?: number;
}

export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Half-Day'
  | 'Absent'
  | 'On Leave'
  | 'Holiday'
  | 'Weekend';

export interface AttendanceLocation {
  lat: number;
  lng: number;
  withinGeofence: boolean;
  distanceMeters: number | null;
}

export interface TodayAttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  workingHours: number;
  checkInLocation?: AttendanceLocation | null;
  checkOutLocation?: AttendanceLocation | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  isManualOverride?: boolean;
  notes?: string;
}

export interface TodayAttendanceResponse {
  today: string;
  employee: {
    employeeId: string;
    fullName: string;
    department: string;
    designation: string;
    shiftName?: string;
    shiftStart?: string;
    shiftEnd?: string;
  };
  policy: {
    shiftName?: string;
    officeStart: string;
    officeEnd?: string;
    graceMinutes: number;
    halfDayHours: number;
    office?: {
      lat?: number | null;
      lng?: number | null;
      radiusMeters?: number;
    };
  };
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  attendance: TodayAttendanceRecord | null;
  pendingResetRequest?: {
    _id: string;
    reason: string;
    createdAt: string;
  } | null;
}

export interface AttendanceBoardRow {
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number;
  workingHours: number;
  checkInLocation: AttendanceLocation | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  isManualOverride: boolean;
  notes: string;
  recordId: string | null;
}

export interface AttendanceBoardResponse {
  date: string;
  isWeekend: boolean;
  holiday: string | null;
  summary: {
    totalEmployees: number;
    present: number;
    late: number;
    halfDay: number;
    onLeave: number;
    absent: number;
  };
  rows: AttendanceBoardRow[];
}

export interface CSVValidationError {
  row: number;
  field: string;
  reason: string;
}

export interface BulkDryRunResult {
  dryRun: boolean;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  canCommit: boolean;
  errors: CSVValidationError[];
  preview: Partial<Employee>[];
}
