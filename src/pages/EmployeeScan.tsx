
import React from 'react';
import { toast } from '@/components/ui/use-toast';
import EmployeeNavigation from '@/components/EmployeeNavigation';
import CameraScanner from '@/components/CameraScanner';
import FileUploadScanner from '@/components/FileUploadScanner';
import ScanInstructions from '@/components/ScanInstructions';
import { processAttendanceScan } from '@/utils/attendanceUtils';

const EmployeeScan = () => {
  const handleScanSuccess = (qrData: string) => {
    try {
      const result = processAttendanceScan(qrData);
      
      toast({
        title: result.success ? "Attendance Recorded" : "Scan Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process attendance scan",
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
