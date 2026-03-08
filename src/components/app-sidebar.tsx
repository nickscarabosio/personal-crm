'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Activity,
  ChevronLeft,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useTheme } from './theme-provider';

type NavItem = {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    label: 'People',
    items: [
      { key: 'people', label: 'People', icon: Users, href: '/' },
      { key: 'companies', label: 'Companies', icon: Building2, href: '/companies' },
    ],
  },
  {
    label: 'Activity',
    items: [
      { key: 'follow-up', label: 'Follow-Up', icon: Clock, href: '/follow-ups' },
      { key: 'activity', label: 'Activity Log', icon: Activity, href: '/activity' },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({
    People: true,
    Activity: true,
  });

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  // Cmd+B to toggle
  const handleKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      setCollapsed((c) => !c);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleGroup = (label: string) => {
    setGroupOpen((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarWidth = collapsed ? 48 : 220;

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--fg)',
              whiteSpace: 'nowrap',
            }}
          >
            Nexus
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            border: 'none',
            background: 'none',
            color: 'var(--fg-muted)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ChevronLeft
            size={14}
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms',
            }}
          />
        </button>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navGroups.map((group) => {
          const isOpen = groupOpen[group.label] !== false;
          return (
            <div key={group.label} style={{ marginBottom: 4 }}>
              {/* Group label - clickable to collapse */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '4px 12px',
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: 'var(--fg-faint)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={10}
                    style={{
                      transform: isOpen ? 'none' : 'rotate(-90deg)',
                      transition: 'transform 150ms',
                    }}
                  />
                </button>
              )}

              {/* Items */}
              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: collapsed || isOpen ? 'none' : 0,
                  transition: collapsed ? 'none' : 'max-height 200ms ease',
                }}
              >
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <div key={item.key} style={{ position: 'relative' }}>
                      <button
                        onClick={() => router.push(item.href)}
                        title={collapsed ? item.label : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          width: collapsed ? 48 : 'calc(100% - 8px)',
                          height: 32,
                          padding: collapsed ? '0' : '0 10px',
                          marginLeft: collapsed ? 0 : 4,
                          marginRight: collapsed ? 0 : 4,
                          marginBottom: 1,
                          fontSize: 13,
                          fontWeight: active ? 500 : 400,
                          color: active ? 'var(--fg)' : 'var(--fg-muted)',
                          background: active ? 'var(--bg-muted)' : 'transparent',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = 'var(--bg-subtle)';
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Icon size={17} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: collapsed ? '8px 0' : '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            border: 'none',
            background: 'none',
            color: 'var(--fg-muted)',
            cursor: 'pointer',
          }}
        >
          {theme === 'light' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={async () => {
                await fetch('/api/auth', { method: 'DELETE' });
                window.location.href = '/login';
              }}
              title="Sign out"
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                border: 'none',
                background: 'none',
                color: 'var(--fg-muted)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
            </button>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#3f3f46',
                color: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              NK
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
