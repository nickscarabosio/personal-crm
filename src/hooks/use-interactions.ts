import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { InteractionInsert } from '@/types/database';

export function useInteractions(contactId: string) {
  return useQuery({
    queryKey: ['interactions', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (interaction: InteractionInsert) => {
      const { data, error } = await supabase
        .from('interactions')
        .insert(interaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['interactions', variables.contact_id] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', variables.contact_id] });
    },
  });
}
