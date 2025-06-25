
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/utils/auth';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = true }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (requireAuth && !AuthService.isAuthenticated()) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      navigate('/admin-login');
    }
  }, [navigate, requireAuth]);

  if (requireAuth && !AuthService.isAuthenticated()) {
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

export default ProtectedRoute;
