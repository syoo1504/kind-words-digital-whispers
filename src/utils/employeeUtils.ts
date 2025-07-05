
import { SecureDataService } from '@/services/secureDataService';
import { Employee } from '@/types/attendance';

export class EmployeeUtils {
  static getEmployeeData(): Employee[] {
    return SecureDataService.getEmployeeData();
  }

  static findEmployee(employeeId: string): Employee | null {
    const employees = this.getEmployeeData();
    return employees.find(emp => emp.employee_id === employeeId) || null;
  }

  static extractEmployeeIdFromQR(qrText: string): { employeeId: string; success: boolean } {
    try {
      const url = new URL(qrText);
      const empId = url.searchParams.get('empId');
      if (empId) {
        return { employeeId: empId, success: true };
      } else {
        return { employeeId: '', success: false };
      }
    } catch (e) {
      return { employeeId: '', success: false };
    }
  }
}
