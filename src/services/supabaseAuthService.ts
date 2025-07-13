
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export class SupabaseAuthService {
  
  // Admin login with Supabase Auth
  static async adminLogin(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Admin login error:', error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges.",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Login Successful",
          description: "Welcome to Admin Dashboard",
        });
        return true;
      }

      return false;
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

  // Check if user is authenticated and is admin
  static async isAdminAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      return profile?.role === 'admin';
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Admin logout
  static async adminLogout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user session
  static async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // Listen to auth changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
