'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isPast, isToday } from 'date-fns';
import {
  PhoneCall, Mail, Video, MessageSquare, FileText, Linkedin, Globe,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Shell } from '@/components/shell';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useAllInteractions, type InteractionWithContact } from '@/hooks/use-all-interactions';
import { useContacts } from '@/hooks/use-contacts';
import {
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

const FILTER_TYPES = ['All', 'Call', 'Email', 'Meeting', 'DM', 'Note'] as const;

const interactionIcons: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  dm: MessageSquare,
  note: FileText,
  linkedin: Linkedin,
  other: Globe,
};

export default function ActivityPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');
  const { data: interactions, isLoading } = useAllInteractions(500);
  const { data: allContacts } = useContacts({});

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date + "T00:00:00")) || isToday(new Date(c.follow_up_date + "T00:00:00")))
    ).length;
  }, [allContacts]);

  const filtered = useMemo(() => {
    if (!interactions) return [];
    if (filter === 'All') return interactions;
    return interactions.filter((i) => i.type === filter.toLowerCase());
  }, [interactions, filter]);

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
    if (key === 'follow-up') router.push('/follow-ups');
    if (key === 'dashboard') router.push('/dashboard');
    if (key === 'companies') router.push('/companies');
  };

  const columns: ColumnDef<InteractionWithContact, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const Icon = interactionIcons[row.original.type] || Globe;
          return (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--bg-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={13} style={{ color: 'var(--fg-muted)' }} />
            </div>
          );
        },
        size: 48,
      },
      {
        accessorKey: 'contact',
        accessorFn: (row) => row.contact_name,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
        cell: ({ row }) => (
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>
            {row.original.contact_name}
          </span>
        ),
      },
      {
        accessorKey: 'summary',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Summary" />,
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {row.original.summary || '--'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'outcome',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Outcome" />,
        cell: ({ row }) => {
          if (!row.original.outcome) return <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>--</span>;
          return (
            <span style={{
              fontSize: 10, padding: '0 6px', height: 17, lineHeight: '17px',
              borderRadius: 9999, background: 'var(--bg-muted2)', color: 'var(--fg-muted)',
              display: 'inline-block',
            }}>
              {row.original.outcome}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {format(new Date(row.original.date), 'MMM d, yyyy')}
          </span>
        ),
        sortingFn: (rowA, rowB) => {
          return new Date(rowA.original.date).getTime() - new Date(rowB.original.date).getTime();
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <Shell
      tabs={tabTabs}
      activeTab="activity"
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        <h1 className="text-[16px] font-bold mb-3" style={{ color: 'var(--fg)' }}>
          Activity Feed
        </h1>

        {/* Filter bar */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {FILTER_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="rounded-full text-[11px] font-medium shrink-0"
              style={{
                height: 26, padding: '0 12px',
                background: filter === t ? 'var(--fg)' : 'transparent',
                color: filter === t ? 'var(--bg)' : 'var(--fg-muted)',
                border: filter === t ? 'none' : '1px solid var(--border)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          {isLoading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              Loading...
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--border)', borderRadius: 8,
                background: 'var(--bg)', boxShadow: 'var(--shadow)', overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      style={{ height: 34, background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}
                    >
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} style={{ padding: '0 12px', textAlign: 'left', fontWeight: 500, fontSize: 11, verticalAlign: 'middle' }}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--fg-faint)' }}>
                        No interactions found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/contacts/${row.original.contact_id}`)}
                        style={{
                          minHeight: 48, borderBottom: '1px solid var(--border)',
                          cursor: 'pointer', background: 'transparent',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        className="group"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <DataTablePagination table={table} />
            </div>
          )}
        </div>

        {/* Mobile Feed */}
        <div className="sm:hidden">
          {isLoading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)', border: '1px solid var(--border)', borderRadius: 8 }}>
              No interactions found
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', boxShadow: 'var(--shadow)' }}>
              {filtered.slice(0, 50).map((interaction, idx) => {
                const Icon = interactionIcons[interaction.type] || Globe;
                return (
                  <div
                    key={interaction.id}
                    className="flex gap-3 items-start px-4 py-3 cursor-pointer"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onClick={() => router.push(`/contacts/${interaction.contact_id}`)}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Icon size={13} style={{ color: 'var(--fg-muted)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                          {interaction.contact_name}
                        </span>
                        <span className="text-[11px] capitalize rounded-full" style={{ padding: '0 6px', height: 17, lineHeight: '17px', background: 'var(--bg-muted)', color: 'var(--fg-muted)' }}>
                          {interaction.type}
                        </span>
                        {interaction.outcome && (
                          <span className="text-[10px] rounded-full" style={{ padding: '0 6px', height: 17, lineHeight: '17px', background: 'var(--bg-muted2)', color: 'var(--fg-muted)' }}>
                            {interaction.outcome}
                          </span>
                        )}
                      </div>
                      {interaction.summary && (
                        <div className="text-[12px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                          {interaction.summary}
                        </div>
                      )}
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--fg-faint)' }}>
                        {format(new Date(interaction.date), 'MMM d, yyyy \u00B7 h:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
