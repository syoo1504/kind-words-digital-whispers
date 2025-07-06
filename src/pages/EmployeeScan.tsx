
import React from 'react';
import { toast } from '@/components/ui/use-toast';
import EmployeeNavigation from '@/components/EmployeeNavigation';
import CameraScanner from '@/components/CameraScanner';
import FileUploadScanner from '@/components/FileUploadScanner';
import ScanInstructions from '@/components/ScanInstructions';
import { EmployeeUtils, AttendanceRecordUtils, TimeUtils } from '@/utils/attendanceUtils';

const EmployeeScan = () => {
  const handleScanSuccess = (qrData: string) => {
    console.log('QR scan successful, data:', qrData);
    
    try {
      // Extract employee ID from QR code
      const { employeeId, success } = EmployeeUtils.extractEmployeeIdFromQR(qrData);
      
      if (!success || !employeeId) {
        console.log('Failed to extract employee ID');
        toast({
          title: "Invalid QR Code",
          description: "Could not read employee ID from QR code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Find employee
      const employee = EmployeeUtils.findEmployee(employeeId);
      if (!employee) {
        console.log('Employee not found for ID:', employeeId);
        toast({
          title: "Employee Not Found",
          description: `Employee ID ${employeeId} not found in system. Please contact administrator.`,
          variant: "destructive",
        });
        return;
      }

      // Process attendance
      const lastRecord = AttendanceRecordUtils.getLastAttendanceRecord(employeeId);
      const currentTime = new Date();
      const timeString = currentTime.toTimeString().slice(0, 5);
      
      let attendanceType: 'check-in' | 'check-out' = 'check-in';
      let message = '';

      if (!lastRecord || lastRecord.checkOutTime) {
        // Check-in logic
        attendanceType = 'check-in';
        const isLate = TimeUtils.isLateArrival(timeString);
        message = `Check-in successful at ${timeString}. ${isLate ? 'Note: You are late today.' : 'Welcome to work!'}`;
        
        const attendanceRecord = {
          id: Date.now().toString(),
          employeeId: employeeId,
          employeeName: employee.name,
          qrData: qrData,
          checkInTime: timeString,
          isLate: isLate,
          timestamp: currentTime.toISOString(),
          status: 'success' as const,
          type: attendanceType
        };
        
        AttendanceRecordUtils.saveAttendanceRecord(attendanceRecord);
      } else {
        // Check-out logic
        attendanceType = 'check-out';
        const overtimeHours = TimeUtils.calculateOvertimeHours(lastRecord.checkInTime || '', timeString);
        message = `Check-out successful at ${timeString}. ${overtimeHours > 0 ? `Overtime: ${overtimeHours.toFixed(1)} hours` : 'Have a great day!'}`;
        
        const attendanceRecord = {
          ...lastRecord,
          checkOutTime: timeString,
          type: attendanceType,
          timestamp: currentTime.toISOString(),
          overtimeHours: overtimeHours
        };
        
        AttendanceRecordUtils.saveAttendanceRecord(attendanceRecord);
      }

      toast({
        title: "Attendance Recorded",
        description: message,
      });
      
    } catch (error) {
      console.error('Error processing attendance:', error);
      toast({
        title: "Error",
        description: "Failed to process attendance scan. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      <EmployeeNavigation />
      
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Scan QR Code</h1>
          <p className="text-gray-600">Mark your attendance by scanning your QR code</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CameraScanner onScanSuccess={handleScanSuccess} />
          <FileUploadScanner onScanSuccess={handleScanSuccess} />
        </div>

        <div className="mt-6">
          <ScanInstructions />
        </div>
      </main>
      
      {/* Temporary element for QR scanning */}
      <div id="temp-qr-reader" style={{ display: 'none' }}></div>
    </div>
  );
};

export default EmployeeScan;
