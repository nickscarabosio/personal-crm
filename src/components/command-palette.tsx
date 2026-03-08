'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Clock, LayoutDashboard, Building2, Activity, User, Plus, Moon } from 'lucide-react';
import { useContacts } from '@/hooks/use-contacts';

type Result = {
  id: string;
  label: string;
  sublabel?: string;
  group: 'Contacts' | 'Pages' | 'Actions';
  icon: typeof Search;
  action: () => void;
};

type Props = {
  onClose: () => void;
  onNewContact?: () => void;
  onToggleTheme?: () => void;
};

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette({ onClose, onNewContact, onToggleTheme }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: contacts } = useContacts({});

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const pages: Result[] = [
    { id: 'p-dashboard', label: 'Dashboard', group: 'Pages', icon: LayoutDashboard, action: () => { router.push('/dashboard'); onClose(); } },
    { id: 'p-people', label: 'People', group: 'Pages', icon: Users, action: () => { router.push('/'); onClose(); } },
    { id: 'p-follow-ups', label: 'Follow-Ups', group: 'Pages', icon: Clock, action: () => { router.push('/follow-ups'); onClose(); } },
    { id: 'p-companies', label: 'Companies', group: 'Pages', icon: Building2, action: () => { router.push('/companies'); onClose(); } },
    { id: 'p-activity', label: 'Activity', group: 'Pages', icon: Activity, action: () => { router.push('/activity'); onClose(); } },
  ];

  const actions: Result[] = [
    { id: 'a-new-contact', label: 'New Contact', group: 'Actions', icon: Plus, action: () => { onNewContact?.(); onClose(); } },
    { id: 'a-toggle-theme', label: 'Toggle Theme', group: 'Actions', icon: Moon, action: () => { onToggleTheme?.(); onClose(); } },
  ];

  const contactResults: Result[] = (contacts || [])
    .filter((c) => {
      if (!query) return false;
      const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
      return (
        fuzzyMatch(fullName, query) ||
        fuzzyMatch(c.email || '', query) ||
        fuzzyMatch(c.company_name || '', query)
      );
    })
    .slice(0, 8)
    .map((c) => ({
      id: `c-${c.id}`,
      label: `${c.first_name} ${c.last_name || ''}`.trim(),
      sublabel: [c.role, c.company_name].filter(Boolean).join(' · '),
      group: 'Contacts' as const,
      icon: User,
      action: () => { router.push(`/contacts/${c.id}`); onClose(); },
    }));

  const allResults = [
    ...contactResults,
    ...pages.filter((p) => !query || fuzzyMatch(p.label, query)),
    ...actions.filter((a) => !query || fuzzyMatch(a.label, query)),
  ];

  // Group results
  const grouped: Record<string, Result[]> = {};
  for (const r of allResults) {
    if (!grouped[r.group]) grouped[r.group] = [];
    grouped[r.group].push(r);
  }

  const flatResults = allResults;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatResults[activeIndex]) {
        e.preventDefault();
        flatResults[activeIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [flatResults, activeIndex, onClose]
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: 480,
          background: 'var(--bg)',
          borderRadius: 10,
          boxShadow: '0 25px 50px rgba(0,0,0,.2)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2 px-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Search size={15} style={{ color: 'var(--fg-faint)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search contacts, pages, actions..."
            style={{
              width: '100%',
              height: 44,
              background: 'transparent',
              border: 'none',
              fontSize: 14,
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {flatResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              No results found
            </div>
          ) : (
            Object.entries(grouped).map(([group, results]) => (
              <div key={group}>
                <div
                  className="px-4 py-1 text-[10px] uppercase font-medium"
                  style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
                >
                  {group}
                </div>
                {results.map((r) => {
                  const globalIdx = flatResults.indexOf(r);
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={r.action}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left"
                      style={{
                        background: globalIdx === activeIndex ? 'var(--bg-muted)' : 'transparent',
                      }}
                    >
                      <Icon size={14} style={{ color: 'var(--fg-faint)', flexShrink: 0 }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate" style={{ color: 'var(--fg)' }}>
                          {r.label}
                        </div>
                        {r.sublabel && (
                          <div className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>
                            {r.sublabel}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px]" style={{ color: 'var(--fg-faint)' }}>
              <kbd style={{ padding: '0 4px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10, background: 'var(--bg-subtle)' }}>↑↓</kbd> navigate
            </span>
            <span className="text-[10px]" style={{ color: 'var(--fg-faint)' }}>
              <kbd style={{ padding: '0 4px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10, background: 'var(--bg-subtle)' }}>↵</kbd> select
            </span>
            <span className="text-[10px]" style={{ color: 'var(--fg-faint)' }}>
              <kbd style={{ padding: '0 4px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10, background: 'var(--bg-subtle)' }}>esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
