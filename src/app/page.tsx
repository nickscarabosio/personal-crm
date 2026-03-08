'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { Search, Pencil, Mail, Download, Upload, Check } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Shell } from '@/components/shell';
import { ContactModal } from '@/components/contact-modal';
import { CSVImportModal } from '@/components/csv-import-modal';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useContacts } from '@/hooks/use-contacts';
import { BulkActionBar } from '@/components/bulk-action-bar';
import { useTags } from '@/hooks/use-tags';
import type { ContactWithTags } from '@/types/database';
import { isDormantRisk } from '@/lib/dormancy';
import { calculateWarmthScore, getScoreColor } from '@/lib/scoring';
import { useInteractionCounts } from '@/hooks/use-interaction-counts';
import {
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

const AVATAR_COLORS = ['#3f3f46', '#52525b', '#71717a', '#27272a', '#18181b'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first: string, last?: string | null) {
  return (first[0] + (last?.[0] || '')).toUpperCase();
}

function followUpInfo(date: string | null) {
  if (!date) return { color: '#a1a1aa', text: '--', dot: '#a1a1aa' };
  const d = new Date(date);
  if (isPast(d) && !isToday(d)) return { color: '#ef4444', text: format(d, 'MMM d'), dot: '#ef4444' };
  if (isToday(d)) return { color: '#ca8a04', text: 'Today', dot: '#ca8a04' };
  return { color: '#22c55e', text: format(d, 'MMM d'), dot: '#22c55e' };
}

function SelectCheckbox({ checked, onChange, onClick }: { checked: boolean; onChange: () => void; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick?.(e); onChange(); }}
      style={{
        width: 15,
        height: 15,
        borderRadius: 3,
        border: '1px solid var(--border-med)',
        background: checked ? 'var(--fg)' : 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {checked && <Check size={10} style={{ color: 'var(--bg)' }} />}
    </div>
  );
}

export default function PeopleBoard() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithTags | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data: contacts, isLoading } = useContacts({ search, status: statusFilter });
  const { data: tags } = useTags();
  const { data: interactionCounts } = useInteractionCounts();

  const { data: allContacts } = useContacts({});
  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date)) || isToday(new Date(c.follow_up_date)))
    ).length;
  }, [allContacts]);

  const tabTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'people', label: 'People', badge: contacts?.length || 0 },
    { key: 'follow-up', label: 'Follow-Up', badge: followUpCount, alert: followUpCount > 0 },
    { key: 'record', label: 'Record' },
    { key: 'companies', label: 'Companies' },
    { key: 'activity', label: 'Activity' },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'follow-up') router.push('/follow-ups');
    if (key === 'dashboard') router.push('/dashboard');
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  const handleExport = () => {
    if (!contacts || contacts.length === 0) return;
    const csvHeaders = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Role',
      'Source', 'LinkedIn', 'Status', 'Tags', 'Last Contacted', 'Follow-Up Date', 'Notes',
    ];
    const csvRows = contacts.map((c) => [
      c.first_name, c.last_name || '', c.email || '', c.phone || '',
      c.company_name || '', c.role || '', c.source || '', c.linkedin_url || '',
      c.status, c.tags.map((t) => t.label).join('; '),
      c.last_contacted_at ? format(new Date(c.last_contacted_at), 'yyyy-MM-dd') : '',
      c.follow_up_date || '', c.notes || '',
    ]);
    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    const csv = [csvHeaders.map(escape).join(','), ...csvRows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isActiveFilter = statusFilter === 'active';

  const tableData = useMemo(() => contacts || [], [contacts]);

  const columns: ColumnDef<ContactWithTags, unknown>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <SelectCheckbox
            checked={table.getIsAllPageRowsSelected()}
            onChange={() => table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())}
          />
        ),
        cell: ({ row }) => (
          <SelectCheckbox
            checked={row.getIsSelected()}
            onChange={() => row.toggleSelected(!row.getIsSelected())}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 32,
      },
      {
        accessorKey: 'name',
        accessorFn: (row) => `${row.first_name} ${row.last_name || ''}`.trim(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
          const c = row.original;
          const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
          const subtitle = [c.role, c.company_name].filter(Boolean).join(' \u00B7 ');
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: getAvatarColor(fullName), color: '#fafafa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 500, flexShrink: 0,
                }}
              >
                {getInitials(c.first_name, c.last_name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fullName}
                </div>
                {subtitle && (
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: 'tags',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tags" />,
        cell: ({ row }) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {row.original.tags.map((t) => (
              <span
                key={t.id}
                style={{
                  height: 19, padding: '0 7px', fontSize: 10, fontWeight: 500,
                  lineHeight: '19px', borderRadius: 9999,
                  border: '1px solid var(--border)', background: 'var(--bg-muted)',
                  color: 'var(--fg-muted)',
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'lastTouch',
        accessorFn: (row) => row.last_contacted_at || '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Touch" />,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                {c.last_contacted_at
                  ? formatDistanceToNow(new Date(c.last_contacted_at), { addSuffix: true })
                  : '--'}
              </span>
              {isDormantRisk(c) && (
                <span style={{
                  fontSize: 9, fontWeight: 500, borderRadius: 3, padding: '0 4px',
                  background: 'rgba(202, 138, 4, 0.12)', color: '#ca8a04', lineHeight: '16px',
                }}>
                  30d+
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'followUp',
        accessorFn: (row) => row.follow_up_date || '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Follow-Up" />,
        cell: ({ row }) => {
          const fu = followUpInfo(row.original.follow_up_date);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: fu.dot, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: fu.color }}>{fu.text}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'score',
        accessorFn: (row) => calculateWarmthScore(row, interactionCounts?.[row.id] || 0),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
        cell: ({ row }) => {
          const score = calculateWarmthScore(row.original, interactionCounts?.[row.original.id] || 0);
          const color = getScoreColor(score);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 4, borderRadius: 9999, background: 'var(--bg-muted2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score}%`, borderRadius: 9999, background: color }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color }}>{score}</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setEditingContact(c); setModalOpen(true); }}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', color: 'var(--fg-faint)', cursor: 'pointer' }}
              >
                <Pencil size={13} />
              </button>
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--fg-faint)' }}
                >
                  <Mail size={13} />
                </a>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [interactionCounts]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter: search },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedIds = selectedRows.map((row) => row.original.id);

  return (
    <Shell
      tabs={tabTabs}
      activeTab="people"
      onTabChange={handleTabChange}
      onAdd={() => { setEditingContact(null); setModalOpen(true); }}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-faint)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-8 pr-3"
              style={{
                height: 34, background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                borderRadius: 6, fontSize: 13, color: 'var(--fg)',
              }}
            />
          </div>
          <button
            onClick={() => setStatusFilter(isActiveFilter ? 'all' : 'active')}
            className="rounded-md text-[12px] font-medium shrink-0"
            style={{
              height: 34, padding: '0 12px',
              border: '1px solid var(--border-med)',
              background: isActiveFilter ? 'var(--bg-muted2)' : 'var(--bg)',
              color: 'var(--fg)',
            }}
          >
            {isActiveFilter ? 'Active' : 'All'}
          </button>
          <DataTableViewOptions table={table} />
          <button
            onClick={handleExport}
            className="rounded-md text-[12px] font-medium shrink-0 flex items-center gap-1"
            style={{ height: 34, padding: '0 10px', border: '1px solid var(--border-med)', background: 'var(--bg)', color: 'var(--fg)' }}
          >
            <Download size={13} /> <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="rounded-md text-[12px] font-medium shrink-0 flex items-center gap-1"
            style={{ height: 34, padding: '0 10px', border: '1px solid var(--border-med)', background: 'var(--bg)', color: 'var(--fg)' }}
          >
            <Upload size={13} /> <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => { setEditingContact(null); setModalOpen(true); }}
            className="rounded-md text-[12px] font-medium shrink-0"
            style={{ height: 34, padding: '0 14px', background: 'var(--fg)', color: 'var(--bg)' }}
          >
            Add
          </button>
        </div>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <BulkActionBar
            selectedIds={selectedIds}
            tags={tags || []}
            onClearSelection={() => setRowSelection({})}
          />
        )}

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
                      style={{
                        height: 34, background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ padding: '0 12px', textAlign: 'left', fontWeight: 500, fontSize: 11, verticalAlign: 'middle' }}
                        >
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
                        No contacts found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/contacts/${row.original.id}`)}
                        style={{
                          minHeight: 48, borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: row.getIsSelected() ? 'var(--bg-muted)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!row.getIsSelected()) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                        onMouseLeave={(e) => { if (!row.getIsSelected()) e.currentTarget.style.background = 'transparent'; }}
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

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              Loading...
            </div>
          ) : tableData.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              No contacts found
            </div>
          ) : (
            tableData.map((c) => {
              const fu = followUpInfo(c.follow_up_date);
              const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
              const subtitle = [c.role, c.company_name].filter(Boolean).join(' \u00B7 ');
              return (
                <div
                  key={c.id}
                  className="cursor-pointer"
                  style={{
                    border: '1px solid var(--border)', borderRadius: 8,
                    padding: '10px 12px', background: 'var(--bg)', boxShadow: 'var(--shadow)',
                  }}
                  onClick={() => router.push(`/contacts/${c.id}`)}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full text-[10px] font-medium"
                      style={{ width: 32, height: 32, background: getAvatarColor(fullName), color: '#fafafa' }}
                    >
                      {getInitials(c.first_name, c.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium truncate" style={{ color: 'var(--fg)' }}>
                        {fullName}
                      </span>
                      {subtitle && (
                        <div className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="rounded-full"
                          style={{
                            height: 19, padding: '0 7px', fontSize: 10, fontWeight: 500,
                            lineHeight: '19px', border: '1px solid var(--border)',
                            background: 'var(--bg-muted)', color: 'var(--fg-muted)',
                          }}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: fu.dot }} />
                      <span className="text-[11px]" style={{ color: fu.color }}>{fu.text}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Contact count */}
        {contacts && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--fg-faint)' }}>
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {modalOpen && (
        <ContactModal
          contact={editingContact}
          onClose={() => { setModalOpen(false); setEditingContact(null); }}
        />
      )}
      {importModalOpen && (
        <CSVImportModal onClose={() => setImportModalOpen(false)} />
      )}
    </Shell>
  );
}
