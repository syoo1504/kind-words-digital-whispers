
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface EmployeeProtectedRouteProps {
  children: React.ReactNode;
}

const EmployeeProtectedRoute: React.FC<EmployeeProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const employeeSession = localStorage.getItem('employee_session');
    
    if (!employeeSession) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      navigate('/employee-login');
      return;
    }

    try {
      const session = JSON.parse(employeeSession);
      const sessionAge = Date.now() - session.loginTime;
      
      // Session expires after 8 hours
      if (sessionAge > 8 * 60 * 60 * 1000) {
        localStorage.removeItem('employee_session');
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        navigate('/employee-login');
      }
    } catch (error) {
      localStorage.removeItem('employee_session');
      navigate('/employee-login');
    }
  }, [navigate]);

  const employeeSession = localStorage.getItem('employee_session');
  if (!employeeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default EmployeeProtectedRoute;
