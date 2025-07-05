
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import CameraScanner from '@/components/CameraScanner';
import AttendanceStatus from '@/components/AttendanceStatus';
import AttendanceInstructions from '@/components/AttendanceInstructions';
import EmployeePortalHeader from '@/components/EmployeePortalHeader';
import EmployeePortalFooter from '@/components/EmployeePortalFooter';
import { AttendanceUtils, AttendanceRecord } from '@/utils/attendanceUtils';

const EmployeePortal = () => {
  const [status, setStatus] = useState('Waiting for QR scan...');

  const playBeepSound = () => {
    const beep = new Audio('/beep.mp3');
    beep.play().catch(() => console.log('Could not play beep sound'));
  };

  const processAttendance = (employeeId: string, employeeName: string, qrText: string) => {
    const lastRecord = AttendanceUtils.getLastAttendanceRecord(employeeId);
    const currentTime = new Date();
    const timeString = currentTime.toTimeString().slice(0, 5);
    
    let attendanceType: 'check-in' | 'check-out' = 'check-in';
    let statusMessage = '';

    if (!lastRecord || lastRecord.checkOutTime) {
      // Check-in logic
      attendanceType = 'check-in';
      const isLate = AttendanceUtils.isLateArrival(timeString);
      statusMessage = `✅ Check-in Successful!\nEmployee: ${employeeName}\nTime: ${timeString}${isLate ? ' (LATE)' : ''}`;
      
      const attendanceRecord: AttendanceRecord = {
        id: Date.now().toString(),
        employeeId: employeeId,
        employeeName: employeeName,
        qrData: qrText,
        checkInTime: timeString,
        isLate: isLate,
        timestamp: currentTime.toISOString(),
        status: 'success',
        type: attendanceType
      };
      
      AttendanceUtils.saveAttendanceRecord(attendanceRecord);
    } else {
      // Check-out logic with overtime calculation
      attendanceType = 'check-out';
      const overtimeHours = AttendanceUtils.calculateOvertimeHours(lastRecord.checkInTime || '', timeString);
      const overtimeText = overtimeHours > 0 ? `\n⏱️ Overtime: ${overtimeHours.toFixed(1)}h` : '';
      statusMessage = `✅ Check-out Successful!\nEmployee: ${employeeName}\nTime: ${timeString}${overtimeText}`;
      
      const attendanceRecord: AttendanceRecord = {
        ...lastRecord,
        checkOutTime: timeString,
        type: attendanceType,
        timestamp: currentTime.toISOString(),
        overtimeHours: overtimeHours
      };
      
      AttendanceUtils.saveAttendanceRecord(attendanceRecord);
    }

    setStatus(statusMessage);
  };

  const onScanSuccess = (qrText: string) => {
    playBeepSound();

    const { employeeId, success } = AttendanceUtils.extractEmployeeIdFromQR(qrText);

    if (!success) {
      setStatus(`❌ Invalid QR format.\nQR Data: ${qrText}`);
    } else {
      const employee = AttendanceUtils.findEmployee(employeeId);
      const employeeName = employee ? employee.name : 'Unknown Employee';
      
      if (!employee) {
        setStatus(`❌ Employee not found in system.\nEmployee ID: ${employeeId}`);
      } else {
        processAttendance(employeeId, employeeName, qrText);
      }
    }

    // Reload after 5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      <EmployeePortalHeader />

      <main className="flex flex-col items-center py-8">
        <CameraScanner onScanSuccess={onScanSuccess} />
        
        <AttendanceStatus status={status} />

        <AttendanceInstructions />
      </main>

      <EmployeePortalFooter />
    </div>
  );
};

export default EmployeePortal;
