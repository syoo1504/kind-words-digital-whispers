
export class TimeUtils {
  private static readonly WORK_START_TIME = '09:00';

  static isLateArrival(checkInTime: string): boolean {
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const workStart = new Date(`1970-01-01T${this.WORK_START_TIME}:00`);
    return checkIn > workStart;
  }

  static calculateOvertimeHours(checkInTime: string, checkOutTime: string): number {
    if (!checkInTime || !checkOutTime) return 0;
    
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const checkOut = new Date(`1970-01-01T${checkOutTime}`);
    
    let diffMs = checkOut.getTime() - checkIn.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Handle next day checkout
    }
    
    const totalHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, totalHours - 8); // Overtime after 8 hours
  }
}
