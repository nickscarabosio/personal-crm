'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import { Building2, Globe, ArrowLeft } from 'lucide-react';
import { Shell } from '@/components/shell';
import { CompanyModal } from '@/components/company-modal';
import { StatusDot } from '@/components/status-badge';
import { useCompany, useCompanyContacts } from '@/hooks/use-companies';
import { useContacts } from '@/hooks/use-contacts';
import type { Contact } from '@/types/database';

const AVATAR_COLORS = ['#3f3f46', '#52525b', '#71717a', '#27272a', '#18181b'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first: string, last?: string | null) {
  return (first[0] + (last?.[0] || '')).toUpperCase();
}

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: company, isLoading } = useCompany(id);
  const { data: contacts } = useCompanyContacts(id);
  const { data: allContacts } = useContacts({});
  const [showEditModal, setShowEditModal] = useState(false);

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date)) || isToday(new Date(c.follow_up_date)))
    ).length;
  }, [allContacts]);

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
    if (key === 'follow-up') router.push('/follow-ups');
    if (key === 'dashboard') router.push('/dashboard');
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  // Aggregate stats
  const totalContacts = contacts?.length || 0;
  const lastTouch = useMemo(() => {
    if (!contacts || contacts.length === 0) return null;
    const dates = contacts
      .map((c) => c.last_contacted_at)
      .filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.sort().reverse()[0];
  }, [contacts]);

  if (isLoading) {
    return (
      <Shell tabs={tabTabs} activeTab="companies" onTabChange={handleTabChange} showFollowUpDot={followUpCount > 0}>
        <div className="px-4 py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
          Loading...
        </div>
      </Shell>
    );
  }

  if (!company) {
    return (
      <Shell tabs={tabTabs} activeTab="companies" onTabChange={handleTabChange} showFollowUpDot={followUpCount > 0}>
        <div className="px-4 py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
          Company not found
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      tabs={tabTabs}
      activeTab="companies"
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        {/* Back button */}
        <button
          onClick={() => router.push('/companies')}
          className="flex items-center gap-1.5 mb-3 text-[12px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          <ArrowLeft size={14} /> Back to companies
        </button>

        {/* Header */}
        <div
          className="flex items-center justify-between mb-4 pb-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 flex items-center justify-center rounded"
              style={{ width: 42, height: 42, background: 'var(--bg-muted)' }}
            >
              <Building2 size={20} style={{ color: 'var(--fg-muted)' }} />
            </div>
            <div>
              <div className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>
                {company.name}
              </div>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                {company.industry && <span>{company.industry}</span>}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 underline"
                  >
                    <Globe size={11} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-md text-[12px] font-medium"
            style={{
              height: 30,
              padding: '0 10px',
              background: 'var(--fg)',
              color: 'var(--bg)',
            }}
          >
            Edit
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div
            className="rounded-lg p-3"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div className="text-[22px] font-bold" style={{ color: 'var(--fg)' }}>
              {totalContacts}
            </div>
            <div className="text-[10px] uppercase font-medium" style={{ color: 'var(--fg-faint)', letterSpacing: '0.4px' }}>
              Contacts
            </div>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
              {lastTouch
                ? formatDistanceToNow(new Date(lastTouch), { addSuffix: true })
                : '--'}
            </div>
            <div className="text-[10px] uppercase font-medium" style={{ color: 'var(--fg-faint)', letterSpacing: '0.4px' }}>
              Last Touch
            </div>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
              {company.size || '--'}
            </div>
            <div className="text-[10px] uppercase font-medium" style={{ color: 'var(--fg-faint)', letterSpacing: '0.4px' }}>
              Size
            </div>
          </div>
        </div>

        {/* Notes */}
        {company.notes && (
          <div className="mb-5">
            <div
              className="text-[10px] uppercase font-medium mb-1"
              style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
            >
              Notes
            </div>
            <div className="text-[13px]" style={{ color: 'var(--fg-muted)', whiteSpace: 'pre-wrap' }}>
              {company.notes}
            </div>
          </div>
        )}

        {/* Contacts */}
        <div
          className="text-[10px] uppercase font-medium mb-2"
          style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
        >
          Contacts at {company.name}
        </div>
        <div
          className="overflow-hidden"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--bg)',
            boxShadow: 'var(--shadow)',
          }}
        >
          {!contacts || contacts.length === 0 ? (
            <div className="py-8 text-center text-[12px]" style={{ color: 'var(--fg-faint)' }}>
              No contacts linked to this company
            </div>
          ) : (
            contacts.map((c: Contact) => {
              const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 cursor-pointer px-3 py-2.5"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => router.push(`/contacts/${c.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
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
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                      {fullName}
                    </div>
                    {c.role && (
                      <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                        {c.role}
                      </div>
                    )}
                  </div>
                  <StatusDot status={c.status} />
                  <span className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                    {c.last_contacted_at
                      ? formatDistanceToNow(new Date(c.last_contacted_at), { addSuffix: true })
                      : '--'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showEditModal && (
        <CompanyModal company={company} onClose={() => setShowEditModal(false)} />
      )}
    </Shell>
  );
}
