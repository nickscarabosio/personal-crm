import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Company, CompanyInsert, CompanyUpdate, Contact } from '@/types/database';

export type CompanyWithStats = Company & {
  contact_count: number;
  last_touch: string | null;
};

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<CompanyWithStats[]> => {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      if (error) throw error;

      const typed = companies as Company[];
      if (typed.length === 0) return [];

      // Get contacts grouped by company_id
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, company_id, last_contacted_at')
        .not('company_id', 'is', null);

      const contactsByCompany: Record<string, { count: number; lastTouch: string | null }> = {};
      for (const c of (contacts || []) as Pick<Contact, 'id' | 'company_id' | 'last_contacted_at'>[]) {
        if (!c.company_id) continue;
        if (!contactsByCompany[c.company_id]) {
          contactsByCompany[c.company_id] = { count: 0, lastTouch: null };
        }
        contactsByCompany[c.company_id].count++;
        if (c.last_contacted_at) {
          if (!contactsByCompany[c.company_id].lastTouch || c.last_contacted_at > contactsByCompany[c.company_id].lastTouch!) {
            contactsByCompany[c.company_id].lastTouch = c.last_contacted_at;
          }
        }
      }

      return typed.map((company) => ({
        ...company,
        contact_count: contactsByCompany[company.id]?.count || 0,
        last_touch: contactsByCompany[company.id]?.lastTouch || null,
      }));
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Company;
    },
    enabled: !!id,
  });
}

export function useCompanyContacts(companyId: string) {
  return useQuery({
    queryKey: ['company-contacts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('first_name');
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (company: CompanyInsert) => {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, company }: { id: string; company: CompanyUpdate }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['company', id] });
    },
  });
}
