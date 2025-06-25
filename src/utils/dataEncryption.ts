
// Data encryption utilities for sensitive information
export class DataEncryption {
  private static readonly ENCRYPTION_KEY = 'attendease_2024_key';

  static encryptSensitiveData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      // Simple encryption - in production, use proper encryption libraries like crypto-js
      const encrypted = btoa(jsonString.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length))
      ).join(''));
      
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return '';
    }
  }

  static decryptSensitiveData(encryptedData: string): any {
    try {
      const decrypted = atob(encryptedData).split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length))
      ).join('');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  static validateDataIntegrity(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Check for required fields based on data type
    if (data.employees && Array.isArray(data.employees)) {
      return data.employees.every((emp: any) => 
        emp.employee_id && emp.name && typeof emp.employee_id === 'string'
      );
    }
    
    if (data.attendanceRecords && Array.isArray(data.attendanceRecords)) {
      return data.attendanceRecords.every((record: any) => 
        record.employeeId && record.timestamp && typeof record.employeeId === 'string'
      );
    }
    
    return true;
  }
}
