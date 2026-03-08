'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import {
  PhoneCall, Mail, Video, MessageSquare, FileText, Linkedin, Globe, Users, Clock, AlertTriangle, TrendingDown,
} from 'lucide-react';
import { Shell } from '@/components/shell';
import { StatusDot } from '@/components/status-badge';
import { useContacts } from '@/hooks/use-contacts';
import { useRecentInteractions } from '@/hooks/use-all-interactions';
import { isDormantRisk } from '@/lib/dormancy';
import type { Interaction } from '@/types/database';

const AVATAR_COLORS = ['#3f3f46', '#52525b', '#71717a', '#27272a', '#18181b'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first: string, last?: string | null) {
  return (first[0] + (last?.[0] || '')).toUpperCase();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const interactionIcons: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  dm: MessageSquare,
  note: FileText,
  linkedin: Linkedin,
  other: Globe,
};

export default function Dashboard() {
  const router = useRouter();
  const { data: allContacts } = useContacts({});
  const { data: recentInteractions } = useRecentInteractions(5);

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date + "T00:00:00")) || isToday(new Date(c.follow_up_date + "T00:00:00")))
    ).length;
  }, [allContacts]);

  const stats = useMemo(() => {
    if (!allContacts) return { total: 0, active: 0, followUpsDue: 0, dormant: 0 };
    const total = allContacts.length;
    const active = allContacts.filter((c) => c.status === 'active').length;
    const followUpsDue = allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date + "T00:00:00")) || isToday(new Date(c.follow_up_date + "T00:00:00")))
    ).length;
    const dormant = allContacts.filter((c) => isDormantRisk(c)).length;
    return { total, active, followUpsDue, dormant };
  }, [allContacts]);

  const dueToday = useMemo(() => {
    if (!allContacts) return [];
    return allContacts.filter(
      (c) =>
        c.follow_up_date &&
        (isToday(new Date(c.follow_up_date + "T00:00:00")) ||
          (isPast(new Date(c.follow_up_date + "T00:00:00")) && !isToday(new Date(c.follow_up_date + "T00:00:00"))))
    ).slice(0, 5);
  }, [allContacts]);

  const goingCold = useMemo(() => {
    if (!allContacts) return [];
    return allContacts.filter((c) => isDormantRisk(c)).slice(0, 5);
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
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  return (
    <Shell
      tabs={tabTabs}
      activeTab="dashboard"
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-4">
        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>
            {getGreeting()}
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
            Here&apos;s your relationship overview
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label="Total Contacts" value={stats.total} />
          <StatCard icon={Users} label="Active" value={stats.active} dotColor="#22c55e" />
          <StatCard icon={Clock} label="Follow-ups Due" value={stats.followUpsDue} dotColor="#ca8a04" />
          <StatCard icon={TrendingDown} label="Going Cold" value={stats.dormant} dotColor="#ef4444" />
        </div>

        {/* Due Today / Overdue */}
        {dueToday.length > 0 && (
          <section className="mb-6">
            <div
              className="text-[10px] uppercase font-medium mb-2"
              style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
            >
              Due Today & Overdue
            </div>
            <div className="space-y-2">
              {dueToday.map((c) => {
                const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
                const isOverdue = c.follow_up_date && isPast(new Date(c.follow_up_date + "T00:00:00")) && !isToday(new Date(c.follow_up_date + "T00:00:00"));
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      borderLeft: `2px solid ${isOverdue ? '#ef4444' : '#ca8a04'}`,
                      padding: '10px 12px',
                      background: 'var(--bg)',
                      boxShadow: 'var(--shadow)',
                    }}
                    onClick={() => router.push(`/contacts/${c.id}`)}
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
                      {getInitials(c.first_name, c.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                        {fullName}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                        {[c.role, c.company_name].filter(Boolean).join(' at ')}
                      </div>
                    </div>
                    <div className="text-[11px] shrink-0" style={{ color: isOverdue ? '#ef4444' : '#ca8a04' }}>
                      {isOverdue
                        ? `Overdue - ${format(new Date(c.follow_up_date! + 'T00:00:00'), 'MMM d')}`
                        : 'Due today'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Going Cold */}
        {goingCold.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} style={{ color: '#ca8a04' }} />
              <span
                className="text-[10px] uppercase font-medium"
                style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
              >
                Going Cold
              </span>
            </div>
            <div className="space-y-2">
              {goingCold.map((c) => {
                const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      background: 'var(--bg)',
                      boxShadow: 'var(--shadow)',
                    }}
                    onClick={() => router.push(`/contacts/${c.id}`)}
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
                      {getInitials(c.first_name, c.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                        {fullName}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                        {[c.role, c.company_name].filter(Boolean).join(' at ')}
                      </div>
                    </div>
                    <div className="text-[11px] shrink-0" style={{ color: '#ca8a04' }}>
                      {c.last_contacted_at
                        ? formatDistanceToNow(new Date(c.last_contacted_at), { addSuffix: true })
                        : 'Never contacted'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section>
          <div
            className="text-[10px] uppercase font-medium mb-2"
            style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
          >
            Recent Activity
          </div>
          {!recentInteractions || recentInteractions.length === 0 ? (
            <div
              className="py-8 text-center text-[12px]"
              style={{ color: 'var(--fg-faint)', border: '1px solid var(--border)', borderRadius: 8 }}
            >
              No recent interactions
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
              {recentInteractions.map((interaction, idx) => {
                const Icon = interactionIcons[interaction.type] || Globe;
                return (
                  <div
                    key={interaction.id}
                    className="flex gap-3 items-start px-4 py-3 cursor-pointer"
                    style={{
                      borderBottom: idx < recentInteractions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                    onClick={() => router.push(`/contacts/${interaction.contact_id}`)}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full mt-0.5"
                      style={{
                        width: 24,
                        height: 24,
                        background: 'var(--bg-muted)',
                      }}
                    >
                      <Icon size={12} style={{ color: 'var(--fg-muted)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium" style={{ color: 'var(--fg)' }}>
                          {interaction.contact_name}
                        </span>
                        <span className="text-[11px] capitalize" style={{ color: 'var(--fg-muted)' }}>
                          {interaction.type}
                        </span>
                        {interaction.outcome && (
                          <span
                            className="rounded-full text-[10px]"
                            style={{
                              padding: '0 6px',
                              height: 17,
                              lineHeight: '17px',
                              background: 'var(--bg-muted)',
                              color: 'var(--fg-muted)',
                            }}
                          >
                            {interaction.outcome}
                          </span>
                        )}
                      </div>
                      {interaction.summary && (
                        <div className="text-[12px] truncate mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                          {interaction.summary}
                        </div>
                      )}
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--fg-faint)' }}>
                        {format(new Date(interaction.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  dotColor,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  dotColor?: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ border: '1px solid var(--border)', background: 'var(--bg)', boxShadow: 'var(--shadow)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {dotColor && (
          <span
            className="inline-block rounded-full"
            style={{ width: 6, height: 6, background: dotColor }}
          />
        )}
        <Icon size={12} style={{ color: 'var(--fg-faint)' }} />
      </div>
      <div className="text-[22px] font-bold" style={{ color: 'var(--fg)' }}>
        {value}
      </div>
      <div className="text-[10px] uppercase font-medium" style={{ color: 'var(--fg-faint)', letterSpacing: '0.4px' }}>
        {label}
      </div>
    </div>
  );
}
