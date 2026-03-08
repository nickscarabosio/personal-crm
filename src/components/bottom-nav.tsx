'use client';

import { Users, Clock, FileText, Building2, Activity } from 'lucide-react';

const items = [
  { key: 'people', label: 'People', icon: Users },
  { key: 'follow-up', label: 'Follow-Up', icon: Clock, hasAlert: true },
  { key: 'record', label: 'Record', icon: FileText },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'activity', label: 'Activity', icon: Activity },
];

type Props = {
  active: string;
  onChange: (key: string) => void;
  showFollowUpDot?: boolean;
};

export function BottomNav({ active, onChange, showFollowUpDot }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        height: 60,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="flex flex-col items-center justify-center gap-0.5 relative"
            style={{
              color: isActive ? 'var(--fg)' : 'var(--fg-faint)',
              minWidth: 56,
            }}
          >
            <Icon size={17} />
            <span style={{ fontSize: 10 }}>{item.label}</span>
            {item.key === 'follow-up' && showFollowUpDot && (
              <span
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: '#ef4444',
                  top: 2,
                  right: 14,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
