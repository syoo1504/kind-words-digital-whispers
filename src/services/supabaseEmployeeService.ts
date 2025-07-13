
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/attendance';
import { toast } from '@/components/ui/use-toast';

export class SupabaseEmployeeService {
  
  // Get all employees from Supabase
  static async getEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: "Failed to fetch employees from database.",
          variant: "destructive",
        });
        return [];
      }

      // Convert Supabase format to local Employee interface
      return data?.map(emp => ({
        employee_id: emp.employee_id,
        name: emp.name,
        email: emp.email || '',
        phone: emp.phone || '',
        department: emp.designation || '',
        designation: emp.designation || '',
        status: emp.status || 'Active'
      })) || [];
    } catch (error) {
      console.error('Error in getEmployees:', error);
      return [];
    }
  }

  // Add new employee to Supabase
  static async addEmployee(employee: Employee): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          employee_id: employee.employee_id,
          name: employee.name,
          email: employee.email || null,
          phone: employee.phone || null,
          designation: employee.designation || null,
          status: employee.status || 'Active'
        }])
        .select();

      if (error) {
        console.error('Error adding employee:', error);
        toast({
          title: "Error",
          description: `Failed to add employee: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Employee added successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error in addEmployee:', error);
      return false;
    }
  }

  // Update employee in Supabase
  static async updateEmployee(employeeId: string, updatedEmployee: Employee): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({
          employee_id: updatedEmployee.employee_id,
          name: updatedEmployee.name,
          email: updatedEmployee.email || null,
          phone: updatedEmployee.phone || null,
          designation: updatedEmployee.designation || null,
          status: updatedEmployee.status || 'Active'
        })
        .eq('employee_id', employeeId)
        .select();

      if (error) {
        console.error('Error updating employee:', error);
        toast({
          title: "Error",
          description: `Failed to update employee: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Employee updated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return false;
    }
  }

  // Delete employee from Supabase
  static async deleteEmployee(employeeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', employeeId);

      if (error) {
        console.error('Error deleting employee:', error);
        toast({
          title: "Error",
          description: `Failed to delete employee: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Employee deleted successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      return false;
    }
  }

  // Find employee by ID
  static async findEmployee(employeeId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (error) {
        console.error('Error finding employee:', error);
        return null;
      }

      if (!data) return null;

      return {
        employee_id: data.employee_id,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        department: data.designation || '',
        designation: data.designation || '',
        status: data.status || 'Active'
      };
    } catch (error) {
      console.error('Error in findEmployee:', error);
      return null;
    }
  }

  // Employee authentication
  static async authenticateEmployee(employeeId: string, password: string): Promise<{ success: boolean; employee?: Employee }> {
    try {
      // For now, using simple password check (emp123)
      // In production, you'd want proper password hashing
      if (password !== 'emp123') {
        return { success: false };
      }

      const employee = await this.findEmployee(employeeId);
      if (!employee || (employee.status !== 'Active' && employee.status !== 'active')) {
        return { success: false };
      }

      return { success: true, employee };
    } catch (error) {
      console.error('Error in authenticateEmployee:', error);
      return { success: false };
    }
  }
}
