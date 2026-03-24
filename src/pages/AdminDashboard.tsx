"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Monitor, Calendar, Plus, Settings, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';  // Fixed import path
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import LabComputerCard from '@/components/LabComputerCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";