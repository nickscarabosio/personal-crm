import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Milestone, MilestoneInsert } from '@/types/database';

export function useMilestones(contactId: string) {
  return useQuery({
    queryKey: ['milestones', contactId],
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('contact_id', contactId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!contactId,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (milestone: MilestoneInsert) => {
      const { data, error } = await supabase
        .from('milestones')
        .insert(milestone)
        .select()
        .single();
      if (error) throw error;
      return data as Milestone;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['milestones', vars.contact_id] });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contactId,
      update,
    }: {
      id: string;
      contactId: string;
      update: Partial<MilestoneInsert> & { completed_at?: string | null };
    }) => {
      const { error } = await supabase
        .from('milestones')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { contactId }) => {
      qc.invalidateQueries({ queryKey: ['milestones', contactId] });
    },
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contactId }: { id: string; contactId: string }) => {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { contactId }) => {
      qc.invalidateQueries({ queryKey: ['milestones', contactId] });
    },
  });
}
