
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Student, SystemSettings, AuditLog, StudentStatus, Gender, StaffUser, RolePermissions, SessionConfig, ValidationStatus
} from './types';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

interface AppContextType {
  students: Student[];
  degrees: string[];
  departments: string[];
  programmes: string[];
  faculty: string[];
  settings: SystemSettings;
  auditLogs: AuditLog[];
  staff: StaffUser[];
  sessions: SessionConfig[];
  currentUser: StaffUser | null;
  currentRole: RolePermissions | null;
  notification: Notification | null;
  isDatabaseConnected: boolean;
  isLoading: boolean;
  error: string | null;
  reviewedCriticalActions: string[];
  /** True briefly after successful login until post-login branded gate completes */
  justLoggedIn: boolean;
  completePostLoginSession: () => void;
  notify: (message: string, type: 'success' | 'error') => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addStudent: (student: Omit<Student, 'id' | 'isLocked' | 'srNo'>) => void;
  bulkAddStudents: (newStudents: Omit<Student, 'id' | 'isLocked' | 'srNo'>[]) => Promise<number>;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  bulkDeleteStudents: (ids: string[]) => void;
  deleteAllStudents: () => void;
  toggleLockStudent: (id: string) => void;
  updateSettings: (settings: SystemSettings) => void;
  logAction: (action: string, details: string) => void;
  addStaff: (user: Omit<StaffUser, 'id'>) => void;
  updateStaff: (user: StaffUser) => void;
  deleteStaff: (id: string) => void;
  addSession: (session: SessionConfig) => void;
  backupDatabase: () => void;
  markActionAsReviewed: (id: string) => void;
  sendReminder: (id: string, item?: string) => void;
  setupDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FACULTY_DATABASE = [
  "Dr. Haseeb Khaliq", "Mr. Muhammad Sajid", "Mr. Muhammad Usman", "Dr. Muhammad Rafiq", "Dr. Jawaria Aslam", 
  "Dr. Khurruam Shehzad", "Dr. Yasir Waqas", "Dr. Yasmin", "Dr. Muhammad Yar", "Dr. Shaukat Hussain Munawar", 
  "Dr. Zahid Manzoor", "Dr. Kashif Akram", "Dr. Hamid Majeed", "Dr. Tahir Mahmood Qureshi", "Dr. Afshan Shafi", 
  "Dr. Sheraz Ahmed", "Dr. Abdul Ghaffar", "Dr. S Qaswar Ali Shah", "Dr. Huma Naz", "Dr. Irfan Baboo", 
  "Dr. Zahid Farooq", "Dr. Santosh Kumar", "Dr. Adnan A Qazi", "Dr. M. Tariq Mahmood", "Ms. Tayyaba Riaz", 
  "Ms. Mutyyba Asghar", "Mr. Muhammad Atif Noor", "Mr. Muhammad Umer Farooq", "Dr. Nasir Jalal", "Dr. Asim Masood", 
  "Dr. Waheed Yousuf Ramay", "Dr. Zulqarnain", "Dr. Rana Muhammad Bilal", "Dr. Asif Javaid", "Dr. Imtiaz Hussain Raja", 
  "Dr. Muhammad Uzair Akhtar", "Dr. Umair Younas", "Dr. Zeeshan M. Iqbal", "Dr. Muhammad Nauman", "Mr. Rameez Abid", 
  "Mr. Sannan Nazir", "Mr. Muhammad Arslan", "Dr. Muhammad Tahir Khan", "Mr. Muhammad Azhar", "Ms. Tahreem Asad", 
  "Dr. Muhammad Safdar", "Miss Humaira Amin", "Dr. M. Azhar", "Dr. Arslan Sehgal", "Dr. Faiz-ul Hassan", 
  "Dr. Hafiz Ifhtikhar Hussain", "Dr. Mujahid Iqbal", "Dr. Rizwana Sultan", "Dr. Mubasher Rauf", "Prof. Dr. Muhammad Mazhar Ayaz", 
  "Dr. Wasim Babar", "Dr. Abdullah Saghir Ahmad", "Dr. Muhammad Adeel Hassan", "Dr. Jamal Muhammad Khan", "Dr. Faisal Siddique", 
  "Dr. Rais Ahmed", "Dr. Moazam Jalees", "Dr. Waqas Ashraf", "Dr. Firasat Hussain", "Dr. Qudratullah Mehsud", 
  "Dr. Fazal Wadood", "Dr. Muhammad Luqman Sohail", "Dr. Kashif Hussain", "Dr. Amjad Islam Aqib", "Dr. Omer Naseer", 
  "Dr. Kashif Prince", "Dr. Qudratullah", "Dr. Muhammad Shahid", "Dr. Ameer Hamza Rabbani", "Dr. Tariq Abbas", 
  "Dr. Muhammad Naeem Shahid", "Dr. Saleh Nawaz Khan", "Dr. Muhammad Ajmal", "Dr. Mushtaq Ahmad Gondal", "Dr. Muhammad Kasif Iqbal", 
  "Mr. Muhammad Kaleem", "Dr. Hanzla Ahmad", "Ms. Rimsha Hamid", "Ms. Samavia Shaheen", "Ms. Qurat-Ul-Ain Mumtaz", 
  "Ms. Shariha Sohail", "Ms. Iqra Naeem", "Dr. Inam Ullah Wattoo", "Dr. Khawaja Saif Ur Rehman", "Dr. Tanveer Akhtar", 
  "Dr. Samina Anjum", "Dr. Abdul Khaliq", "Mr. Muhammad Kamal", "Miss Aisha Kabir", "Mr. Zaib Hassan Niazi", 
  "Mr. Rao Basharat Ali", "Dr. Humera Hayat", "Mr. Shafaqat Ali"
];

const DEFAULT_LOGO_PATH = '/logo.jpg';

const INITIAL_SETTINGS: SystemSettings = {
  institution: {
    name: "Cholistan University of Veterinary & Animal Sciences, Bahawalpur",
    directorate: "Directorate of Advanced Studies",
    systemName: "PDMS-PRO v4.0",
    email: "das@cuvas.edu.pk",
    contact: "+92-62-9255711",
    academicYear: "2025-26",
    admissionSession: "Spring 2026",
    logo: DEFAULT_LOGO_PATH,
  },
  security: {
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableRecordLocking: true,
    enableDeletion: false,
  },
  maintenance: {
    version: "4.0.0-PRO",
    lastBackup: "2025-05-25 11:30 AM",
  },
  databases: {
    supabase: { url: '', key: '' },
  },
  milestones: {
    gs2: { enabled: true },
    synopsis: { enabled: true },
    gs4: { enabled: true },
    semiFinal: { enabled: true },
    final: { enabled: true },
    coe: { enabled: true },
  },
  defaultSemesterDurationWeeks: 18,
};

const INITIAL_STUDENTS: Student[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('das_user_obj');
    return saved ? JSON.parse(saved) : null;
  });
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const [staff, setStaff] = useState<StaffUser[]>([]);

  const [sessions, setSessions] = useState<SessionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCriticalActions, setReviewedCriticalActions] = useState<string[]>(() => 
    JSON.parse(localStorage.getItem('das_reviewed_actions') || '[]')
  );

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check connection status first
      const statusRes = await fetch('/api/supabase/status');
      
      if (!statusRes.ok) {
        let errorMessage = `Server error: ${statusRes.status}`;
        try {
          const errorData = await statusRes.json();
          if (errorData.error) {
            errorMessage = `${errorMessage} - ${errorData.error}`;
          } else if (errorData.message) {
            errorMessage = `${errorMessage} - ${errorData.message}`;
          }
        } catch (e) {
          // Not JSON, use text if available
          const text = await statusRes.text().catch(() => "");
          if (text && text.length < 100) errorMessage = `${errorMessage} - ${text}`;
        }
        
        if (errorMessage.includes("Rate exceeded")) {
          throw new Error("API Rate limit exceeded. Please wait a moment and refresh.");
        }
        throw new Error(errorMessage);
      }

      const statusData = await statusRes.json();
      setIsDatabaseConnected(statusData.connected);

      if (statusData.connected) {
        // Fetch all data from Supabase via backend
        // We'll fetch them sequentially to avoid hitting rate limits on some environments
        const endpoints = [
          { key: 'students', url: '/api/supabase/students' },
          { key: 'settings', url: '/api/supabase/settings' },
          { key: 'staff', url: '/api/supabase/staff' },
          { key: 'logs', url: '/api/supabase/audit-logs' },
          { key: 'sessions', url: '/api/supabase/sessions' }
        ];

        const results: any = {};

        for (const endpoint of endpoints) {
          const res = await fetch(endpoint.url);
          if (!res.ok) {
            const text = await res.text();
            if (text.includes("Rate exceeded")) {
              throw new Error(`Rate limit exceeded while fetching ${endpoint.key}.`);
            }
            continue; // Skip this one if it failed but not a rate limit
          }
          results[endpoint.key] = await res.json();
        }

        if (results.students?.success) setStudents(results.students.data);
        if (results.settings?.success && results.settings.data) {
          setSettings({
            ...results.settings.data,
            institution: {
              ...results.settings.data.institution,
              logo: DEFAULT_LOGO_PATH
            }
          });
        }
        if (results.staff?.success) setStaff(results.staff.data);
        if (results.logs?.success) setAuditLogs(results.logs.data);
        if (results.sessions?.success) setSessions(results.sessions.data);
      }
    } catch (err: any) {
      console.error("Error fetching initial data:", err);
      setError(err.message || "Failed to connect to database backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    
    // Heartbeat to keep connection status updated globally
    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch('/api/supabase/status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setIsDatabaseConnected(statusData.connected);
        }
      } catch (e) {
        setIsDatabaseConnected(false);
      }
    }, 30000); // Every 30s
    
    return () => clearInterval(interval);
  }, [fetchInitialData]);

  useEffect(() => {
    localStorage.setItem('das_reviewed_actions', JSON.stringify(reviewedCriticalActions));
  }, [reviewedCriticalActions]);

  const notify = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const completePostLoginSession = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Admin check
    if (username === 'admin' && password === 'admin123') {
      const adminUser: StaffUser = {
        id: 'admin',
        username: 'admin',
        name: 'System Administrator',
        role: 'System Administrator'
      };
      setCurrentUser(adminUser);
      localStorage.setItem('das_user_obj', JSON.stringify(adminUser));
      setJustLoggedIn(true);
      void fetchInitialData();
      logAction('Access', `Administrator logged into the system.`);
      notify(`Welcome back, Admin. Access granted.`, 'success');
      return true;
    }

    // Staff check
    const user = staff.find(s => s.username === username && s.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('das_user_obj', JSON.stringify(user));
      setJustLoggedIn(true);
      void fetchInitialData();
      logAction('Access', `${user.name} logged into the system.`);
      notify(`Welcome back, ${user.name}. Access granted.`, 'success');
      return true;
    }

    notify('Invalid credentials. Access denied.', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setJustLoggedIn(false);
    localStorage.removeItem('das_user_obj');
    notify('Secure logout successful.', 'success');
  };

  const logAction = async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'L' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'System',
      action,
      details,
    };
    
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/audit-logs/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ log: newLog })
        });
      } catch (e) {
        console.error("Failed to log action to Supabase", e);
      }
    }
    
    setAuditLogs(prev => [newLog, ...prev].slice(0, 1000));
  };

  const addStudent = async (data: any) => {
    const newStudent: Student = {
      ...data,
      id: 's' + Math.random().toString(36).substr(2, 5),
      srNo: (students.length + 1).toString().padStart(3, '0'),
      isLocked: false
    };

    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/students/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: newStudent })
        });
      } catch (e) {
        notify("Failed to sync with cloud database", "error");
        return;
      }
    }

    setStudents(prev => [...prev, newStudent]);
    logAction('Registration', `Enrolled: ${newStudent.name}`);
    notify(`Scholar ${newStudent.name} provisioned successfully.`, 'success');
  };

  const bulkAddStudents = async (newStudentsData: any[]): Promise<number> => {
    const startSr = students.length + 1;
    const processed = newStudentsData.map((data, index) => ({
      ...data,
      id: 's' + Math.random().toString(36).substr(2, 8),
      srNo: (startSr + index).toString().padStart(3, '0'),
      isLocked: false,
      currentSemester: parseInt(data.currentSemester) || 1
    }));
    
    if (isDatabaseConnected) {
      try {
        const res = await fetch('/api/supabase/students/bulk-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: processed })
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || payload?.success === false) {
          throw new Error(payload?.message || `Bulk upload failed with status ${res.status}`);
        }
      } catch (e) {
        throw (e instanceof Error ? e : new Error("Failed to sync bulk upload with cloud"));
      }
    }

    setStudents(prev => [...prev, ...processed]);
    logAction('Bulk Upload', `Added ${processed.length} records via CSV.`);
    notify(`${processed.length} scholar records integrated into registry.`, 'success');
    return processed.length;
  };

  const updateStudent = async (updated: Student) => {
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/students/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: updated })
        });
      } catch (e) {
        notify("Failed to sync update with cloud", "error");
        return;
      }
    }

    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    logAction('Records', `Updated: ${updated.name}`);
    notify(`Record for ${updated.name} updated successfully.`, 'success');
  };

  const toggleLockStudent = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const updated = { ...student, isLocked: !student.isLocked };
    
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/students/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: updated })
        });
      } catch (e) {
        notify("Failed to sync lock status", "error");
        return;
      }
    }

    setStudents(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteStudent = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;

    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/students/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } catch (e) {
        notify("Failed to sync deletion with cloud", "error");
        return;
      }
    }

    setStudents(prev => prev.filter(s => s.id !== id));
    logAction('Records', `Deleted: ${student.name}`);
    notify(`Record for ${student.name} removed from registry.`, 'success');
  };

  const bulkDeleteStudents = async (ids: string[]) => {
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/students/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        });
      } catch (e) {
        notify("Failed to sync bulk deletion with cloud", "error");
        return;
      }
    }

    setStudents(prev => prev.filter(s => !ids.includes(s.id)));
    logAction('Records', `Bulk Purge: Removed ${ids.length} records.`);
    notify(`${ids.length} scholar records have been purged.`, 'success');
  };

  const deleteAllStudents = async () => {
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/students/delete-all', {
          method: 'POST'
        });
      } catch (e) {
        notify("Failed to sync registry purge with cloud", "error");
        return;
      }
    }

    setStudents([]);
    logAction('Records', 'Registry Purge: All records removed.');
    notify('Entire scholar registry has been purged.', 'success');
  };

  const addStaff = async (data: Omit<StaffUser, 'id'>) => {
    const newUser: StaffUser = {
      ...data,
      id: 'u' + Math.random().toString(36).substr(2, 5)
    };

    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/staff/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff: newUser })
        });
      } catch (e) {
        notify("Failed to sync staff addition with cloud", "error");
        return;
      }
    }

    setStaff(prev => [...prev, newUser]);
    logAction('Staff Management', `Added: ${newUser.name}`);
    notify(`Staff account for ${newUser.name} created.`, 'success');
  };

  const updateStaff = async (updated: StaffUser) => {
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/staff/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff: updated })
        });
      } catch (e) {
        notify("Failed to sync staff update with cloud", "error");
        return;
      }
    }

    setStaff(prev => prev.map(u => u.id === updated.id ? updated : u));
    logAction('Staff Management', `Updated: ${updated.name}`);
    notify(`Staff profile ${updated.name} updated.`, 'success');
  };

  const deleteStaff = async (id: string) => {
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/staff/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } catch (e) {
        notify("Failed to sync staff deletion with cloud", "error");
        return;
      }
    }

    setStaff(prev => prev.filter(u => u.id !== id));
    logAction('Staff Management', `Deleted staff ID: ${id}`);
    notify(`Staff access node revoked.`, 'success');
  };

  const addSession = async (session: SessionConfig) => {
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/sessions/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session })
        });
      } catch (e) {
        notify("Failed to sync session with cloud", "error");
        return;
      }
    }

    setSessions(prev => [...prev, session]);
    logAction('Configuration', `Added session: ${session.name}`);
    notify(`New academic session ${session.name} established.`, 'success');
  };

  const updateSettings = async (newSettings: SystemSettings) => {
    if (isDatabaseConnected) {
      try {
        await fetch('/api/supabase/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: newSettings })
        });
      } catch (e) {
        notify("Failed to sync settings with cloud", "error");
        return;
      }
    }

    setSettings(newSettings);
    logAction('Configuration', 'Updated system settings.');
    notify('System parameters updated.', 'success');
  };

  const backupDatabase = () => {
    const data = { students, settings, staff, auditLogs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DAS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    logAction('System', 'Full database backup generated.');
    notify('Institutional database backup generated successfully.', 'success');
  };

  const markActionAsReviewed = (id: string) => {
    setReviewedCriticalActions(prev => [...prev, id]);
  };

  const sendReminder = (id: string, item?: string) => {
    notify(`Reminder sent for ${item || 'action'} to student ${id}`, 'success');
    logAction('Notification', `Reminder sent for ${item || 'action'} to student ${id}`);
  };

  const setupDatabase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isDatabaseConnected) {
        await fetchInitialData();
        notify('Database synchronized successfully.', 'success');
      } else {
        throw new Error('Database configuration missing.');
      }
    } catch (err: any) {
      setError(err.message);
      notify(`Database Setup Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      students,
      degrees: ['M.Phil', 'PhD'],
      departments: [
        'Animal Breeding & Genetics', 
        'Animal Nutrition', 
        'Bioinformatics', 
        'Chemistry', 
        'Food Science and Technology', 
        'Livestock Management', 
        'Microbiology', 
        'Pathology', 
        'Pharmacology & Toxicology', 
        'Poultry Science', 
        'Biochemistry', 
        'Fisheries & Aquiculture', 
        'Zoology'
      ],
      programmes: [
        'M.Phil Animal Breeding & Genetics',
        'M.Phil Animal Nutrition',
        'M.Phil Bioinformatics',
        'M.Phil Chemistry',
        'M.Phil Food Science and Technology',
        'M.Phil Livestock Management',
        'M.Phil Microbiology',
        'M.Phil Pathology',
        'M.Phil Pharmacology & Toxicology',
        'M.Phil Poultry Science',
        'M.Phil Biochemistry',
        'M.Phil Fisheries & Aquiculture',
        'M.Phil Zoology',
        'PhD Animal Breeding & Genetics',
        'PhD Animal Nutrition',
        'PhD Pathology',
        'PhD Microbiology',
        'PhD Food Science and Technology',
        'PhD Pharmacology and Toxicology',
        'PhD Zoology'
      ],
      faculty: FACULTY_DATABASE,
      settings,
      auditLogs,
      staff,
      sessions,
      currentUser,
      notification,
      isDatabaseConnected,
      isLoading,
      error,
      reviewedCriticalActions,
      justLoggedIn,
      completePostLoginSession,
      notify,
      currentRole: currentUser ? { 
        id: 'r1', 
        roleName: currentUser.role, 
        canAdd: currentUser.role !== 'Read-Only User', 
        canEdit: currentUser.role !== 'Read-Only User' && currentUser.role !== 'Auditor', 
        canDelete: currentUser.role === 'System Administrator', 
        canBulkUpload: currentUser.role === 'System Administrator' || currentUser.role === 'DAS Coordinator', 
        canExport: true, 
        canViewAudit: currentUser.role === 'System Administrator' || currentUser.role === 'Auditor', 
        canLockRecords: currentUser.role === 'System Administrator' 
      } : null,
      login,
      logout,
      addStudent,
      bulkAddStudents,
      updateStudent,
      deleteStudent,
      bulkDeleteStudents,
      deleteAllStudents,
      toggleLockStudent,
      updateSettings,
      logAction,
      addStaff,
      updateStaff,
      deleteStaff,
      addSession,
      backupDatabase,
      markActionAsReviewed,
      sendReminder,
      setupDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useStore must be used within AppProvider");
  return context;
};
