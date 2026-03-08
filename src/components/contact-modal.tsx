'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateContact, useUpdateContact } from '@/hooks/use-contacts';
import { useTags } from '@/hooks/use-tags';
import type { ContactWithTags, ContactInsert } from '@/types/database';

const STATUS_OPTIONS = ['lead', 'active', 'dormant', 'closed'] as const;

type Props = {
  contact?: ContactWithTags | null;
  onClose: () => void;
};

const inputStyle: React.CSSProperties = {
  height: 32,
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '0 10px',
  fontSize: 13,
  color: 'var(--fg)',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--fg-muted)',
  marginBottom: 4,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.4px',
};

export function ContactModal({ contact, onClose }: Props) {
  const isEdit = !!contact;
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const { data: allTags } = useTags();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    role: '',
    linkedin_url: '',
    source: '',
    status: 'active' as ContactInsert['status'],
    notes: '',
    follow_up_date: '',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (contact) {
      setForm({
        first_name: contact.first_name,
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company_name: contact.company_name || '',
        role: contact.role || '',
        linkedin_url: contact.linkedin_url || '',
        source: contact.source || '',
        status: contact.status,
        notes: contact.notes || '',
        follow_up_date: contact.follow_up_date || '',
      });
      setSelectedTags(contact.tags.map((t) => t.id));
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ContactInsert = {
      ...form,
      last_name: form.last_name || null,
      email: form.email || null,
      phone: form.phone || null,
      company_name: form.company_name || null,
      company_id: null,
      role: form.role || null,
      linkedin_url: form.linkedin_url || null,
      source: form.source || null,
      notes: form.notes || null,
      follow_up_date: form.follow_up_date || null,
      last_contacted_at: null,
    };

    if (isEdit) {
      await updateContact.mutateAsync({ id: contact!.id, contact: payload, tagIds: selectedTags });
    } else {
      await createContact.mutateAsync({ contact: payload, tagIds: selectedTags });
    }
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="w-full overflow-y-auto"
        style={{
          maxWidth: 440,
          maxHeight: '90vh',
          background: 'var(--bg)',
          borderRadius: 10,
          boxShadow: '0 25px 50px rgba(0,0,0,.15)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>
            {isEdit ? 'Edit contact' : 'New contact'}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded"
            style={{ width: 28, height: 28, color: 'var(--fg-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* First / Last */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>First Name *</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Company</label>
            <input
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Role</label>
            <input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Phone / Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <input
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                style={inputStyle}
                placeholder="Conference, Referral..."
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>LinkedIn URL</label>
            <input
              value={form.linkedin_url}
              onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              style={inputStyle}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContactInsert['status'] }))}
                style={{ ...inputStyle, appearance: 'auto' as never }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Follow-Up Date</label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {allTags && allTags.length > 0 && (
            <div>
              <label style={labelStyle}>Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="rounded-full"
                    style={{
                      height: 19,
                      padding: '0 8px',
                      fontSize: 10,
                      fontWeight: 500,
                      border: '1px solid var(--border)',
                      background: selectedTags.includes(tag.id) ? 'var(--bg-muted2)' : 'var(--bg-muted)',
                      color: selectedTags.includes(tag.id) ? 'var(--fg)' : 'var(--fg-muted)',
                    }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{
                ...inputStyle,
                height: 'auto',
                padding: '6px 10px',
                resize: 'none',
              }}
            />
          </div>

          {/* Footer */}
          <div
            className="flex justify-end gap-2 pt-3"
            style={{ borderTop: '1px solid var(--border)', marginTop: 12 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="rounded-md text-[13px] font-medium"
              style={{
                height: 32,
                padding: '0 14px',
                border: '1px solid var(--border-med)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createContact.isPending || updateContact.isPending}
              className="rounded-md text-[13px] font-medium disabled:opacity-50"
              style={{
                height: 32,
                padding: '0 14px',
                background: 'var(--fg)',
                color: 'var(--bg)',
              }}
            >
              {createContact.isPending || updateContact.isPending
                ? 'Saving...'
                : isEdit
                ? 'Update contact'
                : 'Add contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
