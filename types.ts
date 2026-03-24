export enum StudentStatus {
  ACTIVE = 'Active',
  ON_LEAVE = 'On Leave',
  CLOSED = 'Closed',
  COMPLETED = 'Completed',
  DROPPED = 'Dropped',
  SUSPENDED = 'Suspended'
}

export enum ValidationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  RETURNED = 'Returned'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female'
}

export interface Student {
  id: string;
  srNo: string;
  cnic: string;
  name: string;
  fatherName: string;
  regNo: string;
  gender: Gender;
  contactNumber: string;
  degree: string;
  session: string;
  department: string;
  programme: string;
  currentSemester: number;
  status: StudentStatus;
  
  supervisorName: string;
  coSupervisor?: string;
  member1?: string;
  member2?: string;
  
  thesisId: string;
  synopsis: 'Not Submitted' | 'Submitted' | 'Approved';
  synopsisSubmissionDate: string;
  gs2CourseWork: 'Not Completed' | 'Completed';
  gs4Form: 'Not Submitted' | 'Submitted' | 'Approved';
  
  semiFinalThesisStatus: 'Not Submitted' | 'Submitted' | 'Approved';
  semiFinalThesisSubmissionDate: string;
  finalThesisStatus: 'Not Submitted' | 'Submitted' | 'Approved';
  finalThesisSubmissionDate: string;
  thesisSentToCOE: 'No' | 'Yes';
  coeSubmissionDate: string;
  validationStatus: ValidationStatus;
  validationDate: string;
  comments: string;
  
  isLocked: boolean;
}

export interface StaffUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'System Administrator' | 'DAS Coordinator' | 'DAS Officer' | 'Data Entry Operator' | 'Auditor' | 'Read-Only User';
  lastLogin?: string;
}

export interface RolePermissions {
  id: string;
  roleName: string;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canBulkUpload: boolean;
  canExport: boolean;
  canViewAudit: boolean;
  canLockRecords: boolean;
}

export interface SystemSettings {
  institution: {
    name: string;
    directorate: string;
    systemName: string;
    email: string;
    contact: string;
    academicYear: string;
    admissionSession: string;
    logo?: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableRecordLocking: boolean;
    enableDeletion: boolean;
  };
  maintenance: {
    version: string;
    lastBackup: string;
  };
  milestones: {
    gs2: { enabled: boolean };
    synopsis: { enabled: boolean };
    gs4: { enabled: boolean };
    semiFinal: { enabled: boolean };
    final: { enabled: boolean };
    coe: { enabled: boolean };
  };
  databases: {
    supabase: { url: string; key: string };
  };
  defaultSemesterDurationWeeks: number;
}

export interface SemesterInfo {
  number: number;
  start: string;
  end: string;
}

export interface SessionConfig {
  id: string;
  name: string;
  startDate: string;
  semesters: SemesterInfo[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}