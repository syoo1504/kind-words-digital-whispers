
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  qrData: string;
  checkInTime?: string;
  checkOutTime?: string;
  isLate: boolean;
  timestamp: string;
  status: 'success' | 'error';
  type: 'check-in' | 'check-out';
}

const AdminDashboard = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    employee_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    status: 'Active'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const employeeData = JSON.parse(localStorage.getItem('employeeData') || '[]');
    setAttendanceRecords(records);
    setEmployees(employeeData);
  }, []);

  const clearAllRecords = () => {
    if (window.confirm('Are you sure you want to clear all attendance records?')) {
      localStorage.removeItem('attendanceRecords');
      setAttendanceRecords([]);
    }
  };

  const addEmployee = () => {
    if (!newEmployee.employee_id || !newEmployee.name) {
      alert('Employee ID and Name are required!');
      return;
    }
    
    const existingEmployees = JSON.parse(localStorage.getItem('employeeData') || '[]');
    const updatedEmployees = [...existingEmployees, newEmployee];
    localStorage.setItem('employeeData', JSON.stringify(updatedEmployees));
    setEmployees(updatedEmployees);
    
    // Reset form
    setNewEmployee({
      employee_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      status: 'Active'
    });
  };

  const exportAttendanceToCSV = () => {
    const csvContent = [
      ['Employee ID', 'Employee Name', 'Check-in Time', 'Check-out Time', 'Late Status', 'Date', 'Status'],
      ...attendanceRecords.map(record => [
        record.employeeId,
        record.employeeName,
        record.checkInTime || 'N/A',
        record.checkOutTime || 'N/A',
        record.isLate ? 'Late' : 'On Time',
        new Date(record.timestamp).toLocaleDateString(),
        record.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportEmployeesToCSV = () => {
    const csvContent = [
      ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Status'],
      ...employees.map(emp => [
        emp.employee_id,
        emp.name,
        emp.email,
        emp.phone,
        emp.department,
        emp.designation,
        emp.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const successfulScans = attendanceRecords.filter(r => r.status === 'success').length;
  const errorScans = attendanceRecords.filter(r => r.status === 'error').length;
  const lateArrivals = attendanceRecords.filter(r => r.isLate && r.type === 'check-in').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center">
            <img 
              src="https://jkseng.com/images/jks_logo_complete.svg" 
              alt="AttendEase Logo" 
              className="h-16 w-auto"
            />
            <h1 className="ml-4 text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/scanner')}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <span>📷</span>
              <span>Scan Attendance</span>
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2 bg-white/30 px-4 py-2 rounded-lg"
            >
              <span>📊</span>
              <span>Admin Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRecords.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Scans</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successfulScans}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <span className="text-2xl">⏰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lateArrivals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Scans</CardTitle>
              <span className="text-2xl">❌</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{errorScans}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Attendance Records</h2>
              <div className="space-x-2">
                <Button onClick={exportAttendanceToCSV} variant="outline">
                  📄 Export CSV
                </Button>
                <Button onClick={clearAllRecords} variant="destructive">
                  🗑️ Clear All Records
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance Records</CardTitle>
                <CardDescription>
                  All QR code scans with check-in/check-out times and late status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">No attendance records found</p>
                    <p className="text-sm">Start scanning QR codes to see records here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.employeeId}</TableCell>
                          <TableCell>{record.employeeName}</TableCell>
                          <TableCell>
                            {record.checkInTime ? (
                              <div className="flex items-center gap-2">
                                {record.checkInTime}
                                {record.isLate && <Badge variant="destructive">Late</Badge>}
                              </div>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>{record.checkOutTime || 'N/A'}</TableCell>
                          <TableCell>{new Date(record.timestamp).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'success' ? 'default' : 'destructive'}>
                              {record.status === 'success' ? '✅ Success' : '❌ Error'}
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

          <TabsContent value="employees">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
              <Button onClick={exportEmployeesToCSV} variant="outline">
                📄 Export Employees CSV
              </Button>
            </div>

            {/* Add Employee Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Employee</CardTitle>
                <CardDescription>
                  Add employee data to link with attendance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Employee ID"
                    value={newEmployee.employee_id}
                    onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Designation"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <Button onClick={addEmployee} className="mt-4">
                  Add Employee
                </Button>
              </CardContent>
            </Card>

            {/* Employee List */}
            <Card>
              <CardHeader>
                <CardTitle>Employee List ({employees.length})</CardTitle>
                <CardDescription>
                  Manage employee data for attendance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">No employees found</p>
                    <p className="text-sm">Add employees to link with attendance records</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.employee_id}>
                          <TableCell className="font-medium">{employee.employee_id}</TableCell>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.designation}</TableCell>
                          <TableCell>
                            <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                              {employee.status}
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
        </Tabs>
      </main>

      <footer className="bg-blue-600 text-white p-4 text-center mt-8">
        &copy; 2025 AttendEase - QR Attendance System
      </footer>
    </div>
  );
};

export default AdminDashboard;
