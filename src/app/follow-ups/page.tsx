'use client';

import Link from 'next/link';
import { format, isPast, isToday } from 'date-fns';
import { Sidebar } from '@/components/sidebar';
import { StatusBadge } from '@/components/status-badge';
import { useContacts } from '@/hooks/use-contacts';

export default function FollowUps() {
  const { data: contacts, isLoading } = useContacts({ followUpOnly: true });

  const overdue = contacts?.filter(
    (c) => c.follow_up_date && isPast(new Date(c.follow_up_date)) && !isToday(new Date(c.follow_up_date))
  );
  const today = contacts?.filter(
    (c) => c.follow_up_date && isToday(new Date(c.follow_up_date))
  );
  const upcoming = contacts?.filter(
    (c) =>
      c.follow_up_date &&
      !isPast(new Date(c.follow_up_date)) &&
      !isToday(new Date(c.follow_up_date))
  );

  const Section = ({
    title,
    items,
    color,
  }: {
    title: string;
    items: typeof contacts;
    color: string;
  }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className={`text-sm font-semibold mb-3 ${color}`}>
          {title} ({items.length})
        </h2>
        <div className="space-y-2">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/contacts/${c.id}`}
              className="flex items-center justify-between bg-white border rounded-xl p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.role ? `${c.role}${c.company_name ? ` at ${c.company_name}` : ''}` : c.company_name || ''}
                  </p>
                </div>
                <StatusBadge status={c.status} />
                <div className="flex gap-1">
                  {c.tags.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
              <span
                className={`text-sm font-medium ${
                  c.follow_up_date && isPast(new Date(c.follow_up_date)) && !isToday(new Date(c.follow_up_date))
                    ? 'text-red-600'
                    : isToday(new Date(c.follow_up_date!))
                    ? 'text-amber-600'
                    : 'text-gray-500'
                }`}
              >
                {format(new Date(c.follow_up_date!), 'MMM d')}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Follow-Ups</h1>

        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : contacts?.length === 0 ? (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-400">
            No follow-ups scheduled. You&apos;re all caught up.
          </div>
        ) : (
          <>
            <Section title="Overdue" items={overdue} color="text-red-600" />
            <Section title="Today" items={today} color="text-amber-600" />
            <Section title="Upcoming" items={upcoming} color="text-gray-500" />
          </>
        )}
      </main>
    </div>
  );
}
