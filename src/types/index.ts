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
  status: 'active' | 'probation' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
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

