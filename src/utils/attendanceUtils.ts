
import { SecureDataService } from '@/services/secureDataService';

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

export interface ScanResult {
  success: boolean;
  message: string;
  data?: AttendanceRecord;
}

export class AttendanceUtils {
  private static readonly WORK_START_TIME = '09:00';

  static getEmployeeData(): Employee[] {
    return SecureDataService.getEmployeeData();
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
    const records = SecureDataService.getAttendanceRecords();
    const employeeRecords = records.filter((r: AttendanceRecord) => r.employeeId === employeeId);
    
    // Get today's records only
    const today = new Date().toDateString();
    const todayRecords = employeeRecords.filter((r: AttendanceRecord) => 
      new Date(r.timestamp).toDateString() === today
    );
    
    return todayRecords.length > 0 ? todayRecords[0] : null;
  }

  static saveAttendanceRecord(record: AttendanceRecord): void {
    const existingRecords = SecureDataService.getAttendanceRecords();
    
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
      SecureDataService.saveAttendanceRecords(existingRecords);
    } else {
      // Add new record
      SecureDataService.addAttendanceRecord(record);
    }
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

export const processAttendanceScan = (qrData: string): ScanResult => {
  try {
    // Extract employee ID from QR code
    const { employeeId, success: extractSuccess } = AttendanceUtils.extractEmployeeIdFromQR(qrData);
    
    if (!extractSuccess || !employeeId) {
      return {
        success: false,
        message: "Invalid QR code format. Please scan a valid employee QR code."
      };
    }

    // Find employee
    const employee = AttendanceUtils.findEmployee(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee not found. Please contact administrator."
      };
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      return {
        success: false,
        message: "Employee account is not active. Please contact administrator."
      };
    }

    // Get current time
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    
    // Check if there's already a record for today
    const lastRecord = AttendanceUtils.getLastAttendanceRecord(employeeId);
    
    let recordType: 'check-in' | 'check-out' = 'check-in';
    let message = '';
    
    if (lastRecord && !lastRecord.checkOutTime) {
      // Employee has checked in but not checked out - this is a check-out
      recordType = 'check-out';
      const overtimeHours = AttendanceUtils.calculateOvertimeHours(
        lastRecord.checkInTime || currentTime,
        currentTime
      );
      
      const updatedRecord: AttendanceRecord = {
        ...lastRecord,
        checkOutTime: currentTime,
        type: 'check-out',
        overtimeHours,
        timestamp: now.toISOString()
      };
      
      AttendanceUtils.saveAttendanceRecord(updatedRecord);
      message = `Check-out successful at ${currentTime}. ${overtimeHours > 0 ? `Overtime: ${overtimeHours.toFixed(2)} hours` : 'Have a great day!'}`;
      
      return {
        success: true,
        message,
        data: updatedRecord
      };
    } else {
      // This is a check-in
      const isLate = AttendanceUtils.isLateArrival(currentTime);
      
      const newRecord: AttendanceRecord = {
        id: `${employeeId}_${now.getTime()}`,
        employeeId,
        employeeName: employee.name,
        qrData,
        checkInTime: currentTime,
        isLate,
        timestamp: now.toISOString(),
        status: 'success',
        type: 'check-in'
      };
      
      AttendanceUtils.saveAttendanceRecord(newRecord);
      message = `Check-in successful at ${currentTime}. ${isLate ? 'Note: You are late today.' : 'Welcome to work!'}`;
      
      return {
        success: true,
        message,
        data: newRecord
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to process attendance. Please try again."
    };
  }
};
