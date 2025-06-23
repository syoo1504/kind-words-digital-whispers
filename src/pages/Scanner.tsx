
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  qrData: string;
  timestamp: string;
  status: 'success' | 'error';
}

const Scanner = () => {
  const [status, setStatus] = useState('Waiting for QR scan...');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  const saveAttendanceRecord = (record: AttendanceRecord) => {
    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const updatedRecords = [record, ...existingRecords];
    localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
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
        setStatus(`✅ Attendance Marked!\nEmployee ID: ${employeeId}\nQR Data: ${qrText}`);
      } else {
        recordStatus = 'error';
        setStatus(`❌ Invalid QR format.\nQR Data: ${qrText}`);
      }
    } catch (e) {
      recordStatus = 'error';
      setStatus(`❌ Invalid QR format.\nQR Data: ${qrText}`);
    }

    // Save to localStorage
    const attendanceRecord: AttendanceRecord = {
      id: Date.now().toString(),
      employeeId: employeeId || 'Unknown',
      qrData: qrText,
      timestamp: new Date().toISOString(),
      status: recordStatus
    };

    saveAttendanceRecord(attendanceRecord);

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
    // Handle scan errors silently
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
