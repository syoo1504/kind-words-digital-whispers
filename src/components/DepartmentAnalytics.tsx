
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SecureDataService } from '@/services/secureDataService';
import { Employee, AttendanceRecord } from '@/types/attendance';

const DepartmentAnalytics = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const employeeData = SecureDataService.getEmployeeData();
    const records = SecureDataService.getAttendanceRecords();
    setEmployees(employeeData);
    setAttendanceRecords(records);
    calculateDepartmentStats(employeeData, records);
  };

  const calculateDepartmentStats = (employees: Employee[], records: AttendanceRecord[]) => {
    const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);
    
    const stats = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const deptRecords = records.filter(record => 
        deptEmployees.some(emp => emp.employee_id === record.employeeId)
      );
      
      const totalEmployees = deptEmployees.length;
      const activeEmployees = deptEmployees.filter(emp => emp.status === 'Active').length;
      const totalAttendance = deptRecords.length;
      const lateRecords = deptRecords.filter(record => record.isLate).length;
      const attendanceRate = totalEmployees > 0 ? (totalAttendance / (totalEmployees * 30)) * 100 : 0; // Assuming 30 working days
      const punctualityRate = totalAttendance > 0 ? ((totalAttendance - lateRecords) / totalAttendance) * 100 : 100;

      return {
        department: dept,
        totalEmployees,
        activeEmployees,
        totalAttendance,
        lateRecords,
        attendanceRate: Math.round(attendanceRate),
        punctualityRate: Math.round(punctualityRate)
      };
    });

    setDepartmentStats(stats);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const pieData = departmentStats.map(stat => ({
    name: stat.department,
    value: stat.totalEmployees
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
          <CardDescription>Employee distribution across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Attendance and punctuality rates by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendanceRate" fill="#8884d8" name="Attendance Rate %" />
                <Bar dataKey="punctualityRate" fill="#82ca9d" name="Punctuality Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentStats.map((stat) => (
              <Card key={stat.department}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{stat.department}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Employees:</span>
                    <Badge variant="outline">{stat.totalEmployees}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active:</span>
                    <Badge variant="default">{stat.activeEmployees}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Attendance:</span>
                    <Badge variant="secondary">{stat.totalAttendance}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Late Records:</span>
                    <Badge variant="destructive">{stat.lateRecords}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Attendance Rate:</span>
                    <Badge variant={stat.attendanceRate >= 80 ? 'default' : 'destructive'}>
                      {stat.attendanceRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Punctuality Rate:</span>
                    <Badge variant={stat.punctualityRate >= 90 ? 'default' : 'destructive'}>
                      {stat.punctualityRate}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentAnalytics;
