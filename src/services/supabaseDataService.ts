
import { supabase, Employee, AttendanceRecord } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

export class SupabaseDataService {
  // Employee operations
  static async getEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      })
      return []
    }
  }

  static async addEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('employees')
        .insert([employee])

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Employee added successfully",
      })
      return true
    } catch (error) {
      console.error('Error adding employee:', error)
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      })
      return false
    }
  }

  static async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('employee_id', employeeId)

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Employee updated successfully",
      })
      return true
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      })
      return false
    }
  }

  static async deleteEmployee(employeeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', employeeId)

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      })
      return true
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      })
      return false
    }
  }

  static async findEmployee(employeeId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error finding employee:', error)
      return null
    }
  }

  // Attendance operations
  static async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      })
      return []
    }
  }

  static async addAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert([{
          ...record,
          attendance_date: new Date().toISOString().split('T')[0] // Current date
        }])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error adding attendance record:', error)
      return false
    }
  }

  static async updateAttendanceRecord(
    employeeId: string, 
    attendanceDate: string, 
    updates: Partial<AttendanceRecord>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update(updates)
        .eq('employee_id', employeeId)
        .eq('attendance_date', attendanceDate)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating attendance record:', error)
      return false
    }
  }

  static async getLastAttendanceRecord(employeeId: string): Promise<AttendanceRecord | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
      return data
    } catch (error) {
      console.error('Error getting last attendance record:', error)
      return null
    }
  }

  // Data migration from localStorage
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      // Get existing localStorage data
      const localEmployees = localStorage.getItem('employeeData')
      const localAttendance = localStorage.getItem('attendanceRecords')

      if (localEmployees) {
        const employees = JSON.parse(localEmployees)
        for (const emp of employees) {
          await this.addEmployee({
            employee_id: emp.employee_id,
            name: emp.name,
            email: emp.email || '',
            phone: emp.phone || '',
            department: emp.department || '',
            designation: emp.designation || '',
            status: emp.status || 'Active'
          })
        }
      }

      if (localAttendance) {
        const records = JSON.parse(localAttendance)
        for (const record of records) {
          await this.addAttendanceRecord({
            employee_id: record.employeeId,
            employee_name: record.employeeName,
            qr_data: record.qrData,
            check_in_time: record.checkInTime,
            check_out_time: record.checkOutTime,
            is_late: record.isLate,
            late_duration_minutes: record.lateDurationMinutes || 0,
            overtime_hours: record.overtimeHours || 0,
            status: record.status,
            type: record.type
          })
        }
      }

      toast({
        title: "Migration Successful",
        description: "Local data has been migrated to Supabase",
      })
    } catch (error) {
      console.error('Error migrating data:', error)
      toast({
        title: "Migration Error",
        description: "Failed to migrate local data",
        variant: "destructive",
      })
    }
  }
}
