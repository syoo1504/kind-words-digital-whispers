
import { DataEncryption } from '@/utils/dataEncryption';
import { InputValidator } from '@/utils/inputValidation';
import { AuthService } from '@/utils/auth';

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
  overtimeHours?: number;
}

export class SecureDataService {
  private static readonly EMPLOYEE_DATA_KEY = 'secure_employee_data';
  private static readonly ATTENDANCE_DATA_KEY = 'secure_attendance_data';

  // Employee data operations
  static getEmployeeData(): Employee[] {
    try {
      const encryptedData = localStorage.getItem(this.EMPLOYEE_DATA_KEY);
      if (!encryptedData) {
        // Fallback to unencrypted data for migration
        const fallbackData = localStorage.getItem('employeeData');
        if (fallbackData) {
          const data = JSON.parse(fallbackData);
          this.saveEmployeeData(data); // Migrate to encrypted storage
          localStorage.removeItem('employeeData'); // Remove unencrypted data
          return data;
        }
        return [];
      }
      
      const decryptedData = DataEncryption.decryptSensitiveData(encryptedData);
      return decryptedData || [];
    } catch (error) {
      console.error('Error retrieving employee data:', error);
      return [];
    }
  }

  static saveEmployeeData(employees: Employee[]): boolean {
    try {
      // Validate and sanitize data
      const validatedEmployees = employees.map(emp => ({
        ...emp,
        employee_id: InputValidator.sanitizeString(emp.employee_id),
        name: InputValidator.sanitizeString(emp.name),
        email: InputValidator.sanitizeString(emp.email),
        phone: InputValidator.sanitizeString(emp.phone),
        department: InputValidator.sanitizeString(emp.department),
        designation: InputValidator.sanitizeString(emp.designation),
        status: InputValidator.sanitizeString(emp.status)
      }));

      const encryptedData = DataEncryption.encryptSensitiveData(validatedEmployees);
      localStorage.setItem(this.EMPLOYEE_DATA_KEY, encryptedData);
      
      // Also update legacy storage for backward compatibility
      localStorage.setItem('employeeData', JSON.stringify(validatedEmployees));
      
      // Log the operation for audit
      this.logDataOperation('employee_data_update', validatedEmployees.length);
      
      return true;
    } catch (error) {
      console.error('Error saving employee data:', error);
      return false;
    }
  }

  static addEmployee(employee: Employee): boolean {
    try {
      // Validate employee data
      if (!InputValidator.validateEmployeeId(employee.employee_id)) {
        throw new Error('Invalid employee ID');
      }
      if (!InputValidator.validateEmployeeName(employee.name)) {
        throw new Error('Invalid employee name');
      }
      if (employee.email && !InputValidator.validateEmail(employee.email)) {
        throw new Error('Invalid email address');
      }
      if (employee.phone && !InputValidator.validatePhone(employee.phone)) {
        throw new Error('Invalid phone number');
      }

      const employees = this.getEmployeeData();
      
      // Check for duplicate employee ID
      if (employees.some(emp => emp.employee_id === employee.employee_id)) {
        throw new Error('Employee ID already exists');
      }

      employees.push(employee);
      return this.saveEmployeeData(employees);
    } catch (error) {
      console.error('Error adding employee:', error);
      return false;
    }
  }

  static updateEmployee(employeeId: string, updatedEmployee: Employee): boolean {
    try {
      const employees = this.getEmployeeData();
      const index = employees.findIndex(emp => emp.employee_id === employeeId);
      
      if (index === -1) {
        throw new Error('Employee not found');
      }

      // Validate updated employee data
      if (!InputValidator.validateEmployeeId(updatedEmployee.employee_id)) {
        throw new Error('Invalid employee ID');
      }
      if (!InputValidator.validateEmployeeName(updatedEmployee.name)) {
        throw new Error('Invalid employee name');
      }
      if (updatedEmployee.email && !InputValidator.validateEmail(updatedEmployee.email)) {
        throw new Error('Invalid email address');
      }
      if (updatedEmployee.phone && !InputValidator.validatePhone(updatedEmployee.phone)) {
        throw new Error('Invalid phone number');
      }

      // Check for duplicate employee ID (excluding current employee)
      if (updatedEmployee.employee_id !== employeeId && 
          employees.some(emp => emp.employee_id === updatedEmployee.employee_id)) {
        throw new Error('Employee ID already exists');
      }

      employees[index] = updatedEmployee;
      return this.saveEmployeeData(employees);
    } catch (error) {
      console.error('Error updating employee:', error);
      return false;
    }
  }

