'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sun, Moon, LogOut } from 'lucide-react';
import { Shell } from '@/components/shell';
import { useContacts } from '@/hooks/use-contacts';
import { useTheme } from '@/components/theme-provider';
import { isPast, isToday } from 'date-fns';

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg)',
  padding: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--fg-faint)',
  marginBottom: 8,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const { data: allContacts } = useContacts({});
  const [loggingOut, setLoggingOut] = useState(false);

  const followUpCount = allContacts?.filter(
    (c) =>
      c.follow_up_date &&
      (isPast(new Date(c.follow_up_date + 'T00:00:00')) ||
        isToday(new Date(c.follow_up_date + 'T00:00:00')))
  ).length || 0;

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
    if (key === 'follow-up') router.push('/follow-ups');
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/login';
  };

  return (
    <Shell
      tabs={tabTabs}
      activeTab=""
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3" style={{ maxWidth: 480 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg-muted)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
          </button>
          <h1 className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>
            Settings
          </h1>
        </div>

        {/* Profile */}
        <div style={cardStyle} className="mb-4">
          <div style={labelStyle}>Profile</div>
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#3f3f46',
                color: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              NK
            </div>
            <div>
              <div className="text-[14px] font-medium" style={{ color: 'var(--fg)' }}>
                Nick Scarabosio
              </div>
              <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                Single-user CRM
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div style={cardStyle} className="mb-4">
          <div style={labelStyle}>Appearance</div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                Theme
              </div>
              <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                {theme === 'light' ? 'Light mode' : 'Dark mode'}
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                height: 32,
                padding: '0 12px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border: '1px solid var(--border-med)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>

        {/* Security */}
        <div style={cardStyle} className="mb-4">
          <div style={labelStyle}>Security</div>
          <div style={rowStyle}>
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                Password
              </div>
              <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                Managed via Vercel environment variables
              </div>
            </div>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                Session
              </div>
              <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                30-day cookie-based session
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ ...labelStyle, color: '#ef4444' }}>Account</div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              height: 36,
              padding: '0 16px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: '1px solid rgba(239,68,68,0.4)',
              background: 'transparent',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LogOut size={14} />
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    </Shell>
  );
}
