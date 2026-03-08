'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft,
  Linkedin,
  Mail,
  Phone,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  Globe,
} from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { StatusBadge } from '@/components/status-badge';
import { ContactModal } from '@/components/contact-modal';
import { InteractionModal } from '@/components/interaction-modal';
import { useContact, useDeleteContact } from '@/hooks/use-contacts';
import { useInteractions } from '@/hooks/use-interactions';
import type { Interaction } from '@/types/database';

const interactionIcons: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  dm: MessageSquare,
  note: FileText,
  linkedin: Linkedin,
  other: Globe,
};

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading } = useContact(id);
  const { data: interactions } = useInteractions(id);
  const deleteContact = useDeleteContact();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  const handleDelete = async () => {
    if (!contact) return;
    if (confirm(`Delete ${contact.first_name} ${contact.last_name}?`)) {
      await deleteContact.mutateAsync(contact.id);
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <p className="text-gray-400">Loading...</p>
        </main>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <p className="text-gray-400">Contact not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to People
        </Link>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Identity */}
          <div className="col-span-1 space-y-4">
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold">
                    {contact.first_name} {contact.last_name}
                  </h1>
                  {contact.role && (
                    <p className="text-sm text-gray-500">{contact.role}</p>
                  )}
                  {contact.company_name && (
                    <p className="text-sm text-gray-500">{contact.company_name}</p>
                  )}
                </div>
                <StatusBadge status={contact.status} />
              </div>

              {/* Tags */}
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {contact.tags.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <Mail className="w-4 h-4" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </div>
                )}
                {contact.linkedin_url && (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn Profile
                  </a>
                )}
              </div>

              {/* Meta */}
              <div className="mt-4 pt-4 border-t space-y-1 text-xs text-gray-400">
                {contact.source && <p>Source: {contact.source}</p>}
                {contact.last_contacted_at && (
                  <p>
                    Last touch:{' '}
                    {formatDistanceToNow(new Date(contact.last_contacted_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
                {contact.follow_up_date && (
                  <p>Follow-up: {format(new Date(contact.follow_up_date), 'MMM d, yyyy')}</p>
                )}
                <p>Added: {format(new Date(contact.created_at), 'MMM d, yyyy')}</p>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>

            {/* Notes */}
            {contact.notes && (
              <div className="bg-white border rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Center: Timeline */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Interactions</h2>
              <button
                onClick={() => setShowInteractionModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Log Interaction
              </button>
            </div>

            {!interactions || interactions.length === 0 ? (
              <div className="bg-white border rounded-xl p-8 text-center text-gray-400">
                <p>No interactions logged yet.</p>
                <button
                  onClick={() => setShowInteractionModal(true)}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  Log your first one
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction: Interaction) => {
                  const Icon = interactionIcons[interaction.type] || Globe;
                  return (
                    <div
                      key={interaction.id}
                      className="bg-white border rounded-xl p-4 flex gap-3"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">
                            {interaction.type}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(interaction.date), 'MMM d, yyyy · h:mm a')}
                          </span>
                        </div>
                        {interaction.summary && (
                          <p className="text-sm text-gray-700">{interaction.summary}</p>
                        )}
                        {interaction.outcome && (
                          <p className="text-xs text-gray-500 mt-1">
                            Outcome: {interaction.outcome}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showEditModal && (
          <ContactModal contact={contact} onClose={() => setShowEditModal(false)} />
        )}
        {showInteractionModal && (
          <InteractionModal
            contactId={contact.id}
            onClose={() => setShowInteractionModal(false)}
          />
        )}
      </main>
    </div>
  );
}