  static deleteEmployee(employeeId: string): boolean {
    try {
      const employees = this.getEmployeeData();
      const filteredEmployees = employees.filter(emp => emp.employee_id !== employeeId);
      
      if (filteredEmployees.length === employees.length) {
        throw new Error('Employee not found');
      }

      return this.saveEmployeeData(filteredEmployees);
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  // Attendance data operations
  static getAttendanceRecords(): AttendanceRecord[] {
    try {
      const encryptedData = localStorage.getItem(this.ATTENDANCE_DATA_KEY);
      if (!encryptedData) {
        // Fallback to unencrypted data for migration
        const fallbackData = localStorage.getItem('attendanceRecords');
        if (fallbackData) {
          const data = JSON.parse(fallbackData);
          this.saveAttendanceRecords(data); // Migrate to encrypted storage
          localStorage.removeItem('attendanceRecords'); // Remove unencrypted data
          return data;
        }
        return [];
      }
      
      const decryptedData = DataEncryption.decryptSensitiveData(encryptedData);
      return decryptedData || [];
    } catch (error) {
      console.error('Error retrieving attendance data:', error);
      return [];
    }
  }

  static saveAttendanceRecords(records: AttendanceRecord[]): boolean {
    try {
      // Validate and sanitize data
      const validatedRecords = records.map(record => ({
        ...record,
        employeeId: InputValidator.sanitizeString(record.employeeId),
        employeeName: InputValidator.sanitizeString(record.employeeName),
        qrData: InputValidator.sanitizeString(record.qrData)
      }));

      const encryptedData = DataEncryption.encryptSensitiveData(validatedRecords);
      localStorage.setItem(this.ATTENDANCE_DATA_KEY, encryptedData);
      
      // Also update legacy storage for backward compatibility
      localStorage.setItem('attendanceRecords', JSON.stringify(validatedRecords));
      
      // Log the operation for audit
      this.logDataOperation('attendance_data_update', validatedRecords.length);
      
      return true;
    } catch (error) {
      console.error('Error saving attendance data:', error);
      return false;
    }
  }

  static addAttendanceRecord(record: AttendanceRecord): boolean {
    try {
      const records = this.getAttendanceRecords();
      records.unshift(record); // Add to beginning
      return this.saveAttendanceRecords(records);
    } catch (error) {
      console.error('Error adding attendance record:', error);
      return false;
    }
  }

  // Secure backup operations
  static createSecureBackup(): any {
    if (!AuthService.isAuthenticated()) {
      throw new Error('Authentication required for backup operations');
    }

    const employees = this.getEmployeeData();
    const attendanceRecords = this.getAttendanceRecords();

    const backup = {
      employees,
      attendanceRecords,
      backupDate: new Date().toISOString(),
      version: '1.0',
      checksum: this.calculateChecksum(employees, attendanceRecords)
    };

    this.logDataOperation('backup_created', employees.length + attendanceRecords.length);
    return backup;
  }

  static restoreFromSecureBackup(backupData: any): boolean {
    if (!AuthService.isAuthenticated()) {
      throw new Error('Authentication required for restore operations');
    }

    try {
      // Validate backup data
      const validation = InputValidator.validateBackupData(backupData);
      if (!validation.isValid) {
        throw new Error(`Invalid backup data: ${validation.errors.join(', ')}`);
      }

      // Verify data integrity
      if (!DataEncryption.validateDataIntegrity(backupData)) {
        throw new Error('Backup data integrity check failed');
      }

      // Restore data
      const success = this.saveEmployeeData(backupData.employees) && 
                     this.saveAttendanceRecords(backupData.attendanceRecords);

      if (success) {
        this.logDataOperation('backup_restored', 
          backupData.employees.length + backupData.attendanceRecords.length);
      }

      return success;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  private static logDataOperation(operation: string, recordCount: number): void {
    const sessionData = AuthService.getSessionData();
    const logEntry = {
      operation,
      recordCount,
      timestamp: new Date().toISOString(),
      userId: sessionData?.userId || 'unknown',
      sessionId: sessionData?.sessionId || 'unknown'
    };

    // Store audit logs (in production, this would be sent to a secure server)
    const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    auditLogs.push(logEntry);
    
    // Keep only last 100 log entries
    if (auditLogs.length > 100) {
      auditLogs.splice(0, auditLogs.length - 100);
    }
    
    localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
  }

  private static calculateChecksum(employees: Employee[], records: AttendanceRecord[]): string {
    const combined = JSON.stringify(employees) + JSON.stringify(records);
    return btoa(combined).slice(0, 16); // Simple checksum
  }

  static clearAllData(): boolean {
    if (!AuthService.isAuthenticated()) {
      throw new Error('Authentication required for data operations');
    }

    try {
      localStorage.removeItem(this.EMPLOYEE_DATA_KEY);
      localStorage.removeItem(this.ATTENDANCE_DATA_KEY);
      localStorage.removeItem('employeeData'); // Remove legacy data
      localStorage.removeItem('attendanceRecords'); // Remove legacy data
      
      this.logDataOperation('data_cleared', 0);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}
