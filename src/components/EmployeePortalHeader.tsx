
import React from 'react';

const EmployeePortalHeader: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 shadow-lg">
      <div className="flex justify-center items-center max-w-6xl mx-auto">
        <div className="flex items-center">
          <img 
            src="https://jkseng.com/images/jks_logo_complete.svg" 
            alt="AttendEase Logo" 
            className="h-16 w-auto mr-4"
          />
          <div>
            <h1 className="text-2xl font-bold">Employee Portal</h1>
            <p className="text-blue-100">Scan your QR code for attendance</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default EmployeePortalHeader;
