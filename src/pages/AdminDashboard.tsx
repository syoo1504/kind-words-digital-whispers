import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calendar, Clock, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLogout from '@/components/AdminLogout';
import EmployeeManagement from '@/components/EmployeeManagement';
import { SecureDataService } from '@/services/secureDataService';
import { AttendanceRecord, Employee } from '@/types/attendance';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const records = SecureDataService.getAttendanceRecords();
    const employeeData = SecureDataService.getEmployeeData();
    
    setAttendanceRecords(records);
    setEmployees(employeeData);
    setFilteredRecords(records);
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(record => record.employeeId === selectedEmployee);
    }

    if (selectedDate) {
      filtered = filtered.filter(record => 
        new Date(record.timestamp).toDateString() === new Date(selectedDate).toDateString()
      );
    }

    setFilteredRecords(filtered);
  };

  useEffect(() => {
    filterRecords();
  }, [selectedEmployee, selectedDate, attendanceRecords]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US');
  };

  const calculateStats = () => {
    const today = new Date().toDateString();
    const todayRecords = attendanceRecords.filter(record => 
      new Date(record.timestamp).toDateString() === today
    );

    const checkedInToday = new Set(todayRecords.filter(r => r.checkInTime).map(r => r.employeeId)).size;
    const checkedOutToday = new Set(todayRecords.filter(r => r.checkOutTime).map(r => r.employeeId)).size;
    const lateToday = todayRecords.filter(r => r.isLate).length;

    return {
      totalEmployees: employees.length,
      checkedInToday,
      checkedOutToday,
      lateToday
    };
  };

  const stats = calculateStats();

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      SecureDataService.clearAllData();
      loadData();
      toast({
        title: "Data Cleared",
        description: "All employee and attendance data has been cleared successfully.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://jkseng.com/images/jks_logo_complete.svg" 
                alt="Admin Dashboard Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            
            <nav className="flex items-center space-x-4">
              <AdminLogout />
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.checkedInToday}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.checkedOutToday}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Today</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.lateToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
          </TabsList>

          {/* Attendance Records Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Attendance Records</CardTitle>
                    <CardDescription>
                      View and filter employee attendance records
                    </CardDescription>
                  </div>
                  <Button onClick={clearAllData} variant="destructive">
                    Clear All Data
                  </Button>
                </div>
                
                {/* Filters */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="employee-filter">Filter by Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.employee_id} value={emp.employee_id}>
                            {emp.name} ({emp.employee_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="date-filter">Filter by Date</Label>
                    <Input
                      id="date-filter"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No attendance records found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.employeeName} ({record.employeeId})
                          </TableCell>
                          <TableCell>{formatDate(record.timestamp)}</TableCell>
                          <TableCell>
                            {record.checkInTime ? (
                              <div className="flex items-center space-x-2">
                                <span>{record.checkInTime}</span>
                                {record.isLate && (
                                  <Badge variant="destructive">Late</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.checkOutTime || <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'success' ? 'default' : 'destructive'}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee Management Tab */}
          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
