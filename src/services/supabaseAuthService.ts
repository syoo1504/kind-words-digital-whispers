
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export class SupabaseAuthService {
  
  // Admin login with Supabase Auth using admins table
  static async adminLogin(email: string, password: string): Promise<boolean> {
    try {
      // First check if admin exists in admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('username', email)
        .eq('password', password) // In production, use proper password hashing
        .single();

      if (adminError || !adminData) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        return false;
      }

      // Create a session by signing in with email/password
      // For now, we'll use a simple session management
      // In production, you'd want to implement proper JWT tokens
      const sessionData = {
        adminId: adminData.id,
        username: adminData.username,
        loginTime: Date.now()
      };
      
      localStorage.setItem('admin_session', JSON.stringify(sessionData));

      toast({
        title: "Login Successful",
        description: "Welcome to Admin Dashboard",
      });
      return true;

    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Check if admin is authenticated
  static async isAdminAuthenticated(): Promise<boolean> {
    try {
      const adminSession = localStorage.getItem('admin_session');
      
      if (!adminSession) {
        return false;
      }

      const session = JSON.parse(adminSession);
      const sessionAge = Date.now() - session.loginTime;
      
      // Session expires after 8 hours
      if (sessionAge > 8 * 60 * 60 * 1000) {
        localStorage.removeItem('admin_session');
        return false;
      }

      // Verify admin still exists in database
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id')
        .eq('id', session.adminId)
        .single();

      return !error && !!adminData;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Admin logout
  static async adminLogout(): Promise<void> {
    try {
      localStorage.removeItem('admin_session');
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current admin session
  static async getCurrentSession() {
    const adminSession = localStorage.getItem('admin_session');
    return adminSession ? JSON.parse(adminSession) : null;
  }

  // Mock auth state change listener for compatibility
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    // For compatibility with existing code, return mock subscription
    const subscription = {
      unsubscribe: () => {}
    };
    
    return { data: { subscription } };
  }
}
