'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sun, Moon, LogOut, Camera, X } from 'lucide-react';
import { Shell } from '@/components/shell';
import { useContacts } from '@/hooks/use-contacts';
import { useTheme } from '@/components/theme-provider';
import { useProfile } from '@/hooks/use-profile';
import { isPast, isToday } from 'date-fns';

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg)',
  padding: 16,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--fg-faint)',
  marginBottom: 8,
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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--fg-muted)',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const { profile, update: updateProfile } = useProfile();
  const { data: allContacts } = useContacts({});
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile.name);
  const [initialsValue, setInitialsValue] = useState(profile.initials);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveName = () => {
    updateProfile({ name: nameValue, initials: initialsValue });
    setEditingName(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Resize to keep localStorage small
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Crop to square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        updateProfile({ avatarUrl: canvas.toDataURL('image/jpeg', 0.8) });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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
          <div style={sectionLabel}>Profile</div>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: profile.avatarUrl ? 'transparent' : '#3f3f46',
                  color: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 500,
                  overflow: 'hidden',
                }}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover' }} />
                ) : (
                  profile.initials
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  border: '2px solid var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Camera size={10} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              {profile.avatarUrl && (
                <button
                  onClick={() => updateProfile({ avatarUrl: null })}
                  title="Remove photo"
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#fff',
                    border: '2px solid var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={8} />
                </button>
              )}
            </div>

            {/* Name / Initials */}
            <div className="flex-1">
              {editingName ? (
                <div className="space-y-2">
                  <div>
                    <label style={fieldLabel}>Display Name</label>
                    <input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      style={inputStyle}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Initials</label>
                    <input
                      value={initialsValue}
                      onChange={(e) => setInitialsValue(e.target.value.toUpperCase().slice(0, 3))}
                      maxLength={3}
                      style={{ ...inputStyle, width: 60 }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveName}
                      style={{
                        height: 28,
                        padding: '0 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 6,
                        border: 'none',
                        background: 'var(--fg)',
                        color: 'var(--bg)',
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNameValue(profile.name);
                        setInitialsValue(profile.initials);
                        setEditingName(false);
                      }}
                      style={{
                        height: 28,
                        padding: '0 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 6,
                        border: '1px solid var(--border-med)',
                        background: 'var(--bg)',
                        color: 'var(--fg)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[14px] font-medium" style={{ color: 'var(--fg)' }}>
                    {profile.name}
                  </div>
                  <div className="text-[12px] mb-2" style={{ color: 'var(--fg-muted)' }}>
                    Initials: {profile.initials}
                  </div>
                  <button
                    onClick={() => {
                      setNameValue(profile.name);
                      setInitialsValue(profile.initials);
                      setEditingName(true);
                    }}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      borderRadius: 6,
                      border: '1px solid var(--border-med)',
                      background: 'var(--bg)',
                      color: 'var(--fg)',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div style={cardStyle} className="mb-4">
          <div style={sectionLabel}>Appearance</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <div style={sectionLabel}>Security</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>Password</div>
              <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                Managed via Vercel environment variables
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>Session</div>
              <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                30-day cookie-based session
              </div>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ ...sectionLabel, color: '#ef4444' }}>Account</div>
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
