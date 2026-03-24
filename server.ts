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

  const getStoredConfig = () => {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        if (data.url && data.key) return data;
      }
    } catch (e) {
      console.error("Error reading config file:", e);
    }
    
    // Fallback to environment variables
    return {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_ANON_KEY || ''
    };
  };

  const getSupabaseClient = () => {
    const config = getStoredConfig();
    if (!config.url || !config.key) {
      throw new Error("Supabase configuration missing. Please set URL and Key in Database Settings.");
    }
    return createClient(config.url, config.key);
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
      const { data, error } = await supabase.from('students').select('*').order('sr_no', { ascending: true });
      if (error) throw error;
      
      // Map snake_case to camelCase if needed, but let's assume we use the same keys for simplicity
      // or map them if the user's table uses snake_case.
      // Based on the SQL provided earlier, it seems they might use snake_case.
      // Let's map them to match the Student interface.
      const mappedData = data.map((s: any) => ({
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
        isLocked: s.is_locked
      }));

      return res.json({ success: true, data: mappedData });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/add", async (req, res) => {
    const { student } = req.body;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('students').insert([{
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
        is_locked: student.isLocked
      }]);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
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
        is_locked: student.isLocked
      }));
      const { error } = await supabase.from('students').insert(rows);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post("/api/supabase/students/update", async (req, res) => {
    const { student } = req.body;
    try {
      const supabase = getSupabaseClient();
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
        is_locked: student.isLocked
      }).eq('id', student.id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
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

  return app;
}

const appPromise = startServer();
export default appPromise;
