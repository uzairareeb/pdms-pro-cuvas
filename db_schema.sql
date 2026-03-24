
-- Postgraduate Data Management System (PDMS)
-- Directorate of Advanced Studies
-- MySQL Database Schema

CREATE DATABASE IF NOT EXISTS das_pdms;
USE das_pdms;

-- 1. Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions table
CREATE TABLE IF NOT EXISTS academic_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(50) NOT NULL UNIQUE, -- e.g. Spring 2026
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students table with all requested fields
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sr_no VARCHAR(20),
    cnic VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    reg_no VARCHAR(50) UNIQUE,
    gender ENUM('Male', 'Female', 'Other'),
    supervisor_name VARCHAR(100),
    current_semester INT DEFAULT 1,
    degree ENUM('MPhil', 'PhD') NOT NULL,
    session_id INT,
    department VARCHAR(100),
    status ENUM('Active', 'Completed', 'Dropped') DEFAULT 'Active',
    supervisory_committee TEXT,
    gs2_course_work TEXT,
    synopsis TEXT,
    gs4_form TEXT,
    gs1_missing_semesters VARCHAR(50),
    contact_number VARCHAR(20),
    thesis_id VARCHAR(50),
    semi_final_thesis_date DATE,
    synopsis_submission_date DATE,
    thesis_sent_to_coe DATE,
    validation VARCHAR(100) DEFAULT 'Valid',
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id)
);

-- 4. Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('Pending', 'Completed', 'Overdue') DEFAULT 'Pending',
    completion_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 5. Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    institution_name VARCHAR(255),
    directorate_name VARCHAR(255),
    directorate_head VARCHAR(255),
    official_email VARCHAR(100),
    mandatory_gs_forms BOOLEAN DEFAULT TRUE,
    default_semester_duration_weeks INT DEFAULT 18
);

-- Insert Initial Admin (Password: admin123)
-- In real PHP implementation, use password_hash()
INSERT INTO users (username, password, role) VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert Initial Settings
INSERT INTO system_settings (institution_name, directorate_name, directorate_head, official_email) 
VALUES ('Example University', 'Directorate of Advanced Studies', 'Prof. Dr. Admin', 'das@example.edu');
