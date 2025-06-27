
import React from 'react';

const AttendanceInstructions: React.FC = () => {
  return (
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
  );
};

export default AttendanceInstructions;
