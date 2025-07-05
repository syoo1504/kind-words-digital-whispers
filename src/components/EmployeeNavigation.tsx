
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const EmployeeNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('employee_session');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/employee-login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Button
            variant={isActive('/employee/scan') ? 'default' : 'outline'}
            onClick={() => navigate('/employee/scan')}
            className="flex items-center space-x-2"
          >
            <span>📷</span>
            <span>Scan QR</span>
          </Button>
          <Button
            variant={isActive('/employee/generator') ? 'default' : 'outline'}
            onClick={() => navigate('/employee/generator')}
            className="flex items-center space-x-2"
          >
            <span>🎯</span>
            <span>QR Generator</span>
          </Button>
          <Button
            variant={isActive('/employee/report') ? 'default' : 'outline'}
            onClick={() => navigate('/employee/report')}
            className="flex items-center space-x-2"
          >
            <span>📊</span>
            <span>My Reports</span>
          </Button>
        </div>
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="flex items-center space-x-2"
        >
          <span>🚪</span>
          <span>Logout</span>
        </Button>
      </div>
    </nav>
  );
};

export default EmployeeNavigation;
