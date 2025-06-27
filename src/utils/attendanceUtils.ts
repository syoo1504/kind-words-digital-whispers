
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
  timestamp: string;
  status: 'success' | 'error';
  type: 'check-in' | 'check-out';
  overtimeHours?: number;
}

export class AttendanceUtils {
  private static readonly WORK_START_TIME = '09:00';

  static getEmployeeData(): Employee[] {
    return JSON.parse(localStorage.getItem('employeeData') || '[]');
  }

  static findEmployee(employeeId: string): Employee | null {
    const employees = this.getEmployeeData();
    return employees.find(emp => emp.employee_id === employeeId) || null;
  }

  static isLateArrival(checkInTime: string): boolean {
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const workStart = new Date(`1970-01-01T${this.WORK_START_TIME}:00`);
    return checkIn > workStart;
  }

  static getLastAttendanceRecord(employeeId: string): AttendanceRecord | null {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const employeeRecords = records.filter((r: AttendanceRecord) => r.employeeId === employeeId);
    
    // Get today's records only
    const today = new Date().toDateString();
    const todayRecords = employeeRecords.filter((r: AttendanceRecord) => 
      new Date(r.timestamp).toDateString() === today
    );
    
    return todayRecords.length > 0 ? todayRecords[0] : null;
  }

  static saveAttendanceRecord(record: AttendanceRecord): void {
    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    // Check if updating existing record or creating new one
    const existingIndex = existingRecords.findIndex((r: AttendanceRecord) => 
      r.employeeId === record.employeeId && 
      new Date(r.timestamp).toDateString() === new Date(record.timestamp).toDateString()
    );

    if (existingIndex !== -1 && record.type === 'check-out') {
      // Update existing record with check-out time
      existingRecords[existingIndex].checkOutTime = record.checkOutTime;
      existingRecords[existingIndex].type = 'check-out';
      existingRecords[existingIndex].overtimeHours = record.overtimeHours;
    } else {
      // Add new record
      const updatedRecords = [record, ...existingRecords];
      localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
      return;
    }
    
    localStorage.setItem('attendanceRecords', JSON.stringify(existingRecords));
  }

  static calculateOvertimeHours(checkInTime: string, checkOutTime: string): number {
    if (!checkInTime || !checkOutTime) return 0;
    
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const checkOut = new Date(`1970-01-01T${checkOutTime}`);
    
    let diffMs = checkOut.getTime() - checkIn.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Handle next day checkout
    }
    
    const totalHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, totalHours - 8); // Overtime after 8 hours
  }

  static extractEmployeeIdFromQR(qrText: string): { employeeId: string; success: boolean } {
    try {
      const url = new URL(qrText);
      const empId = url.searchParams.get('empId');
      if (empId) {
        return { employeeId: empId, success: true };
      } else {
        return { employeeId: '', success: false };
      }
    } catch (e) {
      return { employeeId: '', success: false };
    }
  }
}
