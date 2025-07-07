
export interface Employee {
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  qrData: string;
  checkInTime?: string;
  checkOutTime?: string;
  isLate: boolean;
  lateDurationMinutes?: number;
  timestamp: string;
  status: 'success' | 'error';
  type: 'check-in' | 'check-out';
  overtimeHours?: number;
}

export interface ScanResult {
  success: boolean;
  message: string;
  data?: AttendanceRecord;
}
