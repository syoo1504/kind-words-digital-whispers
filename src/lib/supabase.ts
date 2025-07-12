
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Employee {
  id?: string
  employee_id: string
  name: string
  email?: string
  phone?: string
  department: string
  designation: string
  status: 'Active' | 'Inactive'
  created_at?: string
  updated_at?: string
}

export interface AttendanceRecord {
  id?: string
  employee_id: string
  employee_name: string
  qr_data?: string
  check_in_time?: string
  check_out_time?: string
  is_late: boolean
  late_duration_minutes?: number
  overtime_hours?: number
  attendance_date?: string
  status: 'success' | 'error'
  type: 'check-in' | 'check-out'
  created_at?: string
  updated_at?: string
}
