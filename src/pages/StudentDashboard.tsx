"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Monitor, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';  // Fixed import path
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import LabComputerCard from '@/components/LabComputerCard';
import ComputerReservationForm from '@/components/ComputerReservationForm';
import NotificationBell from '@/components/NotificationBell';