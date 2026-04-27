import express from "express";
import { createClient } from '@supabase/supabase-js';
import path from "path";
import fs from "fs";

const isVercel = process.env.VERCEL === '1';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const CONFIG_PATH = path.join(process.cwd(), 'supabase-config.json');

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
 
  // Centralized Bucket Configuration (Case-Sensitive fix for Supabase)
  const THESIS_BUCKET = 'thesis-files';
  const PROFILE_PICTURE_BUCKET = 'profile-pictures';

  const handleProfilePictureBase64 = async (cnic: string, base64Data: string) => {
    try {
      if (!base64Data || !base64Data.startsWith('data:image/')) return base64Data;
      
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const supabase = getServiceClient();
      const buffer = Buffer.from(base64Data.split(';base64,').pop() || '', 'base64');
      const fileName = `${normalizedCnic}_profile.jpg`;

      await supabase.storage.from(PROFILE_PICTURE_BUCKET).upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

      const { data } = supabase.storage.from(PROFILE_PICTURE_BUCKET).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.error("Base64 upload failed:", e);
      return base64Data;
    }
  };

  const getStoredConfig = () => {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        if (data.url && data.key) return data;
      }
    } catch (e) {
      console.error("Error reading config file:", e);
    }
    return {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_ANON_KEY || '',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    };
  };

  // Anon client – used for normal reads
  const getSupabaseClient = () => {
    const config = getStoredConfig();
    if (!config.url || !config.key) {
      throw new Error("Supabase configuration missing. Please set URL and Key in Database Settings.");
    }
    return createClient(config.url, config.key);
  };

  // Service-role client – bypasses RLS; used ONLY for student portal writes
  const getServiceClient = () => {
    const config = getStoredConfig();
    if (!config.url) throw new Error("Supabase URL missing.");
    // Prefer explicit service role key; fall back to anon (still works if bucket policy allows it)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      || config.serviceKey
      || config.key;
    return createClient(config.url, serviceKey);
  };

  // API routes
  app.get("/api/supabase/config", (req, res) => {
    const config = getStoredConfig();
    res.json({ 
      success: true, 
      url: config.url,
      key: config.key // Return full key as requested for the settings page
    });
  });

  app.post("/api/supabase/config", async (req, res) => {
    const { url, key } = req.body;
    try {
      if (!url || !key) {
        throw new Error("URL and Key are required");
      }
      // Validate before saving
      const supabase = createClient(url, key);
      const { error } = await supabase.from('students').select('count', { count: 'exact', head: true });
      
      // If it's just a "relation does not exist" error, it's still a valid connection
      if (error && !error.message.includes('relation "public.students" does not exist') && error.code !== 'PGRST116' && error.code !== '42P01') {
        throw new Error(`Invalid credentials or connection error: ${error.message}`);
      }

      fs.writeFileSync(CONFIG_PATH, JSON.stringify({ url, key }, null, 2));
      return res.json({ success: true, message: "Configuration saved and verified!" });
    } catch (error: any) {
      console.error("Supabase config error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get("/api/supabase/status", async (req, res) => {
    try {
      const config = getStoredConfig();
      if (!config.url || !config.key) {
        return res.json({ 
          connected: false, 
          message: "Database credentials not found. Please configure Supabase in Database Settings or set SUPABASE_URL and SUPABASE_ANON_KEY environment variables." 
        });
      }

      const supabase = createClient(config.url, config.key);
      // Test connection by attempting a simple select
      const { error } = await supabase.from('students').select('count', { count: 'exact', head: true });
      
      if (error) {
        // Check for specific error types
        const isTableMissing = error.message.includes('relation "public.students" does not exist') || error.code === 'PGRST116' || error.code === '42P01';
        
        if (isTableMissing) {
          return res.json({ 
            connected: true, 
            message: "Connected to Supabase, but 'students' table is missing. Please run the SQL setup.",
            url: config.url,
            lastVerified: new Date().toISOString(),
            setupRequired: true
          });
        }

        return res.json({ 
          connected: false, 
          message: `Connection Error: ${error.message}`,
          url: config.url,
          lastVerified: new Date().toISOString()
        });
      }

      const projectName = config.url.split('//')[1]?.split('.')[0] || "Supabase Project";

      return res.json({ 
        connected: true, 
        message: "Active (Connected)",
        url: config.url,
        projectName,
        lastVerified: new Date().toISOString()
      });
    } catch (error: any) {
      return res.json({ connected: false, message: `System Error: ${error.message}` });
    }
  });

  app.post("/api/supabase/disconnect", (req, res) => {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
      }
      return res.json({ success: true, message: "Disconnected successfully" });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/test-connection", async (req, res) => {
    const { type } = req.body;

    try {
      if (type !== 'supabase') {
        throw new Error("Unsupported database type");
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase.from('students').select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "public.students" does not exist')) {
          return res.json({ 
            success: true, 
            message: "Successfully connected to Supabase! Note: 'students' table not found. Please run the provided SQL setup." 
          });
        }
        throw new Error(`Supabase Error: ${error.message}`);
      }
      
      return res.json({ success: true, message: "Successfully connected to Supabase and 'students' table verified!" });
    } catch (error: any) {
      console.error(`Connection test failed for ${type}:`, error);
      return res.status(400).json({ 
        success: false, 
        message: error.message || "Connection failed. Please check your credentials." 
      });
    }
  });

  // Supabase Student Operations
  app.get("/api/supabase/students", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const serviceClient = getServiceClient();


      let query = supabase.from('students').select('*').order('sr_no', { ascending: true });
      

      // Parallel fetch students and their submissions
      const [studentsRes, submissionsRes] = await Promise.all([
        query,
        serviceClient.from('thesis_submissions').select('*')
      ]);

      if (studentsRes.error) throw studentsRes.error;

      // Hash submissions by normalized CNIC for O(1) lookup
      const submissionMap: Record<string, any> = {};
      if (submissionsRes.data) {
        submissionsRes.data.forEach((sub: any) => {
          submissionMap[sub.student_cnic] = sub;
        });
      }
      
      const mappedData = studentsRes.data.map((s: any) => {
        const normalizedCnic = (s.cnic || '').replace(/[-\s]/g, '').trim();
        const sub = submissionMap[normalizedCnic];
        
        let publicUrl = null;
        if (sub?.file_path) {
          const { data } = serviceClient.storage
            .from(THESIS_BUCKET)
            .getPublicUrl(sub.file_path.split('/').pop() || '');
          publicUrl = data.publicUrl;
        }
        
        return {
          id: s.id,
          srNo: s.sr_no,
          cnic: s.cnic,
          name: s.name,
          fatherName: s.father_name,
          regNo: s.reg_no,
          gender: s.gender,
          contactNumber: s.contact_number,
          degree: s.degree,
          session: s.session,
          department: s.department,
          programme: s.programme,
          currentSemester: s.current_semester,
          status: s.status,
          supervisorName: s.supervisor_name,
          coSupervisor: s.co_supervisor,
          member1: s.member1,
          member2: s.member2,
          thesisId: s.thesis_id,
          synopsis: s.synopsis,
          synopsisSubmissionDate: s.synopsis_submission_date,
          gs2CourseWork: s.gs2_course_work,
          gs4Form: s.gs4_form,
          semiFinalThesisStatus: s.semi_final_thesis_status,
          semiFinalThesisSubmissionDate: s.semi_final_thesis_submission_date,
          finalThesisStatus: s.final_thesis_status,
          finalThesisSubmissionDate: s.final_thesis_submission_date,
          thesisSentToCOE: s.thesis_sent_to_coe,
          coeSubmissionDate: s.coe_submission_date,
          validationStatus: s.validation_status,
          validationDate: s.validation_date,
          comments: s.comments,
          isLocked: s.is_locked,
          profilePictureUrl: s.profile_picture_url || null,
          filePath: sub?.file_path || null,
          isUploaded: sub?.is_uploaded || false,
          submissionDate: sub?.uploaded_at || null,
          publicUrl: publicUrl
        };
      });

      return res.json({ success: true, data: mappedData });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/add", async (req, res) => {
    const { student } = req.body;
    try {
      const supabase = getSupabaseClient();
      
      let profileUrl = student.profilePictureUrl || null;
      if (profileUrl && profileUrl.startsWith('data:image/')) {
        profileUrl = await handleProfilePictureBase64(student.cnic, profileUrl);
      }

      const insertPayload: any = {
        id: student.id,
        sr_no: student.srNo,
        cnic: student.cnic,
        name: student.name,
        father_name: student.fatherName,
        reg_no: student.regNo,
        gender: student.gender,
        contact_number: student.contactNumber,
        degree: student.degree,
        session: student.session,
        department: student.department,
        programme: student.programme,
        current_semester: student.currentSemester,
        status: student.status,
        supervisor_name: student.supervisorName,
        co_supervisor: student.coSupervisor,
        member1: student.member1,
        member2: student.member2,
        thesis_id: student.thesisId,
        synopsis: student.synopsis,
        synopsis_submission_date: student.synopsisSubmissionDate,
        gs2_course_work: student.gs2CourseWork,
        gs4_form: student.gs4Form,
        semi_final_thesis_status: student.semiFinalThesisStatus,
        semi_final_thesis_submission_date: student.semiFinalThesisSubmissionDate,
        final_thesis_status: student.finalThesisStatus,
        final_thesis_submission_date: student.finalThesisSubmissionDate,
        thesis_sent_to_coe: student.thesisSentToCOE,
        coe_submission_date: student.coeSubmissionDate,
        validation_status: student.validationStatus,
        validation_date: student.validationDate,
        comments: student.comments,
        profile_picture_url: profileUrl,
        is_locked: student.isLocked || false,
        // Note: file_path and is_uploaded are in thesis_submissions table, NOT students table
      };
      const { error } = await supabase.from('students').insert([insertPayload]);
      if (error) throw error;
      return res.json({ success: true, message: 'Student added successfully.' });
    } catch (error: any) {
      console.error('Student add error:', error.message);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/bulk-add", async (req, res) => {
    const { students } = req.body;
    try {
      const supabase = getSupabaseClient();
      const rows = students.map((student: any) => ({
        id: student.id,
        sr_no: student.srNo,
        cnic: student.cnic,
        name: student.name,
        father_name: student.fatherName,
        reg_no: student.regNo,
        gender: student.gender,
        contact_number: student.contactNumber,
        degree: student.degree,
        session: student.session,
        department: student.department,
        programme: student.programme,
        current_semester: student.currentSemester,
        status: student.status,
        supervisor_name: student.supervisorName,
        co_supervisor: student.coSupervisor,
        member1: student.member1,
        member2: student.member2,
        thesis_id: student.thesisId,
        synopsis: student.synopsis,
        synopsis_submission_date: student.synopsisSubmissionDate,
        gs2_course_work: student.gs2CourseWork,
        gs4_form: student.gs4Form,
        semi_final_thesis_status: student.semiFinalThesisStatus,
        semi_final_thesis_submission_date: student.semiFinalThesisSubmissionDate,
        final_thesis_status: student.finalThesisStatus,
        final_thesis_submission_date: student.finalThesisSubmissionDate,
        thesis_sent_to_coe: student.thesisSentToCOE,
        coe_submission_date: student.coeSubmissionDate,
        validation_status: student.validationStatus,
        validation_date: student.validationDate,
        comments: student.comments,
        is_locked: student.isLocked || false,
        // Note: file_path and is_uploaded live in thesis_submissions, NOT students
      }));
      const { error } = await supabase.from('students').insert(rows);
      if (error) throw error;
      return res.json({ success: true, count: rows.length });
    } catch (error: any) {
      console.error('Bulk add error:', error.message);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/update", async (req, res) => {
    const { student } = req.body;
    try {
      const supabase = getSupabaseClient();

      let profileUrl = student.profilePictureUrl;
      if (profileUrl && profileUrl.startsWith('data:image/')) {
        profileUrl = await handleProfilePictureBase64(student.cnic, profileUrl);
      }

      const { error } = await supabase.from('students').update({
        sr_no: student.srNo,
        cnic: student.cnic,
        name: student.name,
        father_name: student.fatherName,
        reg_no: student.regNo,
        gender: student.gender,
        contact_number: student.contactNumber,
        degree: student.degree,
        session: student.session,
        department: student.department,
        programme: student.programme,
        current_semester: student.currentSemester,
        status: student.status,
        supervisor_name: student.supervisorName,
        co_supervisor: student.coSupervisor,
        member1: student.member1,
        member2: student.member2,
        thesis_id: student.thesisId,
        synopsis: student.synopsis,
        synopsis_submission_date: student.synopsisSubmissionDate,
        gs2_course_work: student.gs2CourseWork,
        gs4_form: student.gs4Form,
        semi_final_thesis_status: student.semiFinalThesisStatus,
        semi_final_thesis_submission_date: student.semiFinalThesisSubmissionDate,
        final_thesis_status: student.finalThesisStatus,
        final_thesis_submission_date: student.finalThesisSubmissionDate,
        thesis_sent_to_coe: student.thesisSentToCOE,
        coe_submission_date: student.coeSubmissionDate,
        validation_status: student.validationStatus,
        validation_date: student.validationDate,
        comments: student.comments,
        profile_picture_url: profileUrl,
        is_locked: student.isLocked,
        // Note: file_path and is_uploaded live in thesis_submissions, NOT students
      }).eq('id', student.id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Student update error:', error.message);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/delete", async (req, res) => {
    const { id } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/bulk-delete", async (req, res) => {
    const { ids } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('students').delete().in('id', ids);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/delete-all", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('students').delete().neq('id', '');
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  // Settings Operations
  app.get("/api/supabase/settings", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('settings').select('data').eq('id', 'main_settings').single();
      if (error && error.code !== 'PGRST116') throw error;
      return res.json({ success: true, data: data?.data || null });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/settings", async (req, res) => {
    const { settings } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('settings').upsert({ id: 'main_settings', data: settings, updated_at: new Date().toISOString() });
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  // Staff Operations
  app.get("/api/supabase/staff", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('staff').select('*');
      if (error) throw error;
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/staff/add", async (req, res) => {
    const { staff } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('staff').insert([staff]);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/staff/update", async (req, res) => {
    const { staff } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('staff').update(staff).eq('id', staff.id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/staff/delete", async (req, res) => {
    const { id } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  // Audit Logs
  app.get("/api/supabase/audit-logs", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(1000);
      if (error) throw error;
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/audit-logs/add", async (req, res) => {
    const { log } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('audit_logs').insert([log]);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  // Sessions
  app.get("/api/supabase/sessions", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('sessions_config').select('*');
      if (error) throw error;
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/sessions/add", async (req, res) => {
    const { session } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('sessions_config').insert([session]);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  // ── Student Portal: Supabase Storage & Table Sync ────────────────────────
  const ensureThesisBucket = async () => {
    try {
      const supabase = getServiceClient();
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === THESIS_BUCKET);
      if (!exists) {
        await supabase.storage.createBucket(THESIS_BUCKET, {
          public: true, 
          fileSizeLimit: 20971520 // 20MB
        });
      }
    } catch (e) {
      console.error("Storage bucket check failed:", e);
    }
  };

  const ensureProfilePictureBucket = async () => {
    try {
      const supabase = getServiceClient();
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === PROFILE_PICTURE_BUCKET);
      if (!exists) {
        await supabase.storage.createBucket(PROFILE_PICTURE_BUCKET, {
          public: true,
          fileSizeLimit: 2097152 // 2MB
        });
      }
      // Ensure storage policies for public access
      await ensureStudentProfileMigration();
    } catch (e) {
      console.error("Profile picture bucket check failed:", e);
    }
  };

  const ensureStudentProfileMigration = async () => {
    try {
      const config = getStoredConfig();
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.serviceKey || config.key;
      const supabaseUrl = config.url;
      if (!supabaseUrl || !serviceKey) return;

      const sqlQuery = `
        -- 1. Ensure profile_picture_url column exists in students table
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='profile_picture_url') THEN
            ALTER TABLE students ADD COLUMN profile_picture_url TEXT;
          END IF;
        END $$;

        -- 2. Ensure storage policies for profile-pictures bucket
        -- Note: bucket_id is 'profile-pictures'
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profile-pictures', 'profile-pictures', true)
        ON CONFLICT (id) DO UPDATE SET public = true;

        -- Allow public read access to the profile-pictures bucket
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname = 'Public Access for Profile Pictures'
          ) THEN
            CREATE POLICY "Public Access for Profile Pictures" ON storage.objects
            FOR SELECT USING (bucket_id = 'profile-pictures');
          END IF;
        END $$;

        -- Allow authenticated uploads/updates via service role (already works)
        -- But let's add a general service role policy just in case
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname = 'Service Role Full Access'
          ) THEN
            CREATE POLICY "Service Role Full Access" ON storage.objects
            FOR ALL TO service_role USING (true) WITH CHECK (true);
          END IF;
        END $$;
      `;

      await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ sql: sqlQuery })
      });
    } catch (e) {
      console.error("Student profile migration failed:", e);
    }
  };

  const ensureThesisTable = async () => {
    try {
      const supabase = getServiceClient();
      const { error } = await supabase.from('thesis_submissions').select('id').limit(1);
      if (error && (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist'))) {
        const config = getStoredConfig();
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.serviceKey || config.key;
        const supabaseUrl = config.url;
        const sqlQuery = `
          CREATE TABLE IF NOT EXISTS thesis_submissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            student_cnic TEXT UNIQUE NOT NULL,
            student_id TEXT,
            file_path TEXT NOT NULL,
            is_uploaded BOOLEAN DEFAULT TRUE,
            uploaded_at TIMESTAMPTZ DEFAULT NOW()
          );`;
        await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          },
          body: JSON.stringify({ sql: sqlQuery })
        });
      }
    } catch (e) {}
  };

  const ensureResultsTable = async () => {
    try {
      const supabase = getServiceClient();
      const { error } = await supabase.from('student_results').select('id').limit(1);
      if (error && (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist'))) {
        const config = getStoredConfig();
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.serviceKey || config.key;
        const supabaseUrl = config.url;
        const sqlQuery = `
          CREATE TABLE IF NOT EXISTS student_results (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            student_cnic TEXT UNIQUE NOT NULL,
            total_marks INTEGER NOT NULL,
            obtained_marks INTEGER NOT NULL,
            percentage DECIMAL NOT NULL,
            status TEXT NOT NULL,
            valid_till DATE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );`;
        await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          },
          body: JSON.stringify({ sql: sqlQuery })
        });
      }
    } catch (e) {}
  };

  // Proxy endpoint to force direct download for admins
  app.get("/api/admin/proxy-download/:cnic", async (req, res) => {
    const { cnic } = req.params;
    const { filename } = req.query;
    try {
      const supabase = getServiceClient();
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      
      // Download file from storage
      const { data, error } = await supabase.storage
        .from(THESIS_BUCKET)
        .download(`${normalizedCnic}.pdf`);
 
      if (error) {
        console.error("Supabase Storage Error:", error);
        throw error;
      }

      // Set headers to force download with custom filename
      const safeFilename = (filename || `${cnic}_thesis.pdf`).toString();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      
      const buffer = Buffer.from(await data.arrayBuffer());
      return res.send(buffer);
    } catch (error: any) {
      console.error("Proxy download error:", error);
      return res.status(error.status || 404).json({ 
        success: false, 
        message: `Failed to download file. Please ensure the '${THESIS_BUCKET}' bucket exists and contains the file.` 
      });
    }
  });

  app.post("/api/student/upload-thesis", async (req, res) => {
    const { cnic, fileData } = req.body;
    try {
      if (!cnic || !fileData) throw new Error("CNIC and fileData are required");
      
      await ensureThesisBucket();
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const supabase = getServiceClient();
 
      // Pre-check: file already in storage?
      const { data: existing } = await supabase.storage
        .from(THESIS_BUCKET)
        .list('', { search: `${normalizedCnic}.pdf` });

      if (existing && existing.length > 0) {
        const { data: urlData } = supabase.storage
          .from(THESIS_BUCKET)
          .getPublicUrl(`${normalizedCnic}.pdf`);
        return res.json({ success: false, alreadyUploaded: true, message: "Your thesis has already been submitted.", publicUrl: urlData.publicUrl });
      }

      // Decode base64
      const base64Data = fileData.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid file data");
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(THESIS_BUCKET)
        .upload(`${normalizedCnic}.pdf`, buffer, {
          contentType: 'application/pdf',
          upsert: true // Allow overwriting if student re-uploads before final submission
        });
 
      if (error) throw new Error(error.message);
 
      const { data: urlData } = supabase.storage
        .from(THESIS_BUCKET)
        .getPublicUrl(`${normalizedCnic}.pdf`);

      return res.json({
        success: true,
        message: "Thesis uploaded to cloud successfully!",
        filePath: data.path,
        publicUrl: urlData.publicUrl
      });
    } catch (error: any) {
      console.error("Thesis upload error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  // ── Student Results API ──────────────────────────────────────────────────
  app.get("/api/results/:cnic", async (req, res) => {
    const { cnic } = req.params;
    try {
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const supabase = getServiceClient(); 
      
      const { data: result, error: resultError } = await supabase
        .from('student_results')
        .select('*')
        .or(`student_cnic.eq.${cnic},student_cnic.eq.${normalizedCnic}`)
        .maybeSingle();
        
      if (!result) throw new Error("Result not found");
      
      // Enrich with student info
      const { data: student } = await supabase
        .from('students')
        .select('name, father_name, programme, degree')
        .or(`cnic.eq.${cnic},cnic.eq.${normalizedCnic}`)
        .maybeSingle();
        
      return res.json({ 
        success: true, 
        data: { 
          ...result, 
          studentName: student?.name, 
          fatherName: student?.father_name, 
          programme: student?.programme || student?.degree 
        } 
      });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: "Result not found for this CNIC." });
    }
  });

  app.get("/api/admin/results", async (req, res) => {
    try {
      const supabase = getServiceClient();
      const { data, error } = await supabase.from('student_results').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/results", async (req, res) => {
    const { result } = req.body;
    try {
      const supabase = getServiceClient();
      const normalizedCnic = result.studentCnic.replace(/[-\s]/g, '').trim();
      
      const payload = {
        student_cnic: normalizedCnic,
        total_marks: result.totalMarks,
        obtained_marks: result.obtainedMarks,
        percentage: result.percentage,
        status: result.status,
        valid_till: result.validTill
      };
      
      const { error } = await supabase
        .from('student_results')
        .upsert(payload, { onConflict: 'student_cnic' });
        
      if (error) throw error;
      return res.json({ success: true, message: 'Result updated successfully.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/student/upload-profile-picture", async (req, res) => {
    const { cnic, studentId, fileData } = req.body;
    try {
      if ((!cnic && !studentId) || !fileData) throw new Error("Student identification and fileData are required");
      
      await ensureProfilePictureBucket();
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const supabase = getServiceClient();
 
      // Decode base64
      const base64Data = fileData.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid file data");
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to Supabase Storage
      const fileName = `${normalizedCnic}_profile.jpg`;
      const { data, error } = await supabase.storage
        .from(PROFILE_PICTURE_BUCKET)
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
 
      if (error) throw new Error(error.message);
 
      const { data: urlData } = supabase.storage
        .from(PROFILE_PICTURE_BUCKET)
        .getPublicUrl(fileName);

      // Update student table with the URL
      let updateQuery = supabase.from('students').update({ profile_picture_url: urlData.publicUrl });
      
      if (studentId) {
        updateQuery = updateQuery.eq('id', studentId);
      } else {
        // Fallback: Try to match raw CNIC or normalized version if id is missing
        updateQuery = updateQuery.or(`cnic.eq.${cnic},cnic.eq.${normalizedCnic}`);
      }

      const { error: updateError } = await updateQuery;

      if (updateError) throw new Error(updateError.message);

      return res.json({
        success: true,
        message: "Profile picture uploaded successfully!",
        publicUrl: urlData.publicUrl
      });
    } catch (error: any) {
      console.error("Profile picture upload error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get("/api/student/check-upload/:cnic", async (req, res) => {
    const { cnic } = req.params;
    try {
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const supabase = getServiceClient();

      // Check thesis_submissions table first (final submission)
      const { data: dbData } = await supabase
        .from('thesis_submissions')
        .select('file_path, is_uploaded, thesis_title')
        .eq('student_cnic', normalizedCnic)
        .maybeSingle();

      if (dbData?.is_uploaded) {
        const { data: urlData } = supabase.storage
          .from(THESIS_BUCKET)
          .getPublicUrl(`${normalizedCnic}.pdf`);
        return res.json({ 
          success: true, 
          exists: true, 
          finalized: true, 
          publicUrl: urlData.publicUrl, 
          filePath: dbData.file_path,
          thesisTitle: dbData.thesis_title 
        });
      }

      // Check storage bucket (staged upload, not yet finalized)
      const { data: storageData } = await supabase.storage
        .from(THESIS_BUCKET)
        .list('', { search: `${normalizedCnic}.pdf` });
 
      const staged = !!(storageData && storageData.length > 0);
      let publicUrl = null;
      if (staged) {
        const { data: urlData } = supabase.storage
          .from(THESIS_BUCKET)
          .getPublicUrl(`${normalizedCnic}.pdf`);
        publicUrl = urlData.publicUrl;
      }

      return res.json({ 
        success: true, 
        exists: staged, 
        finalized: false, 
        publicUrl,
        thesisTitle: dbData?.thesis_title || null 
      });
    } catch (error: any) {
      return res.json({ success: true, exists: false, finalized: false, publicUrl: null });
    }
  });

  app.post("/api/student/finalize-thesis-submission", async (req, res) => {
    const { studentId, cnic, filePath, thesisTitle } = req.body;
    try {
      if (!cnic || !filePath) throw new Error("CNIC and filePath are required");

      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const supabase = getServiceClient();

      // Ensure thesis_submissions table exists
      await ensureThesisTable();

      // Upsert into thesis_submissions (separate table, students table untouched)
      const upsertPayload: any = {
        student_cnic: normalizedCnic,
        student_id: studentId || null,
        file_path: filePath,
        is_uploaded: true,
        uploaded_at: new Date().toISOString()
      };
      // Try to include thesis_title if column exists (gracefully ignored if not)
      if (thesisTitle) upsertPayload.thesis_title = thesisTitle;

      const { error } = await supabase
        .from('thesis_submissions')
        .upsert(upsertPayload, { onConflict: 'student_cnic' });

      if (error) {
        // If thesis_title column doesn't exist, retry without it
        if (thesisTitle && (error.message.includes('thesis_title') || error.code === '42703')) {
          const { error: error2 } = await supabase
            .from('thesis_submissions')
            .upsert({
              student_cnic: normalizedCnic,
              student_id: studentId || null,
              file_path: filePath,
              is_uploaded: true,
              uploaded_at: new Date().toISOString()
            }, { onConflict: 'student_cnic' });
          if (error2 && error2.code !== '42P01' && !error2.message.includes('does not exist')) {
            throw new Error(error2.message);
          }
        } else if (error.code === '42P01' || error.message.includes('does not exist')) {
          return res.status(400).json({
            success: false,
            needsMigration: true,
            message: "Run this SQL once in your Supabase dashboard SQL Editor",
            sql: `CREATE TABLE IF NOT EXISTS thesis_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_cnic TEXT UNIQUE NOT NULL,
  student_id TEXT,
  file_path TEXT NOT NULL,
  thesis_title TEXT,
  is_uploaded BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE POLICY "Allow all" ON thesis_submissions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE thesis_submissions ENABLE ROW LEVEL SECURITY;`
          });
        } else {
          throw new Error(error.message);
        }
      }

      return res.json({ success: true, message: "Thesis finalized and recorded successfully!" });
    } catch (error: any) {
      console.error("Finalize error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  // ── Save thesis title separately (called right after upload) ─────────────
  app.post("/api/student/save-title", async (req, res) => {
    const { cnic, thesisTitle, studentName, regNo, department, degree, supervisorName } = req.body;
    try {
      if (!cnic || !thesisTitle) throw new Error("CNIC and thesisTitle are required");
      const normalizedCnic = cnic.replace(/[-\s]/g, '').trim();
      const supabase = getServiceClient();
      // Try upsert with thesis_title column — best effort
      await supabase
        .from('thesis_submissions')
        .upsert({
          student_cnic: normalizedCnic,
          thesis_title: thesisTitle,
          student_id: null,
          file_path: `${THESIS_BUCKET}/${normalizedCnic}.pdf`,
          is_uploaded: false,
          uploaded_at: new Date().toISOString()
        }, { onConflict: 'student_cnic' })
        .select();
      // Silently succeed even if column doesn't exist (title stored client-side as fallback)
      return res.json({ success: true });
    } catch (error: any) {
      // Non-critical — client has localStorage fallback
      return res.json({ success: true, warning: error.message });
    }
  });

  // ── Admin: fetch all thesis titles ────────────────────────────────────────
  app.get("/api/admin/thesis-titles", async (req, res) => {
    try {
      const supabase = getServiceClient();
      // Try to get thesis_title from thesis_submissions
      const { data, error } = await supabase
        .from('thesis_submissions')
        .select('student_cnic, student_id, thesis_title, uploaded_at')
        .eq('is_uploaded', true);

      if (error) {
        // Column may not exist — return empty gracefully
        return res.json({ success: true, records: [] });
      }

      // Fetch all students to enrich the records
      const { data: studentsData } = await supabase.from('students').select('id, cnic, name, reg_no, department, degree, supervisor_name');
      const studentMap: Record<string, any> = {};
      if (studentsData) {
        studentsData.forEach((s: any) => {
          const norm = (s.cnic || '').replace(/[-\s]/g, '').trim();
          studentMap[norm] = s;
        });
      }

      const records = (data || []).map((row: any) => {
        const norm = (row.student_cnic || '').replace(/[-\s]/g, '').trim();
        const st = studentMap[norm];
        return {
          cnic: norm,
          thesisTitle: row.thesis_title || null,
          submissionDate: row.uploaded_at,
          studentName: st?.name || '',
          regNo: st?.reg_no || '',
          department: st?.department || '',
          degree: st?.degree || '',
          supervisorName: st?.supervisor_name || '',
        };
      });

      return res.json({ success: true, records });
    } catch (error: any) {
      return res.json({ success: true, records: [] });
    }
  });

  // ── Save Service Role Key (for admin settings page) ───────────────────────
  app.post("/api/supabase/service-key", async (req, res) => {
    const { serviceKey } = req.body;
    try {
      if (!serviceKey) throw new Error("serviceKey is required");
      const config = getStoredConfig();
      const updatedConfig = { ...config, serviceKey };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
      return res.json({ success: true, message: "Service role key saved." });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });


  // Vite middleware for development (local only)
  if (!isVercel && process.env.NODE_ENV !== "production") {
    try {
      // @ts-ignore - Dynamic import to avoid issues when vite is not installed in production
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware loaded in development mode");
    } catch (e) {
      console.warn("Vite could not be loaded. If you are in production, this is expected if you've already built the app.");
    }
  } else if (!isVercel) {
    const distPath = path.join(process.cwd(), 'dist');
    const uploadsPath = path.join(process.cwd(), 'uploads');
    
    app.use('/uploads', express.static(uploadsPath));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Server Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
    });
  });

  // Run migrations on startup
  void ensureProfilePictureBucket();
  void ensureThesisTable();
  void ensureResultsTable();

  return app;
}

const appPromise = startServer();
export default appPromise;
