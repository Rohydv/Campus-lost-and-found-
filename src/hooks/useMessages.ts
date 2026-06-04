import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export function useMessages(userId: string | undefined) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(
          '*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, email), receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url, email), items(id, title, type)'
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!userId,
  });
}

export function useItemMessages(itemId: string) {
  return useQuery({
    queryKey: ['itemMessages', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(
          '*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, email)'
        )
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!itemId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: {
      item_id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ ...message, is_read: false })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (_, variables: { item_id: string; sender_id: string; receiver_id: string; content: string }) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['itemMessages', variables.item_id] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['unreadCount', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId!)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}
