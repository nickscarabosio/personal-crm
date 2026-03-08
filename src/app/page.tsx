'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { Search, Pencil, Mail, Download, Upload } from 'lucide-react';
import { Shell } from '@/components/shell';
import { ContactModal } from '@/components/contact-modal';
import { CSVImportModal } from '@/components/csv-import-modal';
import { StatusDot } from '@/components/status-badge';
import { useContacts, useDeleteContact } from '@/hooks/use-contacts';
import { useTags } from '@/hooks/use-tags';
import type { ContactWithTags } from '@/types/database';
import { isDormantRisk } from '@/lib/dormancy';
import { calculateWarmthScore, getScoreColor } from '@/lib/scoring';
import { useInteractionCounts } from '@/hooks/use-interaction-counts';

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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithTags | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: contacts, isLoading } = useContacts({
    search,
    status: statusFilter,
  });
  const { data: tags } = useTags();
  const deleteContact = useDeleteContact();
  const { data: interactionCounts } = useInteractionCounts();

  // Count for follow-ups
  const { data: allContacts } = useContacts({});
  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date)) || isToday(new Date(c.follow_up_date)))
    ).length;
  }, [allContacts]);

  const tabTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'people', label: 'People', badge: contacts?.length || 0 },
    { key: 'follow-up', label: 'Follow-Up', badge: followUpCount, alert: followUpCount > 0 },
    { key: 'record', label: 'Record' },
    { key: 'companies', label: 'Companies' },
    { key: 'activity', label: 'Activity' },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'follow-up') router.push('/follow-ups');
    if (key === 'dashboard') router.push('/dashboard');
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  const handleExport = () => {
    if (!contacts || contacts.length === 0) return;
    const csvHeaders = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Role',
      'Source', 'LinkedIn', 'Status', 'Tags', 'Last Contacted', 'Follow-Up Date', 'Notes',
    ];
    const csvRows = contacts.map((c) => [
      c.first_name,
      c.last_name || '',
      c.email || '',
      c.phone || '',
      c.company_name || '',
      c.role || '',
      c.source || '',
      c.linkedin_url || '',
      c.status,
      c.tags.map((t) => t.label).join('; '),
      c.last_contacted_at ? format(new Date(c.last_contacted_at), 'yyyy-MM-dd') : '',
      c.follow_up_date || '',
      c.notes || '',
    ]);
    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    const csv = [csvHeaders.map(escape).join(','), ...csvRows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              ref={searchInputRef}
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
            onClick={handleExport}
            className="rounded-md text-[12px] font-medium shrink-0 flex items-center gap-1"
            style={{
              height: 34,
              padding: '0 10px',
              border: '1px solid var(--border-med)',
              background: 'var(--bg)',
              color: 'var(--fg)',
            }}
          >
            <Download size={13} /> <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="rounded-md text-[12px] font-medium shrink-0 flex items-center gap-1"
            style={{
              height: 34,
              padding: '0 10px',
              border: '1px solid var(--border-med)',
              background: 'var(--bg)',
              color: 'var(--fg)',
            }}
          >
            <Upload size={13} /> <span className="hidden sm:inline">Import</span>
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

        {/* Desktop Table */}
        <div
          className="overflow-hidden hidden sm:block"
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
              gridTemplateColumns: '32px 2fr 1fr 1fr 100px 52px 64px',
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
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Score
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
                    gridTemplateColumns: '32px 2fr 1fr 1fr 100px 52px 64px',
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                      {c.last_contacted_at
                        ? formatDistanceToNow(new Date(c.last_contacted_at), { addSuffix: true })
                        : '--'}
                    </span>
                    {isDormantRisk(c) && (
                      <span
                        className="text-[9px] font-medium rounded px-1"
                        style={{
                          background: 'rgba(202, 138, 4, 0.12)',
                          color: '#ca8a04',
                          lineHeight: '16px',
                        }}
                      >
                        30d+
                      </span>
                    )}
                  </div>

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

                  {/* Score */}
                  {(() => {
                    const score = calculateWarmthScore(c, interactionCounts?.[c.id] || 0);
                    const color = getScoreColor(score);
                    return (
                      <div className="flex items-center gap-1.5">
                        <div
                          className="rounded-full overflow-hidden"
                          style={{ width: 28, height: 4, background: 'var(--bg-muted2)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${score}%`, background: color }}
                          />
                        </div>
                        <span className="text-[10px] font-medium" style={{ color }}>
                          {score}
                        </span>
                      </div>
                    );
                  })()}

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

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2">
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
                  className="cursor-pointer"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: 'var(--bg)',
                    boxShadow: 'var(--shadow)',
                  }}
                  onClick={() => handleRowClick(c.id)}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full text-[10px] font-medium"
                      style={{ width: 32, height: 32, background: getAvatarColor(fullName), color: '#fafafa' }}
                    >
                      {getInitials(c.first_name, c.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium truncate" style={{ color: 'var(--fg)' }}>
                          {fullName}
                        </span>
                        <StatusDot status={c.status} />
                      </div>
                      {subtitle && (
                        <div className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="rounded-full"
                          style={{
                            height: 19, padding: '0 7px', fontSize: 10, fontWeight: 500,
                            lineHeight: '19px', border: '1px solid var(--border)',
                            background: 'var(--bg-muted)', color: 'var(--fg-muted)',
                          }}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: fu.dot }} />
                      <span className="text-[11px]" style={{ color: fu.color }}>{fu.text}</span>
                    </div>
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
      {importModalOpen && (
        <CSVImportModal onClose={() => setImportModalOpen(false)} />
      )}
    </Shell>
  );
}
