'use client';

type Tab = {
  key: string;
  label: string;
  badge?: number;
  alert?: boolean;
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
};

export function SectionTabs({ tabs, active, onChange }: Props) {
  return (
    <div
      className="fixed left-0 right-0 z-30 flex items-end gap-0 px-4 overflow-x-auto"
      style={{
        top: 48,
        height: 40,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative flex items-center gap-1.5 px-3 pb-0 shrink-0"
            style={{
              height: 40,
              color: isActive ? 'var(--fg)' : 'var(--fg-muted)',
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              borderBottom: isActive ? '2px solid var(--fg)' : '2px solid transparent',
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full px-1.5"
                style={{
                  height: 17,
                  fontSize: 10,
                  fontWeight: 500,
                  background: tab.alert ? 'var(--bg-muted2)' : 'var(--bg-muted)',
                  color: tab.alert ? 'var(--fg)' : 'var(--fg-muted)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
