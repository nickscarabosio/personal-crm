'use client';

import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { TopNav } from './top-nav';
import { SectionTabs } from './section-tabs';
import { BottomNav } from './bottom-nav';
import { AppSidebar } from './app-sidebar';
import { CommandPalette } from './command-palette';
import { useTheme } from './theme-provider';
import { useMediaQuery } from '@/hooks/use-media-query';

type Tab = {
  key: string;
  label: string;
  badge?: number;
  alert?: boolean;
};

type Props = {
  children: ReactNode;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  onAdd?: () => void;
  showFollowUpDot?: boolean;
};

export function Shell({
  children,
  tabs,
  activeTab,
  onTabChange,
  onAdd,
  showFollowUpDot,
}: Props) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { toggle: toggleTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleGlobalKey = useCallback(
    (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      // Escape to close palette
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        return;
      }

      // Don't fire shortcuts when focused on inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // N — open new contact modal
      if (e.key === 'n' || e.key === 'N') {
        if (!e.metaKey && !e.ctrlKey) {
          onAdd?.();
        }
      }
    },
    [onAdd]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [handleGlobalKey]);

  // Desktop layout: sidebar + content, no top nav / tabs / bottom nav
  if (isDesktop) {
    return (
      <>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <AppSidebar />
          <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
        </div>
        {paletteOpen && (
          <CommandPalette
            onClose={() => setPaletteOpen(false)}
            onNewContact={onAdd}
            onToggleTheme={toggleTheme}
          />
        )}
      </>
    );
  }

  // Mobile layout: top nav + section tabs + bottom nav (unchanged)
  return (
    <>
      <TopNav onAdd={onAdd} />
      <SectionTabs tabs={tabs} active={activeTab} onChange={onTabChange} />
      <main
        style={{
          paddingTop: 88,
          paddingBottom: 60,
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
      <BottomNav
        active={activeTab}
        onChange={onTabChange}
        showFollowUpDot={showFollowUpDot}
      />
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onNewContact={onAdd}
          onToggleTheme={toggleTheme}
        />
      )}
    </>
  );
}
