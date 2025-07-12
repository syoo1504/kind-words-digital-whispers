
-- Create employees table
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  designation TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  qr_data TEXT,
  check_in_time TIME,
  check_out_time TIME,
  is_late BOOLEAN DEFAULT FALSE,
  late_duration_minutes INTEGER DEFAULT 0,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  attendance_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')),
  type TEXT CHECK (type IN ('check-in', 'check-out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_created_at ON attendance_records(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at 
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table (allow all operations for now)
CREATE POLICY "Allow all operations on employees" ON employees
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for attendance_records table (allow all operations for now)
CREATE POLICY "Allow all operations on attendance_records" ON attendance_records
    FOR ALL USING (true) WITH CHECK (true);

-- Insert sample employees
INSERT INTO employees (employee_id, name, email, phone, department, designation, status) VALUES
('EMP001', 'John Doe', 'john.doe@company.com', '+1234567890', 'IT', 'Software Developer', 'Active'),
('EMP002', 'Jane Smith', 'jane.smith@company.com', '+1234567891', 'HR', 'HR Manager', 'Active'),
('EMP003', 'Mike Johnson', 'mike.johnson@company.com', '+1234567892', 'Finance', 'Financial Analyst', 'Active'),
('EMP004', 'Sarah Wilson', 'sarah.wilson@company.com', '+1234567893', 'Marketing', 'Marketing Manager', 'Active');
