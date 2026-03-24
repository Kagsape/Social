"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';  // Fixed import path
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';