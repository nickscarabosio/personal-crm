'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { Plus, Search, Linkedin, Mail, Trash2 } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { ContactModal } from '@/components/contact-modal';
import { StatusBadge } from '@/components/status-badge';
import { useContacts, useDeleteContact } from '@/hooks/use-contacts';
import { useTags } from '@/hooks/use-tags';
import type { ContactWithTags } from '@/types/database';

export default function PeopleBoard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithTags | null>(null);

  const { data: contacts, isLoading } = useContacts({
    search,
    status: statusFilter,
    tagId: tagFilter || undefined,
  });
  const { data: tags } = useTags();
  const deleteContact = useDeleteContact();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete ${name}?`)) {
      deleteContact.mutate(id);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">People</h1>
          <button
            onClick={() => {
              setEditingContact(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="dormant">Dormant</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Tags</option>
            {tags?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Company</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Tags</th>
                <th className="px-4 py-3 font-medium text-gray-500">Last Touch</th>
                <th className="px-4 py-3 font-medium text-gray-500">Follow-Up</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : contacts?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts?.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${c.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {c.first_name} {c.last_name}
                      </Link>
                      {c.role && (
                        <p className="text-xs text-gray-500">{c.role}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.company_name || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
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
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.last_contacted_at
                        ? formatDistanceToNow(new Date(c.last_contacted_at), {
                            addSuffix: true,
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.follow_up_date ? (
                        <span
                          className={`text-xs font-medium ${
                            isPast(new Date(c.follow_up_date)) && !isToday(new Date(c.follow_up_date))
                              ? 'text-red-600'
                              : isToday(new Date(c.follow_up_date))
                              ? 'text-amber-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {format(new Date(c.follow_up_date), 'MMM d')}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {c.linkedin_url && (
                          <a
                            href={c.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingContact(c);
                            setModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c.id, `${c.first_name} ${c.last_name}`);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Contact count */}
        {contacts && (
          <p className="text-xs text-gray-400 mt-3">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </p>
        )}

        {modalOpen && (
          <ContactModal
            contact={editingContact}
            onClose={() => {
              setModalOpen(false);
              setEditingContact(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
