'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { Search, Pencil, Mail } from 'lucide-react';
import { Shell } from '@/components/shell';
import { ContactModal } from '@/components/contact-modal';
import { StatusDot } from '@/components/status-badge';
import { useContacts, useDeleteContact } from '@/hooks/use-contacts';
import { useTags } from '@/hooks/use-tags';
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

function followUpInfo(date: string | null) {
  if (!date) return { color: '#a1a1aa', text: '--', dot: '#a1a1aa' };
  const d = new Date(date);
  if (isPast(d) && !isToday(d)) return { color: '#ef4444', text: format(d, 'MMM d'), dot: '#ef4444' };
  if (isToday(d)) return { color: '#ca8a04', text: 'Today', dot: '#ca8a04' };
  return { color: '#22c55e', text: format(d, 'MMM d'), dot: '#22c55e' };
}

export default function PeopleBoard() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithTags | null>(null);

  const { data: contacts, isLoading } = useContacts({
    search,
    status: statusFilter,
  });
  const { data: tags } = useTags();
  const deleteContact = useDeleteContact();

  // Count for follow-ups
  const { data: allContacts } = useContacts({});
  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date)) || isToday(new Date(c.follow_up_date)))
    ).length;
  }, [allContacts]);

  const tabTabs = [
    { key: 'people', label: 'People', badge: contacts?.length || 0 },
    { key: 'follow-up', label: 'Follow-Up', badge: followUpCount, alert: followUpCount > 0 },
    { key: 'record', label: 'Record' },
    { key: 'companies', label: 'Companies' },
    { key: 'activity', label: 'Activity' },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'follow-up') router.push('/follow-ups');
  };

  const handleRowClick = (id: string) => {
    router.push(`/contacts/${id}`);
  };

  const isActiveFilter = statusFilter === 'active';

  return (
    <Shell
      tabs={tabTabs}
      activeTab="people"
      onTabChange={handleTabChange}
      onAdd={() => { setEditingContact(null); setModalOpen(true); }}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--fg-faint)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-8 pr-3"
              style={{
                height: 34,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--fg)',
              }}
            />
          </div>
          <button
            onClick={() => setStatusFilter(isActiveFilter ? 'all' : 'active')}
            className="rounded-md text-[12px] font-medium shrink-0"
            style={{
              height: 34,
              padding: '0 12px',
              border: '1px solid var(--border-med)',
              background: isActiveFilter ? 'var(--bg-muted2)' : 'var(--bg)',
              color: 'var(--fg)',
            }}
          >
            {isActiveFilter ? 'Active' : 'All'}
          </button>
          <button
            onClick={() => { setEditingContact(null); setModalOpen(true); }}
            className="rounded-md text-[12px] font-medium shrink-0"
            style={{
              height: 34,
              padding: '0 14px',
              background: 'var(--fg)',
              color: 'var(--bg)',
            }}
          >
            Add
          </button>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--bg)',
            boxShadow: 'var(--shadow)',
          }}
        >
          {/* Header */}
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: '32px 2fr 1.1fr 1fr 110px 64px',
              height: 34,
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border)',
              padding: '0 12px',
            }}
          >
            <div />
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Name
            </span>
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Tags
            </span>
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Last touch
            </span>
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Follow-up
            </span>
            <div />
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              Loading...
            </div>
          ) : contacts?.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              No contacts found
            </div>
          ) : (
            contacts?.map((c) => {
              const fu = followUpInfo(c.follow_up_date);
              const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
              const subtitle = [c.role, c.company_name].filter(Boolean).join(' \u00B7 ');
              return (
                <div
                  key={c.id}
                  className="grid items-center cursor-pointer group"
                  style={{
                    gridTemplateColumns: '32px 2fr 1.1fr 1fr 110px 64px',
                    minHeight: 50,
                    borderBottom: '1px solid var(--border)',
                    padding: '0 12px',
                  }}
                  onClick={() => handleRowClick(c.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Checkbox placeholder */}
                  <div />

                  {/* Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full text-[10px] font-medium"
                      style={{
                        width: 28,
                        height: 28,
                        background: getAvatarColor(fullName),
                        color: '#fafafa',
                      }}
                    >
                      {getInitials(c.first_name, c.last_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: 'var(--fg)' }}>
                        {fullName}
                      </div>
                      {subtitle && (
                        <div className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full"
                        style={{
                          height: 19,
                          padding: '0 7px',
                          fontSize: 10,
                          fontWeight: 500,
                          lineHeight: '19px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-muted)',
                          color: 'var(--fg-muted)',
                        }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>

                  {/* Last touch */}
                  <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {c.last_contacted_at
                      ? formatDistanceToNow(new Date(c.last_contacted_at), { addSuffix: true })
                      : '--'}
                  </span>

                  {/* Follow-up */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block rounded-full shrink-0"
                      style={{ width: 6, height: 6, background: fu.dot }}
                    />
                    <span className="text-[12px]" style={{ color: fu.color }}>
                      {fu.text}
                    </span>
                  </div>

                  {/* Hover actions */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setEditingContact(c); setModalOpen(true); }}
                      className="flex items-center justify-center rounded"
                      style={{ width: 28, height: 28, color: 'var(--fg-faint)' }}
                    >
                      <Pencil size={13} />
                    </button>
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center justify-center rounded"
                        style={{ width: 28, height: 28, color: 'var(--fg-faint)' }}
                      >
                        <Mail size={13} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Contact count */}
        {contacts && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--fg-faint)' }}>
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {modalOpen && (
        <ContactModal
          contact={editingContact}
          onClose={() => { setModalOpen(false); setEditingContact(null); }}
        />
      )}
    </Shell>
  );
}
