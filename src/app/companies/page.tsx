'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import { Building2, Globe, Check } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Shell } from '@/components/shell';
import { CompanyModal } from '@/components/company-modal';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useCompanies, type CompanyWithStats } from '@/hooks/use-companies';
import { useContacts } from '@/hooks/use-contacts';
import {
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

function SelectCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: 15, height: 15, borderRadius: 3,
        border: '1px solid var(--border-med)',
        background: checked ? 'var(--fg)' : 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      {checked && <Check size={10} style={{ color: 'var(--bg)' }} />}
    </div>
  );
}

export default function CompaniesPage() {
  const router = useRouter();
  const { data: companies, isLoading } = useCompanies();
  const { data: allContacts } = useContacts({});
  const [modalOpen, setModalOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date)) || isToday(new Date(c.follow_up_date)))
    ).length;
  }, [allContacts]);

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
    if (key === 'activity') router.push('/activity');
  };

  const tableData = useMemo(() => companies || [], [companies]);

  const columns: ColumnDef<CompanyWithStats, unknown>[] = useMemo(
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 4,
              background: 'var(--bg-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 size={14} style={{ color: 'var(--fg-muted)' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>
              {row.original.name}
            </span>
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: 'industry',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Industry" />,
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {row.original.industry || '--'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'contactCount',
        accessorFn: (row) => row.contact_count,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contacts" />,
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {row.original.contact_count}
          </span>
        ),
      },
      {
        accessorKey: 'lastTouch',
        accessorFn: (row) => row.last_touch || '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Touch" />,
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {row.original.last_touch
              ? formatDistanceToNow(new Date(row.original.last_touch), { addSuffix: true })
              : '--'}
          </span>
        ),
      },
      {
        accessorKey: 'website',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
        cell: ({ row }) => {
          const w = row.original.website;
          if (!w) return <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>--</span>;
          return (
            <span
              style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); window.open(w, '_blank'); }}
            >
              <Globe size={11} /> Link
            </span>
          );
        },
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <Shell
      tabs={tabTabs}
      activeTab="companies"
      onTabChange={handleTabChange}
      onAdd={() => setModalOpen(true)}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>
            Companies
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-md text-[12px] font-medium"
            style={{ height: 34, padding: '0 14px', background: 'var(--fg)', color: 'var(--bg)' }}
          >
            Add Company
          </button>
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
                        No companies yet
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/companies/${row.original.id}`)}
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
        <div className="sm:hidden">
          {isLoading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              Loading...
            </div>
          ) : !companies || companies.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              No companies yet
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="cursor-pointer p-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <Building2 size={14} style={{ color: 'var(--fg-muted)' }} />
                    <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                      {company.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                    {company.industry && <span>{company.industry}</span>}
                    <span>{company.contact_count} contacts</span>
                    <span>
                      {company.last_touch
                        ? formatDistanceToNow(new Date(company.last_touch), { addSuffix: true })
                        : 'No activity'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {companies && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--fg-faint)' }}>
            {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
          </p>
        )}
      </div>

      {modalOpen && <CompanyModal onClose={() => setModalOpen(false)} />}
    </Shell>
  );
}
