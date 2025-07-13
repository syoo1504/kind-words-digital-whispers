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

  const formatTimeForExport = (timeString?: string) => {
    if (!timeString) return '';
    // Ensure time format is HH:MM:SS
    if (timeString.length === 5) {
      return timeString + ':00';
    }
    return timeString;
  };

  const formatDateTimeForExport = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatDateForExport = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const calculateLateDurationMinutes = (checkInTime: string) => {
    if (!checkInTime) return 0;
    
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const workStart = new Date(`1970-01-01T09:00:00`);
    
    if (checkIn <= workStart) return 0;
    
    const diffMs = checkIn.getTime() - workStart.getTime();
    return Math.round(diffMs / (1000 * 60));
  };

  const calculateOvertimeHours = (checkInTime?: string, checkOutTime?: string) => {
    if (!checkInTime || !checkOutTime) return 0;
    
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const checkOut = new Date(`1970-01-01T${checkOutTime}`);
    const workEnd = new Date(`1970-01-01T17:00:00`);
    
    if (checkOut <= workEnd) return 0;
    
    const overtimeMs = checkOut.getTime() - workEnd.getTime();
    const overtimeHours = overtimeMs / (1000 * 60 * 60);
    
    return Math.round(overtimeHours * 100) / 100; // Round to 2 decimal places
  };

  const exportSummaryReport = () => {
    const filtered = getFilteredRecords();
    
    // Create CSV content with exact column structure
    const csvContent = [
      // Header row matching the expected format
      'employee_id,employee_name,department,attendance_date,check_in_time,check_out_time,is_late,late_duration_minutes,overtime_hours,status,created_at',
      
      // Data rows
      ...filtered.map(record => {
        const employee = employees.find(emp => emp.employee_id === record.employeeId);
        const lateDurationMinutes = record.isLate && record.checkInTime ? 
          calculateLateDurationMinutes(record.checkInTime) : 0;
        const overtimeHours = calculateOvertimeHours(record.checkInTime, record.checkOutTime);
        
        return [
          record.employeeId,
          record.employeeName,
          employee?.department || 'N/A',
          formatDateForExport(record.timestamp),
          formatTimeForExport(record.checkInTime),
          formatTimeForExport(record.checkOutTime),
          record.isLate ? 'true' : 'false',
          lateDurationMinutes,
          overtimeHours.toFixed(2),
          record.status,
          formatDateTimeForExport(record.timestamp)
        ].join(',');
      })
    ].join('\n');

    downloadCSV(csvContent, 'attendance-summary-report');
  };

  const exportDetailedReport = () => {
    const filtered = getFilteredRecords();
    
    const csvContent = [
      [
        'employee_id', 'employee_name', 'qr_data', 'check_in_time', 
        'check_out_time', 'is_late', 'late_duration_minutes', 'overtime_hours', 
        'attendance_date', 'status', 'created_at'
      ],
      ...filtered.map(record => {
        const employee = employees.find(emp => emp.employee_id === record.employeeId);
        const lateDurationMinutes = record.isLate && record.checkInTime ? 
          calculateLateDurationMinutes(record.checkInTime) : 0;
        const overtimeHours = calculateOvertimeHours(record.checkInTime, record.checkOutTime);

        return [
          record.employeeId,
          record.employeeName,
          record.qrData || 'N/A',
          formatTimeForExport(record.checkInTime),
          formatTimeForExport(record.checkOutTime),
          record.isLate ? 'true' : 'false',
          lateDurationMinutes,
          overtimeHours.toFixed(2),
          formatDateForExport(record.timestamp),
          record.status,
          formatDateTimeForExport(record.timestamp)
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
