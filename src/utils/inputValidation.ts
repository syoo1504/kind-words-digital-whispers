
// Input validation and sanitization utilities
export class InputValidator {
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  static validateEmployeeId(employeeId: string): boolean {
    if (!employeeId || typeof employeeId !== 'string') return false;
    
    // Employee ID should be alphanumeric, 3-20 characters
    const regex = /^[a-zA-Z0-9_-]{3,20}$/;
    return regex.test(employeeId);
  }

  static validateEmployeeName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    
    // Name should be 2-50 characters, letters, spaces, and common punctuation
    const regex = /^[a-zA-Z\s\-\.]{2,50}$/;
    return regex.test(name);
  }

  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    // Basic email validation
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && email.length <= 100;
  }

  static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    
    // Phone number validation (flexible format)
    const regex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
    return regex.test(phone);
  }

  static validateDepartment(department: string): boolean {
    if (!department || typeof department !== 'string') return false;
    
    // Department should be 2-30 characters
    const regex = /^[a-zA-Z\s\-&]{2,30}$/;
    return regex.test(department);
  }

  static validateBackupData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Invalid backup file format');
      return { isValid: false, errors };
    }

    // Check required fields
    if (!data.employees || !Array.isArray(data.employees)) {
      errors.push('Missing or invalid employee data');
    }

    if (!data.attendanceRecords || !Array.isArray(data.attendanceRecords)) {
      errors.push('Missing or invalid attendance records');
    }

    if (!data.backupDate || !this.isValidDate(data.backupDate)) {
      errors.push('Missing or invalid backup date');
    }

    // Validate employee data
    if (data.employees) {
      data.employees.forEach((emp: any, index: number) => {
        if (!this.validateEmployeeId(emp.employee_id)) {
          errors.push(`Invalid employee ID at index ${index}`);
        }
        if (!this.validateEmployeeName(emp.name)) {
          errors.push(`Invalid employee name at index ${index}`);
        }
        if (emp.email && !this.validateEmail(emp.email)) {
          errors.push(`Invalid email at employee index ${index}`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
