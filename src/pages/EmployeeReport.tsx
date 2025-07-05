
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmployeePortalHeader from '@/components/EmployeePortalHeader';
import EmployeePortalFooter from '@/components/EmployeePortalFooter';
import EmployeeNavigation from '@/components/EmployeeNavigation';
import { AttendanceRecord } from '@/utils/attendanceUtils';

const EmployeeReport = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('employee_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setCurrentEmployee(session);
      
      // Get all attendance records for current employee
      const allRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const employeeRecords = allRecords.filter((record: AttendanceRecord) => 
        record.employeeId === session.employeeId
      );
      
      // Sort by timestamp (newest first)
      employeeRecords.sort((a: AttendanceRecord, b: AttendanceRecord) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setAttendanceRecords(employeeRecords);
    }
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateWorkingHours = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return 'Incomplete';
    
    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const checkOutTime = new Date(`1970-01-01T${checkOut}`);
    
    let diffMs = checkOutTime.getTime() - checkInTime.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Handle next day checkout
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Group records by date
  const groupedRecords = attendanceRecords.reduce((groups: any, record) => {
    const date = new Date(record.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      <EmployeePortalHeader />
      <EmployeeNavigation />

      <main className="container mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">My Attendance Report</CardTitle>
            <CardDescription>
              {currentEmployee && `Viewing attendance records for ${currentEmployee.employeeName} (ID: ${currentEmployee.employeeId})`}
            </CardDescription>
          </CardHeader>
        </Card>

        {Object.keys(groupedRecords).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 text-lg">No attendance records found</p>
              <p className="text-gray-400">Start scanning QR codes to build your attendance history</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedRecords).map(([date, records]: [string, any]) => {
              const dayRecords = records as AttendanceRecord[];
              const checkInRecord = dayRecords.find(r => r.type === 'check-in' || r.checkInTime);
              const checkOutRecord = dayRecords.find(r => r.type === 'check-out' || r.checkOutTime);
              
              return (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="text-lg">{formatDate(date)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="font-medium">Check-in</p>
                        {checkInRecord?.checkInTime ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant={checkInRecord.isLate ? 'destructive' : 'default'}>
                              {checkInRecord.checkInTime}
                            </Badge>
                            {checkInRecord.isLate && <span className="text-red-500 text-sm">LATE</span>}
                          </div>
                        ) : (
                          <Badge variant="outline">No check-in</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium">Check-out</p>
                        {checkOutRecord?.checkOutTime ? (
                          <Badge variant="secondary">
                            {checkOutRecord.checkOutTime}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No check-out</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium">Working Hours</p>
                        <Badge variant="outline">
                          {calculateWorkingHours(checkInRecord?.checkInTime, checkOutRecord?.checkOutTime)}
                        </Badge>
                        {checkOutRecord?.overtimeHours && checkOutRecord.overtimeHours > 0 && (
                          <div className="text-sm text-blue-600">
                            Overtime: {checkOutRecord.overtimeHours.toFixed(1)}h
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <EmployeePortalFooter />
    </div>
  );
};

export default EmployeeReport;
