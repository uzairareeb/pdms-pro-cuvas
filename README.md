
# Postgraduate Data Management System (PDMS)
## Directorate of Advanced Studies

This system is designed for internal use by the Directorate of Advanced Studies to manage postgraduate student progress, milestones, and official notifications.

### Features
1. **Student Management**: Full CRUD for student records with exact departmental fields.
2. **Milestone Tracking**: Automatic calculation of GS forms and thesis deadlines.
3. **Notification System**: Generation of official DAS letters for student progress notifications.
4. **Bulk Import**: Import student lists via CSV.
5. **Dashboard Analytics**: Real-time stats on degree distribution, department counts, and overdue tasks.
6. **Audit Trail**: Security logging of all staff actions.

### Database Setup (Supabase)
1. **Create a Supabase Project**:
   - Go to [Supabase](https://supabase.com/) and create a new project.
   - Go to the **SQL Editor** in your Supabase dashboard.
   - Copy the contents of `supabase_schema.sql` from this project and run it in the SQL Editor. This will create all necessary tables and policies.

2. **Configure Connection**:
   - In the app, navigate to **Settings > Database Control Panel**.
   - Enter your **Supabase Project URL** and **Anon Public Key** (found in Project Settings > API).
   - Click **Connect Database**.
   - Alternatively, set the following environment variables on your hosting provider:
     - `SUPABASE_URL`: Your Supabase project URL.
     - `SUPABASE_ANON_KEY`: Your Supabase anon public key.

3. **Login Credentials**:
   - Default Username: `admin`
   - Default Password: `admin123`

### Deployment Note
This is a **Full-Stack Node.js** application. To run the backend correctly on your virtual domain, you must ensure your hosting provider supports Node.js (e.g., Vercel, Heroku, DigitalOcean, or a VPS with Node.js installed). Standard PHP-only shared hosting will not be able to run the `server.ts` backend.
- **Milestones**: Milestones are auto-calculated based on the Session Start Date. You can manually mark them as completed in the Student Profile.
- **Notifications**: Go to a student's profile and click 'Generate Letter' to produce a professional PDF-ready notification.
- **Bulk Import**: Use the 'Bulk Upload' section to process large batches of student data.

### Compliance
The system follows official government-style UI requirements, prioritizing clarity, professionalism, and ease of use for administrative staff.
