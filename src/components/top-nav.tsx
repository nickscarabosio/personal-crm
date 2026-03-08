'use client';

import { Sun, Moon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from './theme-provider';

type Props = {
  onAdd?: () => void;
};

export function TopNav({ onAdd }: Props) {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
      style={{
        height: 48,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>
        Nexus
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="flex items-center justify-center rounded-md"
          style={{
            width: 30,
            height: 30,
            color: 'var(--fg-muted)',
          }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center justify-center rounded-md"
            style={{
              width: 30,
              height: 30,
              color: 'var(--fg-muted)',
            }}
            aria-label="Add"
          >
            <Plus size={16} />
          </button>
        )}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center justify-center rounded-full text-[11px] font-medium"
          style={{
            width: 28,
            height: 28,
            background: '#3f3f46',
            color: '#fafafa',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          NK
        </button>
      </div>
    </header>
  );
}
