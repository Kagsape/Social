"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Monitor, Calendar, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';  // Fixed import path
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';