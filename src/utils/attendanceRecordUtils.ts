
import { SecureDataService } from '@/services/secureDataService';
import { AttendanceRecord } from '@/types/attendance';

export class AttendanceRecordUtils {
  static getLastAttendanceRecord(employeeId: string): AttendanceRecord | null {
    const records = SecureDataService.getAttendanceRecords();
    const employeeRecords = records.filter((r: AttendanceRecord) => r.employeeId === employeeId);
    
    // Get today's records only
    const today = new Date().toDateString();
    const todayRecords = employeeRecords.filter((r: AttendanceRecord) => 
      new Date(r.timestamp).toDateString() === today
    );
    
    return todayRecords.length > 0 ? todayRecords[0] : null;
  }

  static saveAttendanceRecord(record: AttendanceRecord): void {
    const existingRecords = SecureDataService.getAttendanceRecords();
    
    // Check if updating existing record or creating new one
    const existingIndex = existingRecords.findIndex((r: AttendanceRecord) => 
      r.employeeId === record.employeeId && 
      new Date(r.timestamp).toDateString() === new Date(record.timestamp).toDateString()
    );

    if (existingIndex !== -1 && record.type === 'check-out') {
      // Update existing record with check-out time
      existingRecords[existingIndex].checkOutTime = record.checkOutTime;
      existingRecords[existingIndex].type = 'check-out';
      existingRecords[existingIndex].overtimeHours = record.overtimeHours;
      SecureDataService.saveAttendanceRecords(existingRecords);
    } else {
      // Add new record
      SecureDataService.addAttendanceRecord(record);
    }
  }
}
