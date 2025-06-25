
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from '@/components/ui/use-toast';

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: string;
}

interface AttendanceRecord {
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

const EmployeePortal = () => {
  const [status, setStatus] = useState('Waiting for QR scan...');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Standard work start time (9:00 AM)
  const WORK_START_TIME = '09:00';

  const getEmployeeData = (): Employee[] => {
    return JSON.parse(localStorage.getItem('employeeData') || '[]');
  };

  const findEmployee = (employeeId: string): Employee | null => {
    const employees = getEmployeeData();
    return employees.find(emp => emp.employee_id === employeeId) || null;
  };

  const isLateArrival = (checkInTime: string): boolean => {
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const workStart = new Date(`1970-01-01T${WORK_START_TIME}:00`);
    return checkIn > workStart;
  };

  const getLastAttendanceRecord = (employeeId: string): AttendanceRecord | null => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const employeeRecords = records.filter((r: AttendanceRecord) => r.employeeId === employeeId);
    
    // Get today's records only
    const today = new Date().toDateString();
    const todayRecords = employeeRecords.filter((r: AttendanceRecord) => 
      new Date(r.timestamp).toDateString() === today
    );
    
    return todayRecords.length > 0 ? todayRecords[0] : null;
  };

  const saveAttendanceRecord = (record: AttendanceRecord) => {
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
  };

  const onScanSuccess = (qrText: string) => {
    // Play beep sound
    const beep = new Audio('/beep.mp3');
    beep.play().catch(() => console.log('Could not play beep sound'));

    let employeeId = '';
    let recordStatus: 'success' | 'error' = 'success';

    // Extract employee ID from QR code
    try {
      const url = new URL(qrText);
      const empId = url.searchParams.get('empId');
      if (empId) {
        employeeId = empId;
      } else {
        recordStatus = 'error';
        setStatus(`❌ Invalid QR format.\nQR Data: ${qrText}`);
      }
    } catch (e) {
      recordStatus = 'error';
      setStatus(`❌ Invalid QR format.\nQR Data: ${qrText}`);
    }

    if (recordStatus === 'success' && employeeId) {
      const employee = findEmployee(employeeId);
      const employeeName = employee ? employee.name : 'Unknown Employee';
      
      if (!employee) {
        setStatus(`❌ Employee not found in system.\nEmployee ID: ${employeeId}`);
        recordStatus = 'error';
      } else {
        const lastRecord = getLastAttendanceRecord(employeeId);
        const currentTime = new Date();
        const timeString = currentTime.toTimeString().slice(0, 5);
        
        let attendanceType: 'check-in' | 'check-out' = 'check-in';
        let statusMessage = '';

        if (!lastRecord || lastRecord.checkOutTime) {
          // Check-in logic
          attendanceType = 'check-in';
          const isLate = isLateArrival(timeString);
          statusMessage = `✅ Check-in Successful!\nEmployee: ${employeeName}\nTime: ${timeString}${isLate ? ' (LATE)' : ''}`;
          
          const attendanceRecord: AttendanceRecord = {
            id: Date.now().toString(),
            employeeId: employeeId,
            employeeName: employeeName,
            qrData: qrText,
            checkInTime: timeString,
            isLate: isLate,
            timestamp: currentTime.toISOString(),
            status: recordStatus,
            type: attendanceType
          };
          
          saveAttendanceRecord(attendanceRecord);
        } else {
          // Check-out logic with overtime calculation
          attendanceType = 'check-out';
          const overtimeHours = calculateOvertimeHours(lastRecord.checkInTime || '', timeString);
          const overtimeText = overtimeHours > 0 ? `\n⏱️ Overtime: ${overtimeHours.toFixed(1)}h` : '';
          statusMessage = `✅ Check-out Successful!\nEmployee: ${employeeName}\nTime: ${timeString}${overtimeText}`;
          
          const attendanceRecord: AttendanceRecord = {
            ...lastRecord,
            checkOutTime: timeString,
            type: attendanceType,
            timestamp: currentTime.toISOString(),
            overtimeHours: overtimeHours
          };
          
          saveAttendanceRecord(attendanceRecord);
        }

        setStatus(statusMessage);
      }
    }

    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.clear();
      setIsScanning(false);
    }

    // Reload scanner after 5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  };

  const onScanFailure = (error: string) => {
    console.log('Scan error:', error);
  };

  // Calculate overtime hours
  const calculateOvertimeHours = (checkInTime: string, checkOutTime: string): number => {
    if (!checkInTime || !checkOutTime) return 0;
    
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const checkOut = new Date(`1970-01-01T${checkOutTime}`);
    
    let diffMs = checkOut.getTime() - checkIn.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Handle next day checkout
    }
    
    const totalHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, totalHours - 8); // Overtime after 8 hours
  };

  useEffect(() => {
    if (isScanning) {
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: 250 },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 to-blue-100">
      <header className="bg-gradient-to-r from-green-600 to-green-400 text-white p-4 shadow-lg">
        <div className="flex justify-center items-center max-w-6xl mx-auto">
          <div className="flex items-center">
            <img 
              src="https://jkseng.com/images/jks_logo_complete.svg" 
              alt="AttendEase Logo" 
              className="h-16 w-auto mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold">Employee Portal</h1>
              <p className="text-green-100">Scan your QR code for attendance</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center py-8">
        <div 
          id="reader" 
          className="w-80 max-w-sm bg-white rounded-2xl p-4 shadow-xl border-2 border-green-200"
        ></div>
        
        <div className={`mt-8 w-4/5 max-w-md border-l-6 p-4 rounded-xl shadow-md text-center ${
          status.includes('❌') 
            ? 'bg-red-50 border-red-500' 
            : 'bg-green-50 border-green-500'
        }`}>
          <div className="text-lg whitespace-pre-line">{status}</div>
        </div>

        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4 text-center">Instructions</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Position your QR code in front of the camera</li>
            <li>• Make sure the QR code is clear and well-lit</li>
            <li>• Wait for the beep sound to confirm scan</li>
            <li>• First scan of the day = Check-in</li>
            <li>• Second scan of the day = Check-out</li>
          </ul>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-green-600 text-white p-4 text-center">
        &copy; 2025 AttendEase - Employee Attendance Portal
      </footer>
    </div>
  );
};

export default EmployeePortal;
