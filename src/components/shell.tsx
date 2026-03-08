'use client';

import { type ReactNode } from 'react';
import { TopNav } from './top-nav';
import { SectionTabs } from './section-tabs';
import { BottomNav } from './bottom-nav';

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
    </>
  );
}
