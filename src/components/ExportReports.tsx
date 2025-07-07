
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Calendar } from 'lucide-react';
import { SecureDataService } from '@/services/secureDataService';
import { Employee, AttendanceRecord } from '@/types/attendance';

const ExportReports = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('summary');

  useEffect(() => {
    loadData();
    setDefaultDates();
  }, []);

  const loadData = () => {
    const employeeData = SecureDataService.getEmployeeData();
    const records = SecureDataService.getAttendanceRecords();
    setEmployees(employeeData);
    setAttendanceRecords(records);
  };

  const setDefaultDates = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const getFilteredRecords = () => {
    let filtered = [...attendanceRecords];

    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(record => record.employeeId === selectedEmployee);
    }

    if (startDate) {
      filtered = filtered.filter(record => 
        new Date(record.timestamp) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(record => 
        new Date(record.timestamp) <= new Date(endDate + 'T23:59:59')
      );
    }

    return filtered;
  };

  const calculateLateDuration = (checkInTime: string) => {
    if (!checkInTime) return 0;
    
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const workStart = new Date(`1970-01-01T09:00:00`);
    
    if (checkIn <= workStart) return 0;
    
    const diffMs = checkIn.getTime() - workStart.getTime();
    return Math.round(diffMs / (1000 * 60)); // Return minutes late
  };

  const exportSummaryReport = () => {
    const filtered = getFilteredRecords();
    const employeeIds = selectedEmployee === 'all' 
      ? [...new Set(filtered.map(r => r.employeeId))]
      : [selectedEmployee];

    const reportData = employeeIds.map(empId => {
      const employee = employees.find(emp => emp.employee_id === empId);
      const empRecords = filtered.filter(r => r.employeeId === empId);
      
      const totalDays = empRecords.length;
      const lateDays = empRecords.filter(r => r.isLate).length;
      const totalLateMinutes = empRecords
        .filter(r => r.isLate && r.checkInTime)
        .reduce((sum, r) => sum + calculateLateDuration(r.checkInTime!), 0);
      
      const workingHours = empRecords.reduce((sum, record) => {
        if (record.checkInTime && record.checkOutTime) {
          const checkIn = new Date(`1970-01-01T${record.checkInTime}`);
          const checkOut = new Date(`1970-01-01T${record.checkOutTime}`);
          const diff = checkOut.getTime() - checkIn.getTime();
          return sum + (diff / (1000 * 60 * 60)); // Convert to hours
        }
        return sum;
      }, 0);

      return {
        employeeId: empId,
        employeeName: employee?.name || 'Unknown',
        department: employee?.department || 'N/A',
        totalDays,
        lateDays,
        punctualityRate: totalDays > 0 ? Math.round(((totalDays - lateDays) / totalDays) * 100) : 100,
        totalLateMinutes,
        avgLateMinutes: lateDays > 0 ? Math.round(totalLateMinutes / lateDays) : 0,
        totalWorkingHours: Math.round(workingHours * 100) / 100,
        avgWorkingHoursPerDay: totalDays > 0 ? Math.round((workingHours / totalDays) * 100) / 100 : 0
      };
    });

    const csvContent = [
      [
        'Employee ID', 'Employee Name', 'Department', 'Total Days', 'Late Days', 
        'Punctuality Rate (%)', 'Total Late Minutes', 'Avg Late Minutes', 
        'Total Working Hours', 'Avg Working Hours/Day'
      ],
      ...reportData.map(row => [
        row.employeeId, row.employeeName, row.department, row.totalDays, 
        row.lateDays, row.punctualityRate, row.totalLateMinutes, 
        row.avgLateMinutes, row.totalWorkingHours, row.avgWorkingHoursPerDay
      ])
    ].map(row => row.join(',')).join('\n');

    downloadCSV(csvContent, 'attendance-summary-report');
  };

  const exportDetailedReport = () => {
    const filtered = getFilteredRecords();
    
    const csvContent = [
      [
        'Date', 'Employee ID', 'Employee Name', 'Department', 'Check In', 
        'Check Out', 'Late', 'Late Duration (minutes)', 'Working Hours', 'Overtime Hours'
      ],
      ...filtered.map(record => {
        const employee = employees.find(emp => emp.employee_id === record.employeeId);
        const lateMinutes = record.isLate && record.checkInTime ? calculateLateDuration(record.checkInTime) : 0;
        
        let workingHours = 0;
        if (record.checkInTime && record.checkOutTime) {
          const checkIn = new Date(`1970-01-01T${record.checkInTime}`);
          const checkOut = new Date(`1970-01-01T${record.checkOutTime}`);
          const diff = checkOut.getTime() - checkIn.getTime();
          workingHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
        }

        return [
          new Date(record.timestamp).toLocaleDateString(),
          record.employeeId,
          record.employeeName,
          employee?.department || 'N/A',
          record.checkInTime || 'N/A',
          record.checkOutTime || 'N/A',
          record.isLate ? 'Yes' : 'No',
          lateMinutes,
          workingHours,
          record.overtimeHours || 0
        ];
      })
    ].map(row => row.join(',')).join('\n');

    downloadCSV(csvContent, 'attendance-detailed-report');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${startDate}-to-${endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Attendance Reports
        </CardTitle>
        <CardDescription>
          Generate detailed attendance reports for employees
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employee-select">Employee</Label>
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

          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={exportSummaryReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Summary Report
          </Button>
          
          <Button 
            onClick={exportDetailedReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Detailed Report
          </Button>
        </div>

        {/* Preview Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Report Preview</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Employee: {selectedEmployee === 'all' ? 'All Employees' : employees.find(e => e.employee_id === selectedEmployee)?.name}</p>
            <p>Date Range: {startDate} to {endDate}</p>
            <p>Records Found: {getFilteredRecords().length}</p>
            <p>Report Type: {reportType === 'summary' ? 'Summary (Statistics)' : 'Detailed (All Records)'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportReports;
