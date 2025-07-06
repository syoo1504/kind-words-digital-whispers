
import { SecureDataService } from '@/services/secureDataService';
import { Employee } from '@/types/attendance';

export class EmployeeUtils {
  static getEmployeeData(): Employee[] {
    return SecureDataService.getEmployeeData();
  }

  static findEmployee(employeeId: string): Employee | null {
    const employees = this.getEmployeeData();
    console.log('Looking for employee ID:', employeeId);
    console.log('Available employees:', employees.map(emp => emp.employee_id));
    return employees.find(emp => emp.employee_id === employeeId) || null;
  }

  static extractEmployeeIdFromQR(qrText: string): { employeeId: string; success: boolean } {
    console.log('Processing QR text:', qrText);
    
    try {
      // Try URL format first
      const url = new URL(qrText);
      const empId = url.searchParams.get('empId');
      if (empId) {
        console.log('Extracted employee ID from URL:', empId);
        return { employeeId: empId, success: true };
      }
    } catch (e) {
      // Not a URL, try other formats
    }
    
    // Try direct employee ID format (just the ID itself)
    if (qrText && qrText.trim()) {
      console.log('Using QR text as employee ID:', qrText.trim());
      return { employeeId: qrText.trim(), success: true };
    }
    
    console.log('Could not extract employee ID from QR');
    return { employeeId: '', success: false };
  }
}
