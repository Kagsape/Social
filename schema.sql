-- Garantindo RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Adicionando campos extras ao perfil
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;

-- POLÍTICAS PARA USERS
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS PARA COURSES
CREATE POLICY "Courses are viewable by everyone" ON courses FOR SELECT USING (true);
CREATE POLICY "Only admins can manage courses" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- POLÍTICAS PARA ENROLLMENTS
CREATE POLICY "Students can view their own enrollments" ON enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view enrollments for their courses" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid())
);
CREATE POLICY "Admins can manage all enrollments" ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- POLÍTICAS PARA LAB_COMPUTERS
CREATE POLICY "Lab computers are viewable by everyone" ON lab_computers FOR SELECT USING (true);
CREATE POLICY "Only admins can manage lab computers" ON lab_computers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- POLÍTICAS PARA LAB_USAGE
CREATE POLICY "Users can view all lab usage" ON lab_usage FOR SELECT USING (true);
CREATE POLICY "Teachers and admins can manage lab usage" ON lab_usage FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'teacher'))
);

-- POLÍTICAS PARA ATTENDANCE E GRADES
CREATE POLICY "Teachers can manage attendance/grades" ON attendance FOR ALL USING (recorded_by = auth.uid());
CREATE POLICY "Teachers can manage grades" ON grades FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students can view their own attendance/grades" ON attendance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can view their own grades" ON grades FOR SELECT USING (student_id = auth.uid());