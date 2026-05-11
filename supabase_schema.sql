-- PDMS-PRO v4.0 Supabase Schema (Updated for Department Isolation)

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table
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
  department_id TEXT REFERENCES departments(id),
  programme TEXT,
  current_semester INTEGER,
  status TEXT,
  supervisor_name TEXT,
  co_supervisor TEXT,
  member1 TEXT,
  member2 TEXT,
  thesis_id TEXT,
  thesis_title TEXT,
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
  profile_picture_url TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Department Users
CREATE TABLE IF NOT EXISTS department_users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  department TEXT,
  department_id TEXT REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT,
  password TEXT,
  role TEXT,
  last_login TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table (Admin)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  "user" TEXT,
  action TEXT,
  details TEXT
);

-- 7. Department Audit Logs
CREATE TABLE IF NOT EXISTS department_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  department_user_id TEXT,
  department_user_name TEXT,
  department TEXT,
  department_id TEXT,
  action TEXT,
  details TEXT
);

-- 8. Sessions Table
CREATE TABLE IF NOT EXISTS sessions_config (
  id TEXT PRIMARY KEY,
  name TEXT,
  start_date TEXT,
  end_date TEXT,
  is_active BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_audit_logs ENABLE ROW LEVEL SECURITY;

-- Simple "Allow All" policies for demo purposes (NOT FOR PRODUCTION)
-- In production, replace these with owner-specific or role-specific policies.
CREATE POLICY "Allow all" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sessions_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON department_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON department_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 9. Initial Departments Data (Optional)
INSERT INTO departments (id, name) VALUES 
('dept-abg', 'Animal Breeding & Genetics'),
('dept-an', 'Animal Nutrition'),
('dept-bi', 'Bioinformatics'),
('dept-ch', 'Chemistry'),
('dept-fst', 'Food Science and Technology'),
('dept-lm', 'Livestock Management'),
('dept-mb', 'Microbiology'),
('dept-pa', 'Pathology'),
('dept-pt', 'Pharmacology & Toxicology'),
('dept-ps', 'Poultry Science'),
('dept-bc', 'Biochemistry'),
('dept-fa', 'Fisheries & Aquiculture'),
('dept-zo', 'Zoology')
ON CONFLICT (name) DO NOTHING;

-- 10. Thesis Submissions Table
CREATE TABLE IF NOT EXISTS thesis_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_cnic TEXT UNIQUE NOT NULL,
  student_id TEXT,
  file_path TEXT NOT NULL,
  thesis_title TEXT,
  is_uploaded BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE thesis_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON thesis_submissions FOR ALL USING (true) WITH CHECK (true);

-- 11. Student Results Table
CREATE TABLE IF NOT EXISTS student_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_cnic TEXT UNIQUE NOT NULL,
  total_marks INTEGER NOT NULL,
  obtained_marks INTEGER NOT NULL,
  passing_marks INTEGER NOT NULL DEFAULT 550,
  percentage DECIMAL NOT NULL,
  status TEXT NOT NULL,
  valid_till DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON student_results FOR ALL USING (true) WITH CHECK (true);

-- 12. Result Templates Table
CREATE TABLE IF NOT EXISTS result_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE result_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON result_templates FOR ALL USING (true) WITH CHECK (true);

-- 13. Storage Setup Instructions (for buckets)
-- Please ensure the following buckets are created in Supabase Storage with "Public" access:
-- 1. "profile-pictures"
-- 2. "thesis-files"
-- 3. "result-templates"

-- 14. Reload PostgREST schema cache so API immediately recognizes new tables
NOTIFY pgrst, reload_schema;
