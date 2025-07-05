
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QRScanner from '@/components/QRScanner';
import AttendanceStatus from '@/components/AttendanceStatus';
import AttendanceInstructions from '@/components/AttendanceInstructions';
import EmployeePortalHeader from '@/components/EmployeePortalHeader';
import EmployeePortalFooter from '@/components/EmployeePortalFooter';
import EmployeeNavigation from '@/components/EmployeeNavigation';
import { AttendanceUtils, AttendanceRecord } from '@/utils/attendanceUtils';
import { Html5Qrcode } from 'html5-qrcode';

const EmployeeScan = () => {
  const [status, setStatus] = useState('Choose your scanning method...');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload' | null>(null);

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

    setIsScanning(false);
    setTimeout(() => {
      resetScanner();
    }, 5000);
  };

  const onScanFailure = (error: string) => {
    console.log('Scan error:', error);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("file-reader");
      const qrText = await html5QrCode.scanFileV2(file, true);
      onScanSuccess(qrText);
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not read QR code from the uploaded image.",
        variant: "destructive",
      });
    }
  };

  const resetScanner = () => {
    setScanMethod(null);
    setIsScanning(false);
    setStatus('Choose your scanning method...');
  };

  const startCameraScanning = () => {
    setScanMethod('camera');
    setIsScanning(true);
    setStatus('Point your camera at the QR code...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      <EmployeePortalHeader />
      <EmployeeNavigation />

      <main className="flex flex-col items-center py-8 space-y-6">
        {!scanMethod && (
          <div className="flex flex-col space-y-4">
            <Button
              onClick={startCameraScanning}
              className="flex items-center space-x-2 px-8 py-4 text-lg"
            >
              <span>📷</span>
              <span>Scan with Camera</span>
            </Button>
            
            <div className="text-center">
              <p className="text-gray-600 mb-2">Or</p>
              <label htmlFor="qr-upload" className="cursor-pointer">
                <Button asChild className="flex items-center space-x-2 px-8 py-4 text-lg">
                  <span>
                    <span>📁</span>
                    <span>Upload QR Image</span>
                  </span>
                </Button>
              </label>
              <Input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {scanMethod === 'camera' && (
          <>
            <QRScanner 
              onScanSuccess={onScanSuccess}
              onScanFailure={onScanFailure}
              isScanning={isScanning}
            />
            <Button onClick={resetScanner} variant="outline">
              Cancel Scanning
            </Button>
          </>
        )}
        
        <AttendanceStatus status={status} />
        <AttendanceInstructions />
        
        <div id="file-reader" className="hidden"></div>
      </main>

      <EmployeePortalFooter />
    </div>
  );
};

export default EmployeeScan;
