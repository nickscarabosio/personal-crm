'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Clock, LayoutDashboard } from 'lucide-react';

const nav = [
  { href: '/', label: 'People', icon: Users },
  { href: '/follow-ups', label: 'Follow-Ups', icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <LayoutDashboard className="w-5 h-5 text-blue-600" />
          <span>CRM</span>
        </Link>
      </div>
      <nav className="flex-1 p-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
