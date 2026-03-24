-- PDMS-PRO v4.0 Supabase Schema

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  sr_no TEXT,
  cnic TEXT,
  name TEXT,
  father_name TEXT,
  reg_no TEXT,
  gender TEXT,
  contact_number TEXT,
  degree TEXT,
  session TEXT,
  department TEXT,
  programme TEXT,
  current_semester INTEGER,
  status TEXT,
  supervisor_name TEXT,
  co_supervisor TEXT,
  member1 TEXT,
  member2 TEXT,
  thesis_id TEXT,
  synopsis TEXT,
  synopsis_submission_date TEXT,
  gs2_course_work TEXT,
  gs4_form TEXT,
  semi_final_thesis_status TEXT,
  semi_final_thesis_submission_date TEXT,
  final_thesis_status TEXT,
  final_thesis_submission_date TEXT,
  thesis_sent_to_coe TEXT,
  coe_submission_date TEXT,
  validation_status TEXT,
  validation_date TEXT,
  comments TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT,
  password TEXT,
  role TEXT,
  last_login TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  "user" TEXT,
  action TEXT,
  details TEXT
);

-- 5. Sessions Table
CREATE TABLE IF NOT EXISTS sessions_config (
  id TEXT PRIMARY KEY,
  name TEXT,
  start_date TEXT,
  end_date TEXT,
  is_active BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (RLS) - For now, we'll keep it simple for the user
-- But in production, you should add policies.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_config ENABLE ROW LEVEL SECURITY;

-- Simple "Allow All" policies for demo purposes (NOT FOR PRODUCTION)
CREATE POLICY "Allow all for anon" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sessions_config FOR ALL USING (true) WITH CHECK (true);
