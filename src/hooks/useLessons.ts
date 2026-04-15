"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export const useLessons = (courseId?: string) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLessons = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_reports')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      showError('Erro ao carregar aulas.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  return { lessons, loading, fetchLessons };
};