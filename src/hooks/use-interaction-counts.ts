import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Fetches the count of interactions in the last 90 days for all contacts.
 * Returns a map of contact_id -> count.
 */
export function useInteractionCounts() {
  return useQuery({
    queryKey: ['interaction-counts-90d'],
    queryFn: async (): Promise<Record<string, number>> => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from('interactions')
        .select('contact_id, id')
        .gte('date', ninetyDaysAgo.toISOString());

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const cid = (row as { contact_id: string }).contact_id;
        counts[cid] = (counts[cid] || 0) + 1;
      }
      return counts;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
