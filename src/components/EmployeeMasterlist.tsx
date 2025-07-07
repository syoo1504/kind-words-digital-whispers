
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';
import { SecureDataService } from '@/services/secureDataService';
import { Employee, AttendanceRecord } from '@/types/attendance';

const EmployeeMasterlist = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const employeeData = SecureDataService.getEmployeeData();
    const records = SecureDataService.getAttendanceRecords();
    setEmployees(employeeData);
    setAttendanceRecords(records);
    setFilteredEmployees(employeeData);
  };

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, departmentFilter, statusFilter, employees]);

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    setFilteredEmployees(filtered);
  };

  const getDepartments = () => {
    return [...new Set(employees.map(emp => emp.department))].filter(Boolean);
  };

  const getEmployeeStats = (employeeId: string) => {
    const empRecords = attendanceRecords.filter(r => r.employeeId === employeeId);
    const totalDays = empRecords.length;
    const lateDays = empRecords.filter(r => r.isLate).length;
    const lastAttendance = empRecords.length > 0 ? empRecords[0].timestamp : null;

    return { totalDays, lateDays, lastAttendance };
  };

  const exportEmployeeList = () => {
    const csvContent = [
      ['Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Status', 'Total Days', 'Late Days'],
      ...filteredEmployees.map(emp => {
        const stats = getEmployeeStats(emp.employee_id);
        return [
          emp.employee_id,
          emp.name,
          emp.email,
          emp.department,
          emp.designation,
          emp.status,
          stats.totalDays,
          stats.lateDays
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-masterlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Employee Masterlist</CardTitle>
            <CardDescription>
              Complete employee directory with search and filtering
            </CardDescription>
          </div>
          <Button onClick={exportEmployeeList} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {getDepartments().map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Days</TableHead>
              <TableHead>Late Days</TableHead>
              <TableHead>Last Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => {
              const stats = getEmployeeStats(employee.employee_id);
              return (
                <TableRow key={employee.employee_id}>
                  <TableCell className="font-medium">{employee.employee_id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.designation}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{stats.totalDays}</TableCell>
                  <TableCell>
                    {stats.lateDays > 0 ? (
                      <Badge variant="destructive">{stats.lateDays}</Badge>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {stats.lastAttendance ? 
                      new Date(stats.lastAttendance).toLocaleDateString() : 
                      <span className="text-gray-400">Never</span>
                    }
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No employees found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeMasterlist;
