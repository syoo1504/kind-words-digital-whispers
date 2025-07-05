
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import EmployeeNavigation from '@/components/EmployeeNavigation';
import { processAttendanceScan } from '@/utils/attendanceUtils';

const EmployeeScan = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanner = () => {
    if (isScanning) return;

    setIsScanning(true);
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
        scanner.clear();
        setIsScanning(false);
      },
      (error) => {
        console.log('Scan error:', error);
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (qrData: string) => {
    try {
      const result = processAttendanceScan(qrData);
      
      toast({
        title: result.success ? "Attendance Recorded" : "Scan Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      if (result.success) {
        stopScanner();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process attendance scan",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const processUploadedFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a QR code image to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a canvas to read the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        try {
          // Use html5-qrcode library to decode from canvas
          const { Html5Qrcode } = await import('html5-qrcode');
          const html5QrCode = new Html5Qrcode('temp-qr-reader');
          
          // Convert canvas to blob and then scan
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const result = await html5QrCode.scanFile(selectedFile, true);
                handleScanSuccess(result);
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('qr-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              } catch (error) {
                toast({
                  title: "Scan Failed",
                  description: "Could not detect QR code in the uploaded image",
                  variant: "destructive",
                });
              }
            }
          });
        } catch (error) {
          toast({
            title: "Processing Error",
            description: "Failed to process the uploaded image",
            variant: "destructive",
          });
        }
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process the uploaded file",
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
          {/* Camera Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>📷 Camera Scanner</CardTitle>
              <CardDescription>
                Use your device camera to scan QR codes directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="qr-reader" style={{ width: '100%' }}></div>
              
              <div className="flex gap-2 justify-center">
                {!isScanning ? (
                  <Button onClick={startScanner} className="w-full">
                    Start Camera Scanner
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="destructive" className="w-full">
                    Stop Scanner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Upload Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>📁 Upload QR Image</CardTitle>
              <CardDescription>
                Upload a QR code image from your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="qr-file-input">Select QR Code Image</Label>
                <Input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>
              
              {selectedFile && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Selected: {selectedFile.name}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={processUploadedFile}
                disabled={!selectedFile}
                className="w-full"
              >
                Process QR Image
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>Camera Scanner:</strong> Click "Start Camera Scanner" and point your camera at the QR code</p>
              <p>• <strong>Image Upload:</strong> Select a QR code image from your device and click "Process QR Image"</p>
              <p>• Make sure the QR code is clear and well-lit for best results</p>
              <p>• Your attendance will be automatically recorded upon successful scan</p>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Temporary element for QR scanning */}
      <div id="temp-qr-reader" style={{ display: 'none' }}></div>
    </div>
  );
};

export default EmployeeScan;
