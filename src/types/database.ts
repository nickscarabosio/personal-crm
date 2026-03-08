export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: Contact;
        Insert: ContactInsert;
        Update: ContactUpdate;
      };
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
      };
      tags: {
        Row: Tag;
        Insert: TagInsert;
        Update: TagUpdate;
      };
      contact_tags: {
        Row: ContactTag;
        Insert: ContactTag;
        Update: ContactTag;
      };
      interactions: {
        Row: Interaction;
        Insert: InteractionInsert;
        Update: InteractionUpdate;
      };
    };
  };
};

export type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  company_name: string | null;
  role: string | null;
  linkedin_url: string | null;
  source: string | null;
  status: 'lead' | 'active' | 'dormant' | 'closed';
  notes: string | null;
  last_contacted_at: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContactUpdate = Partial<ContactInsert>;

export type ContactWithTags = Contact & {
  tags: Tag[];
};

export type Company = {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type CompanyUpdate = Partial<CompanyInsert>;

export type Tag = {
  id: string;
  label: string;
  color: string;
  created_at: string;
};

export type TagInsert = Omit<Tag, 'id' | 'created_at'> & { id?: string };
export type TagUpdate = Partial<TagInsert>;

export type ContactTag = {
  contact_id: string;
  tag_id: string;
};

export type Interaction = {
  id: string;
  contact_id: string;
  type: 'call' | 'email' | 'meeting' | 'dm' | 'note' | 'linkedin' | 'other';
  date: string;
  summary: string | null;
  outcome: string | null;
  follow_up_date: string | null;
  created_at: string;
};

export type InteractionInsert = Omit<Interaction, 'id' | 'created_at'> & {
  id?: string;
};

export type InteractionUpdate = Partial<InteractionInsert>;
