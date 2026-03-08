import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Contact, ContactInsert, ContactUpdate, ContactWithTags, Tag } from '@/types/database';

export function useContacts(filters?: {
  status?: string;
  search?: string;
  tagId?: string;
  followUpOnly?: boolean;
}) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: async (): Promise<ContactWithTags[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('contacts')
        .select('*')
        .order('last_contacted_at', { ascending: false, nullsFirst: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        const s = `%${filters.search}%`;
        query = query.or(
          `first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s},company_name.ilike.${s}`
        );
      }

      if (filters?.followUpOnly) {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        query = query
          .not('follow_up_date', 'is', null)
          .lte('follow_up_date', weekFromNow.toISOString().split('T')[0])
          .order('follow_up_date', { ascending: true });
      }

      const { data: rawContacts, error } = await query;
      if (error) throw error;
      const contacts = rawContacts as Contact[];

      // Fetch tags for all contacts
      const contactIds = contacts.map((c) => c.id);
      if (contactIds.length === 0) return [];

      const { data: contactTags } = await supabase
        .from('contact_tags')
        .select('contact_id, tag_id')
        .in('contact_id', contactIds);

      const tagIds = [...new Set((contactTags || []).map((ct) => ct.tag_id))];

      let tagsMap: Record<string, Tag> = {};
      if (tagIds.length > 0) {
        const { data: tags } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds);
        tagsMap = Object.fromEntries((tags || []).map((t) => [t.id, t]));
      }

      // Filter by tag if needed
      const contactTagMap: Record<string, Tag[]> = {};
      for (const ct of contactTags || []) {
        if (!contactTagMap[ct.contact_id]) contactTagMap[ct.contact_id] = [];
        if (tagsMap[ct.tag_id]) contactTagMap[ct.contact_id].push(tagsMap[ct.tag_id]);
      }

      let result = contacts.map((c) => ({
        ...c,
        tags: contactTagMap[c.id] || [],
      }));

      if (filters?.tagId) {
        result = result.filter((c) => c.tags.some((t) => t.id === filters.tagId));
      }

      return result;
    },
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      const { data: contactTags } = await supabase
        .from('contact_tags')
        .select('tag_id')
        .eq('contact_id', id);

      const tagIds = (contactTags || []).map((ct) => ct.tag_id);
      let tags: Tag[] = [];
      if (tagIds.length > 0) {
        const { data: tagsData } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds);
        tags = tagsData || [];
      }

      return { ...data, tags } as ContactWithTags;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contact,
      tagIds,
    }: {
      contact: ContactInsert;
      tagIds?: string[];
    }) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();
      if (error) throw error;

      if (tagIds && tagIds.length > 0) {
        await supabase
          .from('contact_tags')
          .insert(tagIds.map((tagId) => ({ contact_id: data.id, tag_id: tagId })));
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contact,
      tagIds,
    }: {
      id: string;
      contact: ContactUpdate;
      tagIds?: string[];
    }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (tagIds !== undefined) {
        await supabase.from('contact_tags').delete().eq('contact_id', id);
        if (tagIds.length > 0) {
          await supabase
            .from('contact_tags')
            .insert(tagIds.map((tagId) => ({ contact_id: id, tag_id: tagId })));
        }
      }

      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
