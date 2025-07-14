
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import EmployeePortalHeader from '@/components/EmployeePortalHeader';
import EmployeePortalFooter from '@/components/EmployeePortalFooter';
import EmployeeNavigation from '@/components/EmployeeNavigation';
import { AttendanceUtils } from '@/utils/attendanceUtils';

const EmployeeQRGenerator = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generateQRCode = async () => {
    if (!employeeId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter an Employee ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const employee = AttendanceUtils.findEmployee(employeeId);
      
      if (!employee) {
        toast({
          title: "Employee Not Found",
          description: "Please enter a valid Employee ID",
          variant: "destructive",
        });
        return;
      }

      const qrData = `https://attendease.example.com/qr?empId=${employeeId}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      
      setQrCodeUrl(qrApiUrl);
      
      toast({
        title: "QR Code Generated",
        description: `QR code generated for ${employee.name}`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_Code_${employeeId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "QR code download has been initiated",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentSession = localStorage.getItem('employee_session');
  const sessionData = currentSession ? JSON.parse(currentSession) : null;

  React.useEffect(() => {
    if (sessionData?.employeeId) {
      setEmployeeId(sessionData.employeeId);
    }
  }, []);

  // Get the current employee's full name
  const getCurrentEmployeeName = () => {
    if (sessionData?.employeeId) {
      const employee = AttendanceUtils.findEmployee(sessionData.employeeId);
      return employee?.name || sessionData.employeeName || `Employee ${sessionData.employeeId}`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      <EmployeePortalHeader />
      <EmployeeNavigation />

      <main className="flex flex-col items-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">QR Code Generator</CardTitle>
            <CardDescription>
              Generate your personalized QR code for attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                maxLength={50}
              />
            </div>
            
            <Button 
              onClick={generateQRCode} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Button>

            {qrCodeUrl && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-md inline-block">
                  <img 
                    src={qrCodeUrl} 
                    alt="Generated QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                
                <Button 
                  onClick={downloadQRCode}
                  className="w-full"
                  variant="outline"
                >
                  📥 Download QR Code
                </Button>
                
                <div className="text-sm text-gray-600">
                  <p>Employee ID: {employeeId}</p>
                  <p>Name: {getCurrentEmployeeName()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <EmployeePortalFooter />
    </div>
  );
};

export default EmployeeQRGenerator;
