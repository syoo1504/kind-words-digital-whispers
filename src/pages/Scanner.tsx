import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
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
}

const Scanner = () => {
  const [status, setStatus] = useState('Waiting for QR scan...');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  const [locationStatus, setLocationStatus] = useState<'checking' | 'allowed' | 'denied' | 'unavailable'>('checking');
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);

  // Office location coordinates (you can configure these)
  const OFFICE_LOCATION = {
    lat: 40.7128, // Example: New York City
    lng: -74.0060,
    radius: 100 // 100 meters radius
  };

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

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // Distance in meters
    return d;
  };

  // Check if user is within office location
  const isWithinOfficeLocation = (userLat: number, userLng: number): boolean => {
    const distance = calculateDistance(userLat, userLng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
    return distance <= OFFICE_LOCATION.radius;
  };

  // Get user's current location
  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentPosition(coords);
          resolve(coords);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Initialize location checking
  useEffect(() => {
    const checkLocation = async () => {
      try {
        const position = await getCurrentLocation();
        if (isWithinOfficeLocation(position.lat, position.lng)) {
          setLocationStatus('allowed');
          toast({
            title: "Location Verified",
            description: "You are within the office premises. You can now scan attendance.",
          });
        } else {
          setLocationStatus('denied');
          toast({
            title: "Location Error",
            description: "You must be within the office premises to scan attendance.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setLocationStatus('unavailable');
        toast({
          title: "Location Unavailable",
          description: "Could not verify location. Please enable location services.",
          variant: "destructive",
        });
      }
    };

    checkLocation();
  }, []);

  const onScanSuccess = (qrText: string) => {
    // Check location before processing scan
    if (locationStatus !== 'allowed') {
      setStatus('❌ Location verification required.\nPlease ensure you are at the office location.');
      return;
    }

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
          statusMessage = `✅ Check-in Successful!\nEmployee: ${employeeName}\nTime: ${timeString}${isLate ? ' (LATE)' : ''}\n📍 Location Verified`;
          
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
          statusMessage = `✅ Check-out Successful!\nEmployee: ${employeeName}\nTime: ${timeString}${overtimeText}\n📍 Location Verified`;
          
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
    if (isScanning && locationStatus === 'allowed') {
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
  }, [isScanning, locationStatus]);

  // Show location status while checking
  if (locationStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100 flex items-center justify-center">
        <div className="w-96 text-center p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Verifying Location</h2>
          <p className="text-gray-600 mb-4">Please allow location access to continue</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Checking your location...</p>
        </div>
      </div>
    );
  }

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
        {/* Location Status Banner */}
        <div className={`w-4/5 max-w-md mb-4 p-3 rounded-lg text-center text-sm font-medium ${
          locationStatus === 'allowed' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {locationStatus === 'allowed' && '📍 Location Verified - Ready to Scan'}
          {locationStatus === 'denied' && '❌ Outside Office Location'}
          {locationStatus === 'unavailable' && '📍 Location Services Unavailable'}
        </div>

        <div 
          id="reader" 
          className={`w-80 max-w-sm bg-white rounded-2xl p-4 shadow-xl border-2 ${
            locationStatus === 'allowed' ? 'border-green-200' : 'border-red-200'
          }`}
        ></div>
        
        <div className={`mt-8 w-4/5 max-w-md border-l-6 p-4 rounded-xl shadow-md text-center ${
          status.includes('❌') 
            ? 'bg-red-50 border-red-500' 
            : 'bg-green-50 border-green-500'
        }`}>
          <div className="text-lg whitespace-pre-line">{status}</div>
        </div>

        {locationStatus !== 'allowed' && (
          <div className="mt-4 w-4/5 max-w-md bg-yellow-50 border-l-6 border-yellow-500 p-4 rounded-xl">
            <p className="text-sm text-yellow-800">
              <strong>Location Verification Required:</strong><br/>
              Please ensure you are within the office premises and have location services enabled.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Retry Location Check
            </button>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-blue-600 text-white p-4 text-center">
        &copy; 2025 AttendEase - QR Attendance System
      </footer>
    </div>
  );
};

export default Scanner;
