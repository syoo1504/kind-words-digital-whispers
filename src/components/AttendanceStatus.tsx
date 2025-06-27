
import React from 'react';

interface AttendanceStatusProps {
  status: string;
}

const AttendanceStatus: React.FC<AttendanceStatusProps> = ({ status }) => {
  const isError = status.includes('❌');
  
  return (
    <div className={`mt-8 w-4/5 max-w-md border-l-6 p-4 rounded-xl shadow-md text-center ${
      isError 
        ? 'bg-red-50 border-red-500' 
        : 'bg-green-50 border-green-500'
    }`}>
      <div className="text-lg whitespace-pre-line">{status}</div>
    </div>
  );
};

export default AttendanceStatus;
