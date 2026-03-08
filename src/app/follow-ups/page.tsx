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

export default function FollowUps() {
  const router = useRouter();
  const { data: contacts, isLoading } = useContacts({ followUpOnly: true });
  const { data: allContacts } = useContacts({});
  const updateContact = useUpdateContact();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date + "T00:00:00")) || isToday(new Date(c.follow_up_date + "T00:00:00")))
    ).length;
  }, [allContacts]);

  const overdue = useMemo(
    () =>
      contacts?.filter(
        (c) =>
          c.follow_up_date &&
          isPast(new Date(c.follow_up_date + "T00:00:00")) &&
          !isToday(new Date(c.follow_up_date + "T00:00:00")) &&
          !dismissed.has(c.id)
      ) || [],
    [contacts, dismissed]
  );
  const today = useMemo(
    () =>
      contacts?.filter(
        (c) =>
          c.follow_up_date &&
          isToday(new Date(c.follow_up_date + "T00:00:00")) &&
          !dismissed.has(c.id)
      ) || [],
    [contacts, dismissed]
  );
  const upcoming = useMemo(
    () =>
      contacts?.filter(
        (c) =>
          c.follow_up_date &&
          !isPast(new Date(c.follow_up_date + "T00:00:00")) &&
          !isToday(new Date(c.follow_up_date + "T00:00:00")) &&
          !dismissed.has(c.id)
      ) || [],
    [contacts, dismissed]
  );

  const handleDone = useCallback(
    async (c: ContactWithTags) => {
      setDismissed((prev) => new Set(prev).add(c.id));
      await updateContact.mutateAsync({
        id: c.id,
        contact: { follow_up_date: null },
      });
    },
    [updateContact]
  );

  const handleSnooze = useCallback(
    async (c: ContactWithTags, date: Date) => {
      await updateContact.mutateAsync({
        id: c.id,
        contact: { follow_up_date: date.toISOString().split('T')[0] },
      });
    },
    [updateContact]
  );

  const tabTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'people', label: 'People', badge: allContacts?.length || 0 },
    { key: 'follow-up', label: 'Follow-Up', badge: followUpCount, alert: followUpCount > 0 },
    { key: 'record', label: 'Record' },
    { key: 'companies', label: 'Companies' },
    { key: 'activity', label: 'Activity' },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'people') router.push('/');
    if (key === 'dashboard') router.push('/dashboard');
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  const SnoozePicker = ({ contact }: { contact: ContactWithTags }) => {
    const [open, setOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false);
          setShowDatePicker(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const snoozeOptions = [
      { label: 'Tomorrow', date: addDays(new Date(), 1) },
      { label: 'In 3 Days', date: addDays(new Date(), 3) },
      { label: 'Next Week', date: nextMonday(new Date()) },
      { label: 'Next Month', date: addMonths(new Date(), 1) },
    ];

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded text-[11px] font-medium"
          style={{
            height: 24,
            padding: '0 8px',
            background: 'transparent',
            color: 'var(--fg-muted)',
          }}
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
            {snoozeOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  handleSnooze(contact, opt.date);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px]"
                style={{ color: 'var(--fg)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {opt.label}
                <span className="ml-2 text-[10px]" style={{ color: 'var(--fg-faint)' }}>
                  {format(opt.date, 'MMM d')}
                </span>
              </button>
            ))}
            {!showDatePicker ? (
              <button
                onClick={() => setShowDatePicker(true)}
                className="w-full text-left px-3 py-2 text-[12px]"
                style={{ color: 'var(--fg)', borderTop: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Pick Date...
              </button>
            ) : (
              <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                <input
                  type="date"
                  autoFocus
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSnooze(contact, new Date(e.target.value + 'T12:00:00'));
                      setOpen(false);
                      setShowDatePicker(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: 28,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '0 6px',
                    fontSize: 11,
                    color: 'var(--fg)',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const QueueCard = ({
    contact,
    accentColor,
  }: {
    contact: ContactWithTags;
    accentColor: string;
  }) => {
    const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
    const context = [contact.role, contact.company_name].filter(Boolean).join(' at ');
    const dueDate = contact.follow_up_date
      ? isPast(new Date(contact.follow_up_date + "T00:00:00")) && !isToday(new Date(contact.follow_up_date + "T00:00:00"))
        ? `Overdue - ${format(new Date(contact.follow_up_date + "T00:00:00"), 'MMM d')}`
        : isToday(new Date(contact.follow_up_date + "T00:00:00"))
        ? 'Due today'
        : format(new Date(contact.follow_up_date + "T00:00:00"), 'MMM d')
      : '';

    return (
      <div
        className="flex items-center gap-3 cursor-pointer"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          borderLeft: `2px solid ${accentColor}`,
          padding: '10px 12px',
          boxShadow: 'var(--shadow)',
          background: 'var(--bg)',
        }}
        onClick={() => router.push(`/contacts/${contact.id}`)}
      >
        <div
          className="shrink-0 flex items-center justify-center rounded-full text-[10px] font-medium"
          style={{
            width: 32,
            height: 32,
            background: getAvatarColor(fullName),
            color: '#fafafa',
          }}
        >
          {getInitials(contact.first_name, contact.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
            {fullName}
          </div>
          {context && (
            <div className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>
              {context}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--fg-faint)' }}>
            {contact.follow_up_type && (
              <span
                className="rounded text-[9px] font-medium uppercase"
                style={{
                  padding: '1px 5px',
                  border: '1px solid var(--border)',
                  color: 'var(--fg-muted)',
                }}
              >
                {contact.follow_up_type}
              </span>
            )}
            {dueDate}
          </div>
          {contact.follow_up_note && (
            <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--fg-muted)', fontStyle: 'italic' }}>
              {contact.follow_up_note}
            </div>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDone(contact)}
            className="rounded text-[11px] font-medium"
            style={{
              height: 24,
              padding: '0 8px',
              border: '1px solid var(--border-med)',
              background: 'var(--bg)',
              color: 'var(--fg)',
            }}
          >
            Done
          </button>
          <SnoozePicker contact={contact} />
        </div>
      </div>
    );
  };

  return (
    <Shell
      tabs={tabTabs}
      activeTab="follow-up"
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
            Loading...
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <div
            className="py-12 text-center text-[13px]"
            style={{
              color: 'var(--fg-faint)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg)',
            }}
          >
            No follow-ups scheduled. You&apos;re all caught up.
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div
                className="rounded-lg p-3"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <div className="text-[26px] font-bold" style={{ color: '#ef4444' }}>
                  {overdue.length}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                  Overdue
                </div>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <div className="text-[26px] font-bold" style={{ color: '#ca8a04' }}>
                  {today.length}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                  Today
                </div>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <div className="text-[26px] font-bold" style={{ color: '#22c55e' }}>
                  {upcoming.length}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                  This week
                </div>
              </div>
            </div>

            {/* Overdue */}
            {overdue.length > 0 && (
              <div className="mb-4">
                <div
                  className="text-[10px] uppercase font-medium mb-2"
                  style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
                >
                  Overdue
                </div>
                <div className="space-y-2">
                  {overdue.map((c) => (
                    <QueueCard key={c.id} contact={c} accentColor="#ef4444" />
                  ))}
                </div>
              </div>
            )}

            {/* Today */}
            {today.length > 0 && (
              <div className="mb-4">
                <div
                  className="text-[10px] uppercase font-medium mb-2"
                  style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
                >
                  Today
                </div>
                <div className="space-y-2">
                  {today.map((c) => (
                    <QueueCard key={c.id} contact={c} accentColor="#ca8a04" />
                  ))}
                </div>
              </div>
            )}

            {/* This week */}
            {upcoming.length > 0 && (
              <div className="mb-4">
                <div
                  className="text-[10px] uppercase font-medium mb-2"
                  style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
                >
                  This week
                </div>
                <div className="space-y-2">
                  {upcoming.map((c) => (
                    <QueueCard key={c.id} contact={c} accentColor="#22c55e" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
