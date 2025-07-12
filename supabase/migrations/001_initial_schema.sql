
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

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
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "Enable read access for all users" ON employees FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON employees FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON employees FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for attendance_records table
CREATE POLICY "Enable read access for all users" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON attendance_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON attendance_records FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample employees
INSERT INTO employees (employee_id, name, email, phone, department, designation, status) VALUES
('EMP001', 'John Doe', 'john.doe@company.com', '+1234567890', 'IT', 'Software Developer', 'Active'),
('EMP002', 'Jane Smith', 'jane.smith@company.com', '+1234567891', 'HR', 'HR Manager', 'Active'),
('EMP003', 'Mike Johnson', 'mike.johnson@company.com', '+1234567892', 'Finance', 'Financial Analyst', 'Active'),
('EMP004', 'Sarah Wilson', 'sarah.wilson@company.com', '+1234567893', 'Marketing', 'Marketing Manager', 'Active');
