-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  student_id TEXT UNIQUE,
  teacher_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Students in Courses (many-to-many)
CREATE TABLE course_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  assignment_name TEXT NOT NULL,
  grade DECIMAL(5,2),
  max_grade DECIMAL(5,2) DEFAULT 100,
  comments TEXT,
  graded_at TIMESTAMP DEFAULT NOW(),
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(student_id, course_id, assignment_name)
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Lab Computers
CREATE TABLE lab_computers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('working', 'broken', 'maintenance')),
  specs JSONB,
  location TEXT,
  last_maintained DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lab Usage Schedule
CREATE TABLE lab_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id UUID REFERENCES lab_computers(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lab Rules
CREATE TABLE lab_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course Materials
CREATE TABLE course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('document', 'video', 'link', 'code')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_course ON grades(course_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_announcements_course ON announcements(course_id);
CREATE INDEX idx_lab_usage_computer ON lab_usage(computer_id);
CREATE INDEX idx_lab_usage_course ON lab_usage(course_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);