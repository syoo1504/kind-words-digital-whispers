
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

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
}

const Scanner = () => {
  const [status, setStatus] = useState('Waiting for QR scan...');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

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
        const timeString = currentTime.toTimeString().slice(0, 5); // HH:MM format
        
        let attendanceType: 'check-in' | 'check-out' = 'check-in';
        let statusMessage = '';

        if (!lastRecord || lastRecord.checkOutTime) {
          // First check-in of the day or checking in after checkout
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
          // Check-out
          attendanceType = 'check-out';
          statusMessage = `✅ Check-out Successful!\nEmployee: ${employeeName}\nTime: ${timeString}`;
          
          const attendanceRecord: AttendanceRecord = {
            ...lastRecord,
            checkOutTime: timeString,
            type: attendanceType,
            timestamp: currentTime.toISOString()
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
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center">
            <img 
              src="https://jkseng.com/images/jks_logo_complete.svg" 
              alt="AttendEase Logo" 
              className="h-16 w-auto"
            />
          </div>
          <nav className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/scanner')}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <span>📷</span>
              <span>Scan Attendance</span>
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <span>📊</span>
              <span>Admin Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex flex-col items-center py-8">
        <div 
          id="reader" 
          className="w-80 max-w-sm bg-white rounded-2xl p-4 shadow-xl border-2 border-gray-200"
        ></div>
        
        <div className="mt-8 w-4/5 max-w-md bg-green-50 border-l-6 border-green-500 p-4 rounded-xl shadow-md text-center">
          <div className="text-lg whitespace-pre-line">{status}</div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-blue-600 text-white p-4 text-center">
        &copy; 2025 AttendEase - QR Attendance System
      </footer>
    </div>
  );
};

export default Scanner;
