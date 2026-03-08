'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isPast, isToday } from 'date-fns';
import {
  PhoneCall, Mail, Video, MessageSquare, FileText, Linkedin, Globe,
} from 'lucide-react';
import { Shell } from '@/components/shell';
import { useAllInteractions } from '@/hooks/use-all-interactions';
import { useContacts } from '@/hooks/use-contacts';

const FILTER_TYPES = ['All', 'Call', 'Email', 'Meeting', 'DM', 'Note'] as const;

const interactionIcons: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  dm: MessageSquare,
  note: FileText,
  linkedin: Linkedin,
  other: Globe,
};

export default function ActivityPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');
  const [limit, setLimit] = useState(50);
  const { data: interactions, isLoading } = useAllInteractions(limit);
  const { data: allContacts } = useContacts({});

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date)) || isToday(new Date(c.follow_up_date)))
    ).length;
  }, [allContacts]);

  const filtered = useMemo(() => {
    if (!interactions) return [];
    if (filter === 'All') return interactions;
    return interactions.filter((i) => i.type === filter.toLowerCase());
  }, [interactions, filter]);

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
  };

  return (
    <Shell
      tabs={tabTabs}
      activeTab="activity"
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        <h1 className="text-[16px] font-bold mb-3" style={{ color: 'var(--fg)' }}>
          Activity Feed
        </h1>

        {/* Filter bar */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {FILTER_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="rounded-full text-[11px] font-medium shrink-0"
              style={{
                height: 26,
                padding: '0 12px',
                background: filter === t ? 'var(--fg)' : 'transparent',
                color: filter === t ? 'var(--bg)' : 'var(--fg-muted)',
                border: filter === t ? 'none' : '1px solid var(--border)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="py-12 text-center text-[13px]"
            style={{
              color: 'var(--fg-faint)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            No interactions found
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {filtered.map((interaction, idx) => {
              const Icon = interactionIcons[interaction.type] || Globe;
              return (
                <div
                  key={interaction.id}
                  className="flex gap-3 items-start px-4 py-3 cursor-pointer"
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onClick={() => router.push(`/contacts/${interaction.contact_id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="shrink-0 flex items-center justify-center rounded-full mt-0.5"
                    style={{
                      width: 28,
                      height: 28,
                      background: 'var(--bg-muted)',
                    }}
                  >
                    <Icon size={13} style={{ color: 'var(--fg-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                        {interaction.contact_name}
                      </span>
                      <span
                        className="text-[11px] capitalize rounded-full"
                        style={{
                          padding: '0 6px',
                          height: 17,
                          lineHeight: '17px',
                          background: 'var(--bg-muted)',
                          color: 'var(--fg-muted)',
                        }}
                      >
                        {interaction.type}
                      </span>
                      {interaction.outcome && (
                        <span
                          className="text-[10px] rounded-full"
                          style={{
                            padding: '0 6px',
                            height: 17,
                            lineHeight: '17px',
                            background: 'var(--bg-muted2)',
                            color: 'var(--fg-muted)',
                          }}
                        >
                          {interaction.outcome}
                        </span>
                      )}
                    </div>
                    {interaction.summary && (
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                        {interaction.summary}
                      </div>
                    )}
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--fg-faint)' }}>
                      {format(new Date(interaction.date), 'MMM d, yyyy · h:mm a')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {filtered.length >= limit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setLimit((l) => l + 50)}
              className="rounded-md text-[12px] font-medium"
              style={{
                height: 32,
                padding: '0 16px',
                border: '1px solid var(--border-med)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}
