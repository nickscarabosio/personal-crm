'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateCompany, useUpdateCompany } from '@/hooks/use-companies';
import type { Company, CompanyInsert } from '@/types/database';

type Props = {
  company?: Company | null;
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

export function CompanyModal({ company, onClose }: Props) {
  const isEdit = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const [form, setForm] = useState({
    name: '',
    industry: '',
    size: '',
    website: '',
    notes: '',
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        industry: company.industry || '',
        size: company.size || '',
        website: company.website || '',
        notes: company.notes || '',
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CompanyInsert = {
      name: form.name,
      industry: form.industry || null,
      size: form.size || null,
      website: form.website || null,
      notes: form.notes || null,
    };

    if (isEdit) {
      await updateCompany.mutateAsync({ id: company!.id, company: payload });
    } else {
      await createCompany.mutateAsync(payload);
    }
    onClose();
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
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>
            {isEdit ? 'Edit company' : 'New company'}
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
          <div>
            <label style={labelStyle}>Company Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Industry</label>
            <input
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              style={inputStyle}
              placeholder="Technology, Finance..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Size</label>
              <input
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                style={inputStyle}
                placeholder="1-10, 50-200..."
              />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
          </div>
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
              disabled={createCompany.isPending || updateCompany.isPending}
              className="rounded-md text-[13px] font-medium disabled:opacity-50"
              style={{
                height: 32,
                padding: '0 14px',
                background: 'var(--fg)',
                color: 'var(--bg)',
              }}
            >
              {createCompany.isPending || updateCompany.isPending
                ? 'Saving...'
                : isEdit
                ? 'Update'
                : 'Add company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
