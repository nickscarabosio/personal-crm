import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Interaction, Contact } from '@/types/database';

export type InteractionWithContact = Interaction & {
  contact_name: string;
  contact_id: string;
};

export function useAllInteractions(limit = 50) {
  return useQuery({
    queryKey: ['all-interactions', limit],
    queryFn: async (): Promise<InteractionWithContact[]> => {
      const { data: interactions, error } = await supabase
        .from('interactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;

      const typed = interactions as Interaction[];
      if (typed.length === 0) return [];

      // Get unique contact IDs
      const contactIds = [...new Set(typed.map((i) => i.contact_id))];
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', contactIds);

      const contactMap: Record<string, string> = {};
      for (const c of (contacts || []) as Contact[]) {
        contactMap[c.id] = `${c.first_name} ${c.last_name || ''}`.trim();
      }

      return typed.map((i) => ({
        ...i,
        contact_name: contactMap[i.contact_id] || 'Unknown',
      }));
    },
  });
}

export function useRecentInteractions(limit = 5) {
  return useAllInteractions(limit);
}
