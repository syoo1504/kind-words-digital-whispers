import { ScanResult, AttendanceRecord } from '@/types/attendance';
import { EmployeeUtils } from './employeeUtils';
import { AttendanceRecordUtils } from './attendanceRecordUtils';
import { TimeUtils } from './timeUtils';

export const processAttendanceScan = (qrData: string): ScanResult => {
  try {
    // Extract employee ID from QR code
    const { employeeId, success: extractSuccess } = EmployeeUtils.extractEmployeeIdFromQR(qrData);
    
    if (!extractSuccess || !employeeId) {
      return {
        success: false,
        message: "Invalid QR code format. Please scan a valid employee QR code."
      };
    }

    // Find employee
    const employee = EmployeeUtils.findEmployee(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee not found. Please contact administrator."
      };
    }

    // Check if employee is active (case insensitive)
    if (employee.status.toLowerCase() !== 'active') {
      return {
        success: false,
        message: "Employee account is not active. Please contact administrator."
      };
    }

    // Get current time
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    
    // Calculate late duration if applicable
    const calculateLateDuration = (checkInTime: string): number => {
      const checkIn = new Date(`1970-01-01T${checkInTime}`);
      const workStart = new Date(`1970-01-01T09:00:00`);
      
      if (checkIn <= workStart) return 0;
      
      const diffMs = checkIn.getTime() - workStart.getTime();
      return Math.round(diffMs / (1000 * 60)); // Return minutes late
    };
    
    // Check if there's already a record for today
    const lastRecord = AttendanceRecordUtils.getLastAttendanceRecord(employeeId);
    
    let recordType: 'check-in' | 'check-out' = 'check-in';
    let message = '';
    
    if (lastRecord && !lastRecord.checkOutTime) {
      // Employee has checked in but not checked out - this is a check-out
      recordType = 'check-out';
      const overtimeHours = TimeUtils.calculateOvertimeHours(
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
      
      AttendanceRecordUtils.saveAttendanceRecord(updatedRecord);
      message = `Check-out successful at ${currentTime}. ${overtimeHours > 0 ? `Overtime: ${overtimeHours.toFixed(2)} hours` : 'Have a great day!'}`;
      
      return {
        success: true,
        message,
        data: updatedRecord
      };
    } else {
      // This is a check-in
      const isLate = TimeUtils.isLateArrival(currentTime);
      const lateDurationMinutes = isLate ? calculateLateDuration(currentTime) : 0;
      
      const newRecord: AttendanceRecord = {
        id: `${employeeId}_${now.getTime()}`,
        employeeId,
        employeeName: employee.name,
        qrData,
        checkInTime: currentTime,
        isLate,
        lateDurationMinutes,
        timestamp: now.toISOString(),
        status: 'success',
        type: 'check-in'
      };
      
      AttendanceRecordUtils.saveAttendanceRecord(newRecord);
      message = `Check-in successful at ${currentTime}. ${isLate ? `Note: You are ${lateDurationMinutes} minutes late.` : 'Welcome to work!'}`;
      
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
