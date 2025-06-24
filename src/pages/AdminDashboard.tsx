import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [newEmployee, setNewEmployee] = useState<Employee>({
    employee_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    status: 'Active'
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const navigate = useNavigate();

  // Standard work start time (9:00 AM)
  const WORK_START_TIME = '09:00';

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const employeeData = JSON.parse(localStorage.getItem('employeeData') || '[]');
    setAttendanceRecords(records);
    setEmployees(employeeData);
    setFilteredRecords(records);
  }, []);

  // Calculate how many minutes late an employee is
  const calculateLateMinutes = (checkInTime: string): number => {
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const workStart = new Date(`1970-01-01T${WORK_START_TIME}:00`);
    const diffMs = checkIn.getTime() - workStart.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  // Format late duration
  const formatLateDuration = (minutes: number): string => {
    if (minutes === 0) return 'On Time';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m late`;
    }
    return `${mins}m late`;
  };

  // Filter records by employee
  const handleEmployeeFilter = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId === '') {
      setFilteredRecords(attendanceRecords);
    } else {
      setFilteredRecords(attendanceRecords.filter(record => record.employeeId === employeeId));
    }
  };

  // Filter employees by search term
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  const clearAllRecords = () => {
    if (window.confirm('Are you sure you want to clear all attendance records?')) {
      localStorage.removeItem('attendanceRecords');
      setAttendanceRecords([]);
      setFilteredRecords([]);
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

  const exportAttendanceToCSV = (records: AttendanceRecord[] = filteredRecords, filename?: string) => {
    const csvContent = [
      ['Employee ID', 'Employee Name', 'Check-in Time', 'Check-out Time', 'Late Status', 'Late Duration', 'Date', 'Status'],
      ...records.map(record => [
        record.employeeId,
        record.employeeName,
        record.checkInTime || 'N/A',
        record.checkOutTime || 'N/A',
        record.isLate ? 'Late' : 'On Time',
        record.checkInTime && record.isLate ? formatLateDuration(calculateLateMinutes(record.checkInTime)) : 'N/A',
        new Date(record.timestamp).toLocaleDateString(),
        record.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportEmployeeAttendance = (employeeId: string) => {
    const employeeRecords = attendanceRecords.filter(record => record.employeeId === employeeId);
    const employee = employees.find(emp => emp.employee_id === employeeId);
    const employeeName = employee ? employee.name.replace(/\s+/g, '_') : employeeId;
    exportAttendanceToCSV(employeeRecords, `${employeeName}_attendance_${new Date().toISOString().split('T')[0]}.csv`);
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

  const successfulScans = attendanceRecords.filter(r => r.status === 'success').length;
  const errorScans = attendanceRecords.filter(r => r.status === 'error').length;
  const lateArrivals = attendanceRecords.filter(r => r.isLate && r.type === 'check-in').length;

  // Generate chart data for attendance performance
  const generateChartData = () => {
    if (!selectedMonth) return [];

    const monthStart = new Date(selectedMonth + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    // Get all unique dates in the selected month
    const datesInMonth: string[] = [];
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      datesInMonth.push(d.toISOString().split('T')[0]);
    }

    // Calculate attendance data for each employee
    return employees.map(employee => {
      const employeeRecords = attendanceRecords.filter(record => 
        record.employeeId === employee.employee_id &&
        record.status === 'success' &&
        new Date(record.timestamp).toISOString().slice(0, 7) === selectedMonth
      );

      const checkInDays = employeeRecords.filter(record => record.type === 'check-in').length;
      const lateDays = employeeRecords.filter(record => record.type === 'check-in' && record.isLate).length;
      const onTimeDays = checkInDays - lateDays;
      const attendanceRate = datesInMonth.length > 0 ? Math.round((checkInDays / datesInMonth.length) * 100) : 0;

      return {
        name: employee.name.split(' ')[0], // Use first name for chart readability
        fullName: employee.name,
        attendanceRate,
        onTimeDays,
        lateDays,
        totalDays: checkInDays,
        workingDays: datesInMonth.length
      };
    }).filter(data => data.totalDays > 0); // Only show employees with attendance data
  };

  const chartData = generateChartData();

  // Chart configuration
  const chartConfig = {
    attendanceRate: {
      label: "Attendance Rate (%)",
      color: "hsl(var(--chart-1))",
    },
    onTimeDays: {
      label: "On Time Days",
      color: "hsl(var(--chart-2))",
    },
    lateDays: {
      label: "Late Days",
      color: "hsl(var(--chart-3))",
    },
  };

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Attendance Records</h2>
              <div className="space-x-2">
                <Button onClick={() => exportAttendanceToCSV()} variant="outline">
                  📄 Export All CSV
                </Button>
                <Button onClick={clearAllRecords} variant="destructive">
                  🗑️ Clear All Records
                </Button>
              </div>
            </div>

            {/* Employee Filter */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filter by Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="employee-filter">Select Employee</Label>
                    <select
                      id="employee-filter"
                      value={selectedEmployee}
                      onChange={(e) => handleEmployeeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">All Employees</option>
                      {employees.map((employee) => (
                        <option key={employee.employee_id} value={employee.employee_id}>
                          {employee.name} ({employee.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedEmployee && (
                    <Button onClick={() => exportEmployeeAttendance(selectedEmployee)} variant="outline">
                      📄 Export Employee CSV
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Records {selectedEmployee && `- ${employees.find(e => e.employee_id === selectedEmployee)?.name}`}</CardTitle>
                <CardDescription>
                  {selectedEmployee ? 'Filtered attendance records for selected employee' : 'All QR code scans with check-in/check-out times and late status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">No attendance records found</p>
                    <p className="text-sm">
                      {selectedEmployee ? 'No records for this employee' : 'Start scanning QR codes to see records here'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Late Duration</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
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
                          <TableCell>
                            {record.checkInTime && record.isLate ? (
                              <span className="text-orange-600 font-medium">
                                {formatLateDuration(calculateLateMinutes(record.checkInTime))}
                              </span>
                            ) : record.checkInTime ? (
                              <span className="text-green-600">On Time</span>
                            ) : 'N/A'}
                          </TableCell>
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
                  <Input
                    type="text"
                    placeholder="Employee ID"
                    value={newEmployee.employee_id}
                    onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                  />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  />
                  <Input
                    type="text"
                    placeholder="Phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  />
                  <Input
                    type="text"
                    placeholder="Department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                  />
                  <Input
                    type="text"
                    placeholder="Designation"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                  />
                </div>
                <Button onClick={addEmployee} className="mt-4">
                  Add Employee
                </Button>
              </CardContent>
            </Card>

            {/* Employee Search and List */}
            <Card>
              <CardHeader>
                <CardTitle>Employee List ({filteredEmployees.length})</CardTitle>
                <CardDescription>
                  Search and manage employee data for attendance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search by name, employee ID, or department..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">
                      {employeeSearchTerm ? 'No employees found matching your search' : 'No employees found'}
                    </p>
                    <p className="text-sm">
                      {employeeSearchTerm ? 'Try a different search term' : 'Add employees to link with attendance records'}
                    </p>
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
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
                          <TableCell>
                            <Button
                              onClick={() => exportEmployeeAttendance(employee.employee_id)}
                              variant="outline"
                              size="sm"
                            >
                              📄 Export
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Attendance Analytics</h2>
              <div className="flex items-center space-x-4">
                <Label htmlFor="month-select">Select Month:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {chartData.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-lg text-gray-500">No attendance data found for {monthOptions.find(opt => opt.value === selectedMonth)?.label}</p>
                  <p className="text-sm text-gray-400">Select a different month or ensure attendance records exist</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Attendance Rate Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Attendance Rate by Employee</CardTitle>
                    <CardDescription>
                      Percentage of working days each employee was present in {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value, name, props) => [
                            `${value}%`,
                            'Attendance Rate',
                            `${props.payload.fullName}: ${props.payload.totalDays}/${props.payload.workingDays} days`
                          ]}
                        />
                        <Bar 
                          dataKey="attendanceRate" 
                          fill="var(--color-attendanceRate)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* On Time vs Late Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Punctuality Performance</CardTitle>
                    <CardDescription>
                      Comparison of on-time vs late arrivals for {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value, name, props) => [
                            `${value} days`,
                            name === 'onTimeDays' ? 'On Time' : 'Late',
                            props.payload.fullName
                          ]}
                        />
                        <Bar 
                          dataKey="onTimeDays" 
                          fill="var(--color-onTimeDays)"
                          stackId="punctuality"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar 
                          dataKey="lateDays" 
                          fill="var(--color-lateDays)"
                          stackId="punctuality"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Summary Statistics Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Performance Summary</CardTitle>
                    <CardDescription>
                      Detailed breakdown of attendance performance for {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Total Days Present</TableHead>
                          <TableHead>On Time Days</TableHead>
                          <TableHead>Late Days</TableHead>
                          <TableHead>Attendance Rate</TableHead>
                          <TableHead>Punctuality Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chartData
                          .sort((a, b) => b.attendanceRate - a.attendanceRate)
                          .map((employee) => {
                            const punctualityRate = employee.totalDays > 0 
                              ? Math.round((employee.onTimeDays / employee.totalDays) * 100) 
                              : 0;
                            
                            return (
                              <TableRow key={employee.fullName}>
                                <TableCell className="font-medium">{employee.fullName}</TableCell>
                                <TableCell>{employee.totalDays}/{employee.workingDays}</TableCell>
                                <TableCell>
                                  <span className="text-green-600 font-medium">{employee.onTimeDays}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-orange-600 font-medium">{employee.lateDays}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={employee.attendanceRate >= 90 ? 'default' : employee.attendanceRate >= 70 ? 'secondary' : 'destructive'}>
                                    {employee.attendanceRate}%
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={punctualityRate >= 90 ? 'default' : punctualityRate >= 70 ? 'secondary' : 'destructive'}>
                                    {punctualityRate}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
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
