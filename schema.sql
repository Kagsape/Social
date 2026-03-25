-- Create users table (profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  avatar_url TEXT,
  student_id TEXT,
  teacher_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- Enable RLS for likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Enable RLS for enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create lab_computers table
CREATE TABLE IF NOT EXISTS public.lab_computers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'working',
  specs JSONB,
  last_maintained TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for lab_computers
ALTER TABLE public.lab_computers ENABLE ROW LEVEL SECURITY;

-- Create lab_usage table
CREATE TABLE IF NOT EXISTS public.lab_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  computer_id UUID REFERENCES public.lab_computers(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for lab_usage
ALTER TABLE public.lab_usage ENABLE ROW LEVEL SECURITY;

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  assignment_name TEXT NOT NULL,
  grade NUMERIC NOT NULL,
  max_grade NUMERIC DEFAULT 100,
  comments TEXT,
  teacher_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, assignment_name)
);

-- Enable RLS for grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for users
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policies for posts
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy" ON public.posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
CREATE POLICY "posts_insert_policy" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
CREATE POLICY "posts_delete_policy" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Policies for likes
DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
CREATE POLICY "likes_select_policy" ON public.likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
CREATE POLICY "likes_insert_policy" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "likes_delete_policy" ON public.likes;
CREATE POLICY "likes_delete_policy" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for courses
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "courses_all_admin_policy" ON public.courses;
CREATE POLICY "courses_all_admin_policy" ON public.courses FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Policies for enrollments
DROP POLICY IF EXISTS "enrollments_select_policy" ON public.enrollments;
CREATE POLICY "enrollments_select_policy" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));
DROP POLICY IF EXISTS "enrollments_insert_policy" ON public.enrollments;
CREATE POLICY "enrollments_insert_policy" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Policies for lab_computers
DROP POLICY IF EXISTS "lab_computers_select_policy" ON public.lab_computers;
CREATE POLICY "lab_computers_select_policy" ON public.lab_computers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lab_computers_all_admin_policy" ON public.lab_computers;
CREATE POLICY "lab_computers_all_admin_policy" ON public.lab_computers FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Policies for lab_usage
DROP POLICY IF EXISTS "lab_usage_select_policy" ON public.lab_usage;
CREATE POLICY "lab_usage_select_policy" ON public.lab_usage FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lab_usage_all_policy" ON public.lab_usage;
CREATE POLICY "lab_usage_all_policy" ON public.lab_usage FOR ALL TO authenticated USING (auth.uid() = teacher_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Policies for attendance
DROP POLICY IF EXISTS "attendance_all_teacher_policy" ON public.attendance;
CREATE POLICY "attendance_all_teacher_policy" ON public.attendance FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));
DROP POLICY IF EXISTS "attendance_select_student_policy" ON public.attendance;
CREATE POLICY "attendance_select_student_policy" ON public.attendance FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Policies for grades
DROP POLICY IF EXISTS "grades_all_teacher_policy" ON public.grades;
CREATE POLICY "grades_all_teacher_policy" ON public.grades FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));
DROP POLICY IF EXISTS "grades_select_student_policy" ON public.grades;
CREATE POLICY "grades_select_student_policy" ON public.grades FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Policies for announcements
DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
CREATE POLICY "announcements_select_policy" ON public.announcements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "announcements_all_teacher_policy" ON public.announcements;
CREATE POLICY "announcements_all_teacher_policy" ON public.announcements FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));

-- Policies for notifications
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();