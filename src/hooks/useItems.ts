import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Item, ItemFilters } from '../types';

const PAGE_SIZE = 12;

export function useItems(filters: ItemFilters = {}, page = 1) {
  return useQuery({
    queryKey: ['items', filters, page],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, full_name, email, avatar_url)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (filters.type) query = query.eq('type', filters.type);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.status) query = query.eq('status', filters.status);
      else query = query.eq('status', 'active');
      if (filters.location) query = query.ilike('location', `%${filters.location}%`);
      if (filters.dateFrom) query = query.gte('date_occurred', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date_occurred', filters.dateTo);
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { items: (data ?? []) as Item[], total: count ?? 0 };
    },
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, full_name, email, avatar_url, student_id, phone)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Item;
    },
    enabled: !!id,
  });
}

export function useMyItems(userId: string | undefined) {
  return useQuery({
    queryKey: ['myItems', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
    enabled: !!userId,
  });
}

export function useRecentItems() {
  return useQuery({
    queryKey: ['recentItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, full_name, avatar_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
}

export function useItemStats() {
  return useQuery({
    queryKey: ['itemStats'],
    queryFn: async () => {
      const [lostRes, foundRes, resolvedRes] = await Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('type', 'lost'),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('type', 'found'),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      ]);
      return {
        totalLost: lostRes.count ?? 0,
        totalFound: foundRes.count ?? 0,
        totalResolved: resolvedRes.count ?? 0,
      };
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'profiles'>) => {
      const { data, error } = await supabase.from('items').insert(item).select().single();
      if (error) throw error;
      return data as Item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      queryClient.invalidateQueries({ queryKey: ['itemStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentItems'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Item> }) => {
      const { data, error } = await supabase
        .from('items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Item;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      queryClient.invalidateQueries({ queryKey: ['itemStats'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      queryClient.invalidateQueries({ queryKey: ['itemStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentItems'] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('item-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      return fileName;
    },
  });
}

export function useAllItems() {
  return useQuery({
    queryKey: ['allItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
}
