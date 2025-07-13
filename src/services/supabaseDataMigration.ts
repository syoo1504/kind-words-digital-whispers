
import { supabase } from '@/integrations/supabase/client';
import { SecureDataService } from './secureDataService';
import { toast } from '@/components/ui/use-toast';

export class SupabaseDataMigration {
  
  // Migrate employees from localStorage to Supabase
  static async migrateEmployeesToSupabase(): Promise<boolean> {
    try {
      console.log('Starting employee migration to Supabase...');
      
      // Get existing employees from localStorage
      const localEmployees = SecureDataService.getEmployeeData();
      console.log('Found local employees:', localEmployees.length);

      if (localEmployees.length === 0) {
        toast({
          title: "No Data to Migrate",
          description: "No employee data found in local storage.",
        });
        return true;
      }

      // Prepare employees for Supabase (match the database schema)
      const supabaseEmployees = localEmployees.map(emp => ({
        employee_id: emp.employee_id,
        name: emp.name,
        email: emp.email || null,
        phone: emp.phone || null,
        designation: emp.designation || null,
        status: emp.status || 'Active'
      }));

      // Insert employees into Supabase (using upsert to avoid duplicates)
      const { data, error } = await supabase
        .from('employees')
        .upsert(supabaseEmployees, {
          onConflict: 'employee_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error migrating employees:', error);
        toast({
          title: "Migration Error",
          description: `Failed to migrate employees: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('Successfully migrated employees:', data?.length);
      
      toast({
        title: "Migration Successful",
        description: `Successfully migrated ${data?.length || 0} employees to Supabase.`,
      });

      return true;
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Failed",
        description: "An error occurred during migration. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Migrate attendance records from localStorage to Supabase
  static async migrateAttendanceToSupabase(): Promise<boolean> {
    try {
      console.log('Starting attendance migration to Supabase...');
      
      const localAttendance = SecureDataService.getAttendanceRecords();
      console.log('Found local attendance records:', localAttendance.length);

      if (localAttendance.length === 0) {
        toast({
          title: "No Attendance Data",
          description: "No attendance records found in local storage.",
        });
        return true;
      }

      // Prepare attendance records for Supabase
      const supabaseAttendance = localAttendance.map(record => ({
        employee_id: record.employeeId,
        employee_name: record.employeeName,
        qr_data: record.qrData || null,
        check_in_time: record.checkInTime || null,
        check_out_time: record.checkOutTime || null,
        is_late: record.isLate || false,
        late_duration_minutes: 0,
        overtime_hours: record.overtimeHours || 0,
        attendance_date: record.timestamp ? new Date(record.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: record.status || 'success',
        type: record.type || 'check-in'
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .insert(supabaseAttendance)
        .select();

      if (error) {
        console.error('Error migrating attendance:', error);
        toast({
          title: "Attendance Migration Error",
          description: `Failed to migrate attendance: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('Successfully migrated attendance records:', data?.length);
      
      toast({
        title: "Attendance Migration Successful",
        description: `Successfully migrated ${data?.length || 0} attendance records.`,
      });

      return true;
    } catch (error) {
      console.error('Attendance migration error:', error);
      return false;
    }
  }

  // Complete migration process
  static async performFullMigration(): Promise<boolean> {
    try {
      const employeeMigration = await this.migrateEmployeesToSupabase();
      const attendanceMigration = await this.migrateAttendanceToSupabase();

      if (employeeMigration && attendanceMigration) {
        toast({
          title: "Full Migration Complete",
          description: "All data has been successfully migrated to Supabase.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Full migration error:', error);
      return false;
    }
  }

  // Sync local data with Supabase (bidirectional)
  static async syncWithSupabase(): Promise<void> {
    try {
      // Fetch latest data from Supabase
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (empError) {
        console.error('Error fetching employees from Supabase:', empError);
        return;
      }

      // Convert Supabase format to local storage format
      const localFormatEmployees = employees?.map(emp => ({
        employee_id: emp.employee_id,
        name: emp.name,
        email: emp.email || '',
        phone: emp.phone || '',
        department: emp.designation || '', // Map designation to department for compatibility
        designation: emp.designation || '',
        status: emp.status || 'Active'
      })) || [];

      // Update local storage with Supabase data
      SecureDataService.saveEmployeeData(localFormatEmployees);

      console.log('Successfully synced employees from Supabase');
      
      toast({
        title: "Sync Complete",
        description: "Local data has been synchronized with Supabase.",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize with Supabase.",
        variant: "destructive",
      });
    }
  }
}
