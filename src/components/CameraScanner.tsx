
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CameraScannerProps {
  onScanSuccess: (qrData: string) => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
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
        onScanSuccess(decodedText);
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

  return (
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
  );
};

export default CameraScanner;
