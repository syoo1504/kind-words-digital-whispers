
import { toast } from '@/components/ui/use-toast';

// Secure authentication utilities
export class AuthService {
  private static readonly SESSION_KEY = 'auth_session';
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

  // In a real application, this would be handled server-side
  private static readonly ADMIN_HASH = 'admin_user_2024'; // Placeholder for server validation

  static async login(username: string, password: string): Promise<boolean> {
    // Input validation
    if (!this.validateCredentials(username, password)) {
      return false;
    }

    // Simulate server-side authentication
    // In production, this would make an API call to your backend
    if (username === 'admin' && password === 'admin123') {
      const session = {
        userId: 'admin',
        username: username,
        role: 'admin',
        loginTime: Date.now(),
        sessionId: this.generateSessionId()
      };

      localStorage.setItem(this.SESSION_KEY, this.encryptData(JSON.stringify(session)));
      
      // Set session timeout
      setTimeout(() => {
        this.logout();
        toast({
          title: "Session Expired",
          description: "Please log in again for security.",
          variant: "destructive",
        });
      }, this.SESSION_TIMEOUT);

      return true;
    }

    return false;
  }

  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    // Clear any other sensitive data
    this.clearSensitiveData();
  }

  static isAuthenticated(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    // Check if session is expired
    const now = Date.now();
    const sessionAge = now - sessionData.loginTime;
    
    if (sessionAge > this.SESSION_TIMEOUT) {
      this.logout();
      return false;
    }

    return true;
  }

  static getSessionData(): any {
    try {
      const encryptedSession = localStorage.getItem(this.SESSION_KEY);
      if (!encryptedSession) return null;

      const decryptedSession = this.decryptData(encryptedSession);
      return JSON.parse(decryptedSession);
    } catch (error) {
      console.error('Session data corrupted:', error);
      this.logout();
      return null;
    }
  }

  private static validateCredentials(username: string, password: string): boolean {
    // Input validation
    if (!username || !password) return false;
    if (username.length < 3 || username.length > 50) return false;
    if (password.length < 6 || password.length > 100) return false;
    
    // Check for basic injection attempts
    const dangerousChars = ['<', '>', '"', "'", '&', 'script', 'javascript'];
    const input = (username + password).toLowerCase();
    
    return !dangerousChars.some(char => input.includes(char));
  }

  private static generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  private static encryptData(data: string): string {
    // Simple encryption - in production, use proper encryption libraries
    return btoa(data.split('').reverse().join(''));
  }

  private static decryptData(encryptedData: string): string {
    // Simple decryption - in production, use proper decryption libraries
    return atob(encryptedData).split('').reverse().join('');
  }

  private static clearSensitiveData(): void {
    // Clear any cached sensitive data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('session') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  }
}
