import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { InputValidator } from '@/utils/inputValidation';
const EmployeeLogin = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sanitizedEmployeeId = InputValidator.sanitizeString(employeeId);
      const sanitizedPassword = InputValidator.sanitizeString(password);
      if (!sanitizedEmployeeId || !sanitizedPassword) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid credentials",
          variant: "destructive"
        });
        return;
      }

      // Simple demo authentication - any employee ID with password "emp123"
      if (sanitizedPassword === 'emp123') {
        localStorage.setItem('employee_session', JSON.stringify({
          employeeId: sanitizedEmployeeId,
          employeeName: `Employee ${sanitizedEmployeeId}`,
          loginTime: Date.now()
        }));
        toast({
          title: "Login Successful",
          description: `Welcome Employee ${sanitizedEmployeeId}`
        });
        navigate('/employee/scan');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid Employee ID or password.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="https://jkseng.com/images/jks_logo_complete.svg" alt="AttendEase Logo" className="h-12 w-auto mx-auto mb-4" />
          <CardTitle className="text-2xl">Employee Login</CardTitle>
          <CardDescription>
            Enter your Employee ID and password to access your portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input type="text" placeholder="Employee ID" value={employeeId} onChange={e => setEmployeeId(e.target.value)} maxLength={50} required />
            </div>
            <div>
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} maxLength={100} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/admin-login')} className="text-sm text-blue-600 font-medium">
              Login as Admin
            </Button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">Demo Credentials:</p>
            <p>Employee ID: Any valid employee ID </p>
            <p>Password: emp123</p>
            
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default EmployeeLogin;