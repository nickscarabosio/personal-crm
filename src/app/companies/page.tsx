'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import { Building2, Globe } from 'lucide-react';
import { Shell } from '@/components/shell';
import { CompanyModal } from '@/components/company-modal';
import { useCompanies } from '@/hooks/use-companies';
import { useContacts } from '@/hooks/use-contacts';

export default function CompaniesPage() {
  const router = useRouter();
  const { data: companies, isLoading } = useCompanies();
  const { data: allContacts } = useContacts({});
  const [modalOpen, setModalOpen] = useState(false);

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
    if (key === 'activity') router.push('/activity');
  };

  return (
    <Shell
      tabs={tabTabs}
      activeTab="companies"
      onTabChange={handleTabChange}
      onAdd={() => setModalOpen(true)}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>
            Companies
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-md text-[12px] font-medium"
            style={{
              height: 34,
              padding: '0 14px',
              background: 'var(--fg)',
              color: 'var(--bg)',
            }}
          >
            Add Company
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
            className="hidden sm:grid items-center"
            style={{
              gridTemplateColumns: '2fr 1fr 80px 1fr 100px',
              height: 34,
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border)',
              padding: '0 12px',
            }}
          >
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Company
            </span>
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Industry
            </span>
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Contacts
            </span>
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Last Touch
            </span>
            <span className="text-[11px] uppercase font-medium" style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}>
              Website
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              Loading...
            </div>
          ) : !companies || companies.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              No companies yet
            </div>
          ) : (
            companies.map((company) => (
              <div key={company.id}>
                {/* Desktop row */}
                <div
                  className="hidden sm:grid items-center cursor-pointer group"
                  style={{
                    gridTemplateColumns: '2fr 1fr 80px 1fr 100px',
                    minHeight: 50,
                    borderBottom: '1px solid var(--border)',
                    padding: '0 12px',
                  }}
                  onClick={() => router.push(`/companies/${company.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="shrink-0 flex items-center justify-center rounded"
                      style={{
                        width: 28,
                        height: 28,
                        background: 'var(--bg-muted)',
                      }}
                    >
                      <Building2 size={14} style={{ color: 'var(--fg-muted)' }} />
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                      {company.name}
                    </span>
                  </div>
                  <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {company.industry || '--'}
                  </span>
                  <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {company.contact_count}
                  </span>
                  <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {company.last_touch
                      ? formatDistanceToNow(new Date(company.last_touch), { addSuffix: true })
                      : '--'}
                  </span>
                  <span className="text-[12px] truncate" style={{ color: 'var(--fg-muted)' }}>
                    {company.website ? (
                      <span
                        className="flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(company.website!, '_blank');
                        }}
                      >
                        <Globe size={11} /> Link
                      </span>
                    ) : '--'}
                  </span>
                </div>

                {/* Mobile card */}
                <div
                  className="sm:hidden cursor-pointer p-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <Building2 size={14} style={{ color: 'var(--fg-muted)' }} />
                    <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                      {company.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                    {company.industry && <span>{company.industry}</span>}
                    <span>{company.contact_count} contacts</span>
                    <span>
                      {company.last_touch
                        ? formatDistanceToNow(new Date(company.last_touch), { addSuffix: true })
                        : 'No activity'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {companies && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--fg-faint)' }}>
            {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
          </p>
        )}
      </div>

      {modalOpen && <CompanyModal onClose={() => setModalOpen(false)} />}
    </Shell>
  );
}
