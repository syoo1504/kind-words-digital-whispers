
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { AuthService } from '@/utils/auth';
import { InputValidator } from '@/utils/inputValidation';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sanitize inputs
      const sanitizedUsername = InputValidator.sanitizeString(username);
      const sanitizedPassword = InputValidator.sanitizeString(password);

      // Validate inputs
      if (!sanitizedUsername || !sanitizedPassword) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid credentials",
          variant: "destructive",
        });
        return;
      }

      // Attempt authentication
      const isAuthenticated = await AuthService.login(sanitizedUsername, sanitizedPassword);

      if (isAuthenticated) {
        toast({
          title: "Login Successful",
          description: "Welcome to Admin Dashboard",
        });
        navigate('/admin');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src="https://jkseng.com/images/jks_logo_complete.svg" 
            alt="AttendEase Logo" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-sm text-gray-600"
            >
              Back to Employee Portal
            </Button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">Demo Credentials:</p>
            <p>Username: admin</p>
            <p>Password: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
