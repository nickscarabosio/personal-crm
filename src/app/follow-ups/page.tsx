'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, isPast, isToday, addDays, addMonths, nextMonday } from 'date-fns';
import { Shell } from '@/components/shell';
import { useContacts, useUpdateContact } from '@/hooks/use-contacts';
import type { ContactWithTags } from '@/types/database';

const AVATAR_COLORS = ['#3f3f46', '#52525b', '#71717a', '#27272a', '#18181b'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first: string, last?: string | null) {
  return (first[0] + (last?.[0] || '')).toUpperCase();
}

function SnoozePicker({ contact, onSnooze }: { contact: ContactWithTags; onSnooze: (date: Date) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const options = [
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'In 3 Days', date: addDays(new Date(), 3) },
    { label: 'Next Week', date: nextMonday(new Date()) },
    { label: 'Next Month', date: addMonths(new Date(), 1) },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-medium"
        style={{ color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
      >
        Snooze
      </button>
      {open && (
        <div
          className="absolute right-0 bottom-full mb-1 z-20"
          style={{
            width: 160,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,.12)',
            overflow: 'hidden',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { onSnooze(opt.date); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[12px]"
              style={{ color: 'var(--fg)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {opt.label}
              <span className="ml-2 text-[10px]" style={{ color: 'var(--fg-faint)' }}>
                {format(opt.date, 'MMM d')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  contact,
  accentColor,
  onDone,
  onSnooze,
}: {
  contact: ContactWithTags;
  accentColor: string;
  onDone: () => void;
  onSnooze: (date: Date) => void;
}) {
  const router = useRouter();
  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
  const context = [contact.role, contact.company_name].filter(Boolean).join(' · ');
  const dueDate = contact.follow_up_date
    ? isPast(new Date(contact.follow_up_date + 'T00:00:00')) && !isToday(new Date(contact.follow_up_date + 'T00:00:00'))
      ? `Overdue · ${format(new Date(contact.follow_up_date + 'T00:00:00'), 'MMM d')}`
      : isToday(new Date(contact.follow_up_date + 'T00:00:00'))
      ? 'Due today'
      : format(new Date(contact.follow_up_date + 'T00:00:00'), 'MMM d')
    : '';

  return (
    <div
      onClick={() => router.push(`/contacts/${contact.id}`)}
      className="cursor-pointer"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accentColor}`,
        background: 'var(--bg)',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        marginBottom: 8,
        transition: 'box-shadow 150ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'; }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="shrink-0 flex items-center justify-center rounded-full text-[9px] font-medium mt-0.5"
          style={{ width: 26, height: 26, background: getAvatarColor(fullName), color: '#fafafa' }}
        >
          {getInitials(contact.first_name, contact.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] font-medium truncate" style={{ color: 'var(--fg)' }}>
              {fullName}
            </div>
            {contact.follow_up_type && (
              <span
                className="text-[9px] font-medium uppercase shrink-0 rounded"
                style={{ padding: '1px 5px', border: '1px solid var(--border)', color: 'var(--fg-muted)' }}
              >
                {contact.follow_up_type}
              </span>
            )}
          </div>
          {context && (
            <div className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>{context}</div>
          )}
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--fg-faint)' }}>{dueDate}</div>
          {contact.follow_up_note && (
            <div
              className="text-[11px] mt-1 rounded"
              style={{ padding: '4px 6px', background: 'var(--bg-subtle)', color: 'var(--fg-muted)', fontStyle: 'italic' }}
            >
              {contact.follow_up_note}
            </div>
          )}
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-end gap-1 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onDone}
          className="text-[11px] font-medium rounded"
          style={{
            height: 24,
            padding: '0 10px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg)',
            cursor: 'pointer',
          }}
        >
          ✓ Done
        </button>
        <SnoozePicker contact={contact} onSnooze={onSnooze} />
      </div>
    </div>
  );
}

function Column({
  title,
  count,
  accentColor,
  children,
}: {
  title: string;
  count: number;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 280,
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        maxHeight: '100%',
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: accentColor }} />
          <span className="text-[12px] font-semibold" style={{ color: 'var(--fg)' }}>{title}</span>
        </div>
        <span
          className="text-[11px] font-medium rounded-full flex items-center justify-center"
          style={{
            minWidth: 22,
            height: 22,
            padding: '0 6px',
            background: 'var(--bg-muted)',
            color: 'var(--fg-muted)',
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {children}
      </div>
    </div>
  );
}

export default function FollowUps() {
  const router = useRouter();
  const { data: contacts, isLoading } = useContacts({ followUpOnly: true });
  const { data: allContacts } = useContacts({});
  const updateContact = useUpdateContact();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date + 'T00:00:00')) || isToday(new Date(c.follow_up_date + 'T00:00:00')))
    ).length;
  }, [allContacts]);

  const overdue = useMemo(
    () => contacts?.filter((c) =>
      c.follow_up_date && isPast(new Date(c.follow_up_date + 'T00:00:00')) && !isToday(new Date(c.follow_up_date + 'T00:00:00')) && !dismissed.has(c.id)
    ) || [],
    [contacts, dismissed]
  );
  const today = useMemo(
    () => contacts?.filter((c) =>
      c.follow_up_date && isToday(new Date(c.follow_up_date + 'T00:00:00')) && !dismissed.has(c.id)
    ) || [],
    [contacts, dismissed]
  );
  const upcoming = useMemo(
    () => contacts?.filter((c) =>
      c.follow_up_date && !isPast(new Date(c.follow_up_date + 'T00:00:00')) && !isToday(new Date(c.follow_up_date + 'T00:00:00')) && !dismissed.has(c.id)
    ) || [],
    [contacts, dismissed]
  );

  const handleDone = useCallback(async (c: ContactWithTags) => {
    setDismissed((prev) => new Set(prev).add(c.id));
    await updateContact.mutateAsync({ id: c.id, contact: { follow_up_date: null, follow_up_type: null, follow_up_note: null } });
  }, [updateContact]);

  const handleSnooze = useCallback(async (c: ContactWithTags, date: Date) => {
    await updateContact.mutateAsync({ id: c.id, contact: { follow_up_date: date.toISOString().split('T')[0] } });
  }, [updateContact]);

  const tabTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'people', label: 'People', badge: allContacts?.length || 0 },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'follow-up', label: 'Follow-Up', badge: followUpCount, alert: followUpCount > 0 },
    { key: 'companies', label: 'Companies' },
    { key: 'activity', label: 'Activity' },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'people') router.push('/');
    if (key === 'dashboard') router.push('/dashboard');
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  return (
    <Shell tabs={tabTabs} activeTab="follow-up" onTabChange={handleTabChange} showFollowUpDot={followUpCount > 0}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
        {/* Header */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>Follow-Ups</h1>
              <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                {(contacts || []).filter((c) => !dismissed.has(c.id)).length} total
                {overdue.length > 0 && <span style={{ color: '#ef4444' }}> · {overdue.length} overdue</span>}
              </div>
            </div>
            {/* Stats pills */}
            <div className="flex gap-2">
              <div
                className="flex items-center gap-1.5 rounded-full"
                style={{ padding: '4px 10px', background: 'var(--bg-muted)', fontSize: 12, fontWeight: 500 }}
              >
                <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: '#ef4444' }} />
                <span style={{ color: 'var(--fg)' }}>{overdue.length}</span>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-full"
                style={{ padding: '4px 10px', background: 'var(--bg-muted)', fontSize: 12, fontWeight: 500 }}
              >
                <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: '#ca8a04' }} />
                <span style={{ color: 'var(--fg)' }}>{today.length}</span>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-full"
                style={{ padding: '4px 10px', background: 'var(--bg-muted)', fontSize: 12, fontWeight: 500 }}
              >
                <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: '#22c55e' }} />
                <span style={{ color: 'var(--fg)' }}>{upcoming.length}</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>Loading...</div>
        ) : !contacts || contacts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: 'var(--fg-faint)' }}>
              <div className="text-[32px] mb-2">✓</div>
              <div className="text-[14px] font-medium">All caught up</div>
              <div className="text-[12px] mt-1">No follow-ups scheduled</div>
            </div>
          </div>
        ) : (
          /* Board columns */
          <div className="flex gap-3 px-4 py-3 overflow-x-auto" style={{ flex: 1, alignItems: 'stretch' }}>
            <Column title="Overdue" count={overdue.length} accentColor="#ef4444">
              {overdue.length === 0 ? (
                <div className="text-[11px] text-center py-6" style={{ color: 'var(--fg-faint)' }}>None overdue</div>
              ) : (
                overdue.map((c) => (
                  <TaskCard key={c.id} contact={c} accentColor="#ef4444" onDone={() => handleDone(c)} onSnooze={(d) => handleSnooze(c, d)} />
                ))
              )}
            </Column>
            <Column title="Today" count={today.length} accentColor="#ca8a04">
              {today.length === 0 ? (
                <div className="text-[11px] text-center py-6" style={{ color: 'var(--fg-faint)' }}>Nothing due today</div>
              ) : (
                today.map((c) => (
                  <TaskCard key={c.id} contact={c} accentColor="#ca8a04" onDone={() => handleDone(c)} onSnooze={(d) => handleSnooze(c, d)} />
                ))
              )}
            </Column>
            <Column title="Upcoming" count={upcoming.length} accentColor="#22c55e">
              {upcoming.length === 0 ? (
                <div className="text-[11px] text-center py-6" style={{ color: 'var(--fg-faint)' }}>No upcoming</div>
              ) : (
                upcoming.map((c) => (
                  <TaskCard key={c.id} contact={c} accentColor="#22c55e" onDone={() => handleDone(c)} onSnooze={(d) => handleSnooze(c, d)} />
                ))
              )}
            </Column>
          </div>
        )}
      </div>
    </Shell>
  );
}
