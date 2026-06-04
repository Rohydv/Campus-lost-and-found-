import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Complaint } from '../types';

export function useMyComplaints(userId: string | undefined) {
  return useQuery({
    queryKey: ['myComplaints', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, items(id, title, type)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Complaint[];
    },
    enabled: !!userId,
  });
}

export function useAllComplaints() {
  return useQuery({
    queryKey: ['allComplaints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, items(id, title, type), profiles(id, full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Complaint[];
    },
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (complaint: {
      user_id: string;
      item_id?: string | null;
      title: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('complaints')
        .insert({ ...complaint, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data as Complaint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['allComplaints'] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'resolved' }) => {
      const { data, error } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Complaint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['allComplaints'] });
    },
  });
}

export function useDeleteComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['allComplaints'] });
    },
  });
}
