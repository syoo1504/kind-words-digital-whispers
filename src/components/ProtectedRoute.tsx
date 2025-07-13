
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseAuthService } from '@/services/supabaseAuthService';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = true }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!requireAuth) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      try {
        const authenticated = await SupabaseAuthService.isAdminAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access this page.",
            variant: "destructive",
          });
          navigate('/admin-login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        navigate('/admin-login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();

    // Listen for auth state changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        if (requireAuth) {
          navigate('/admin-login');
        }
      } else if (event === 'SIGNED_IN' && session) {
        checkAuthentication(); // Re-check admin role
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
};

export default ProtectedRoute;
