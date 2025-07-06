
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ScanInstructions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Camera Scanner:</strong> Click "Start Camera Scanner" and point your camera at the QR code</p>
          <p>• <strong>Image Upload:</strong> Select a QR code image from your device and click "Process QR Image"</p>
          <p>• <strong>First scan of the day = Check-in</strong></p>
          <p>• <strong>Second scan of the day = Check-out</strong></p>
          <p>• Make sure the QR code is clear and well-lit for best results</p>
          <p>• Your attendance will be automatically recorded upon successful scan</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanInstructions;
