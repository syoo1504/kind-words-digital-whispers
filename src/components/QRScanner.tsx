
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (qrText: string) => void;
  onScanFailure?: (error: string) => void;
  isScanning: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScanSuccess, 
  onScanFailure = (error) => console.log('Scan error:', error),
  isScanning 
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

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
  }, [isScanning, onScanSuccess, onScanFailure]);

  return (
    <div 
      id="reader" 
      className="w-80 max-w-sm bg-white rounded-2xl p-4 shadow-xl border-2 border-green-200"
    />
  );
};

export default QRScanner;
