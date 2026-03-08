'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateInteraction } from '@/hooks/use-interactions';

const TYPES = ['call', 'email', 'meeting', 'dm', 'note', 'linkedin', 'other'] as const;

type Props = {
  contactId: string;
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

export function InteractionModal({ contactId, onClose }: Props) {
  const createInteraction = useCreateInteraction();
  const [form, setForm] = useState({
    type: 'note' as (typeof TYPES)[number],
    date: new Date().toISOString().slice(0, 16),
    summary: '',
    outcome: '',
    follow_up_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInteraction.mutateAsync({
      contact_id: contactId,
      type: form.type,
      date: new Date(form.date).toISOString(),
      summary: form.summary || null,
      outcome: form.outcome || null,
      follow_up_date: form.follow_up_date || null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 440,
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
            Log interaction
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as (typeof TYPES)[number] }))}
                style={{ ...inputStyle, appearance: 'auto' as never }}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Summary</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              rows={3}
              style={{
                ...inputStyle,
                height: 'auto',
                padding: '6px 10px',
                resize: 'none',
              }}
              placeholder="What happened?"
            />
          </div>
          <div>
            <label style={labelStyle}>Outcome</label>
            <input
              value={form.outcome}
              onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
              style={inputStyle}
              placeholder="Result or next step"
            />
          </div>
          <div>
            <label style={labelStyle}>Set Follow-Up</label>
            <input
              type="date"
              value={form.follow_up_date}
              onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
              style={inputStyle}
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
              disabled={createInteraction.isPending}
              className="rounded-md text-[13px] font-medium disabled:opacity-50"
              style={{
                height: 32,
                padding: '0 14px',
                background: 'var(--fg)',
                color: 'var(--bg)',
              }}
            >
              {createInteraction.isPending ? 'Saving...' : 'Log it'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
