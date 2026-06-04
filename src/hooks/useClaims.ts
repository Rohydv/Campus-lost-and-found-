import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Claim } from '../types';

export function useMyClaims(userId: string | undefined) {
  return useQuery({
    queryKey: ['claims', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('*, items(id, title, type, status), profiles(id, full_name, email)')
        .eq('claimant_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Claim[];
    },
    enabled: !!userId,
  });
}

export function useItemClaims(itemId: string) {
  return useQuery({
    queryKey: ['itemClaims', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('*, profiles(id, full_name, email, student_id, phone)')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Claim[];
    },
    enabled: !!itemId,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claim: {
      item_id: string;
      claimant_id: string;
      message: string;
    }) => {
      const { data, error } = await supabase
        .from('claims')
        .insert({ ...claim, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data as Claim;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['itemClaims', variables.item_id] });
    },
  });
}

export function useUpdateClaimStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('claims')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['itemClaims'] });
    },
  });
}

export function useAllClaims() {
  return useQuery({
    queryKey: ['allClaims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('*, items(id, title, type, status), profiles(id, full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Claim[];
    },
  });
}

export function useDeleteClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('claims').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['allClaims'] });
      queryClient.invalidateQueries({ queryKey: ['itemClaims'] });
    },
  });
}
