'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import {
  Mail,
  Phone,
  Linkedin,
  PhoneCall,
  Video,
  FileText,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { Shell } from '@/components/shell';
import { StatusDot } from '@/components/status-badge';
import { ContactModal } from '@/components/contact-modal';
import { InteractionModal } from '@/components/interaction-modal';
import { useContact, useContacts, useUpdateContact } from '@/hooks/use-contacts';
import { useInteractions, useCreateInteraction } from '@/hooks/use-interactions';
import { useInteractionCounts } from '@/hooks/use-interaction-counts';
import { calculateWarmthScore, getScoreColor, getScoreLabel } from '@/lib/scoring';
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from '@/hooks/use-milestones';
import type { Interaction, ContactInsert } from '@/types/database';

const AVATAR_COLORS = ['#3f3f46', '#52525b', '#71717a', '#27272a', '#18181b'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first: string, last?: string | null) {
  return (first[0] + (last?.[0] || '')).toUpperCase();
}

const interactionIcons: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  dm: MessageSquare,
  note: FileText,
  linkedin: Linkedin,
  other: Globe,
};

const LOG_TYPES = ['Note', 'Call', 'Email', 'Meeting'] as const;

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--fg-faint)',
  marginBottom: 2,
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--fg)',
};

const STATUS_OPTIONS = ['active', 'lead', 'dormant', 'closed'] as const;
const statusDotColors: Record<string, string> = {
  active: '#22c55e',
  lead: '#ca8a04',
  dormant: '#a1a1aa',
  closed: '#a1a1aa',
};

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading } = useContact(id);
  const { data: interactions } = useInteractions(id);
  const { data: allContacts } = useContacts({});
  const updateContact = useUpdateContact();
  const createInteraction = useCreateInteraction();
  const { data: interactionCounts } = useInteractionCounts();
  const { data: milestones } = useMilestones(id);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  // Inline log state
  const [logType, setLogType] = useState<string>('Note');
  const [logText, setLogText] = useState('');
  const [logOutcome, setLogOutcome] = useState('');

  // Goal state
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [goalDateValue, setGoalDateValue] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // Inline notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (contact) {
      setNotesValue(contact.notes || '');
      setGoalValue(contact.goal || '');
      setGoalDateValue(contact.goal_target_date || '');
    }
  }, [contact]);

  const saveNotes = useCallback(
    async (value: string) => {
      if (!contact) return;
      await updateContact.mutateAsync({
        id: contact.id,
        contact: { notes: value || null },
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 1500);
    },
    [contact, updateContact]
  );

  const handleNotesBlur = useCallback(() => {
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    saveNotes(notesValue);
    setEditingNotes(false);
  }, [notesValue, saveNotes]);

  const handleNotesKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
        saveNotes(notesValue);
        setEditingNotes(false);
      }
    },
    [notesValue, saveNotes]
  );

  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date + "T00:00:00")) || isToday(new Date(c.follow_up_date + "T00:00:00")))
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
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  const handleLog = async () => {
    if (!logText.trim()) return;
    await createInteraction.mutateAsync({
      contact_id: id,
      type: logType.toLowerCase() as Interaction['type'],
      date: new Date().toISOString(),
      summary: logText || null,
      outcome: logOutcome || null,
      follow_up_date: null,
    });
    setLogText('');
    setLogOutcome('');
  };

  const handleStatusChange = async (status: string) => {
    if (!contact) return;
    await updateContact.mutateAsync({
      id: contact.id,
      contact: { status: status as ContactInsert['status'] },
    });
  };

  const handleFollowUpChange = async (date: string) => {
    if (!contact) return;
    await updateContact.mutateAsync({
      id: contact.id,
      contact: { follow_up_date: date || null },
    });
  };

  if (isLoading) {
    return (
      <Shell tabs={tabTabs} activeTab="record" onTabChange={handleTabChange} showFollowUpDot={followUpCount > 0}>
        <div className="px-4 py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
          Loading...
        </div>
      </Shell>
    );
  }

  if (!contact) {
    return (
      <Shell tabs={tabTabs} activeTab="record" onTabChange={handleTabChange} showFollowUpDot={followUpCount > 0}>
        <div className="px-4 py-12 text-center text-[13px]" style={{ color: 'var(--fg-faint)' }}>
          Contact not found
        </div>
      </Shell>
    );
  }

  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
  const subtitle = [contact.role, contact.company_name].filter(Boolean).join(' \u00B7 ');
  const touchCount = interactions?.length || 0;

  return (
    <Shell
      tabs={tabTabs}
      activeTab="record"
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div className="px-4 py-3">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 gap-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 flex items-center justify-center rounded-full text-[14px] font-medium"
              style={{
                width: 42,
                height: 42,
                background: getAvatarColor(fullName),
                color: '#fafafa',
              }}
            >
              {getInitials(contact.first_name, contact.last_name)}
            </div>
            <div>
              <div className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>
                {fullName}
              </div>
              {subtitle && (
                <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                  {subtitle}
                </div>
              )}
              {contact.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {contact.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full"
                      style={{
                        height: 19,
                        padding: '0 7px',
                        fontSize: 10,
                        fontWeight: 500,
                        lineHeight: '19px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-muted)',
                        color: 'var(--fg-muted)',
                      }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="rounded-md text-[12px] font-medium flex items-center gap-1.5"
                style={{
                  height: 30,
                  padding: '0 10px',
                  border: '1px solid var(--border-med)',
                  color: 'var(--fg)',
                }}
              >
                <Mail size={13} /> Email
              </a>
            )}
            <button
              onClick={() => setShowInteractionModal(true)}
              className="rounded-md text-[12px] font-medium"
              style={{
                height: 30,
                padding: '0 10px',
                border: '1px solid var(--border-med)',
                color: 'var(--fg)',
              }}
            >
              + Follow-Up
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="rounded-md text-[12px] font-medium"
              style={{
                height: 30,
                padding: '0 10px',
                background: 'var(--fg)',
                color: 'var(--bg)',
              }}
            >
              Edit
            </button>
          </div>
        </div>

        {/* 3-column layout — stacks on mobile */}
        <div
          className="flex flex-col sm:grid gap-4"
          style={{ gridTemplateColumns: '188px 1fr 196px' }}
        >
          {/* Left: Contact info */}
          <div>
            <div
              className="text-[10px] uppercase font-medium mb-3"
              style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
            >
              Contact info
            </div>
            <div className="space-y-3">
              <div>
                <div style={fieldLabelStyle}>Status</div>
                <div className="flex items-center gap-1.5">
                  <StatusDot status={contact.status} />
                  <span style={fieldValueStyle} className="capitalize">{contact.status}</span>
                </div>
              </div>
              <div>
                <div style={fieldLabelStyle}>Last contacted</div>
                <div style={fieldValueStyle}>
                  {contact.last_contacted_at
                    ? formatDistanceToNow(new Date(contact.last_contacted_at), { addSuffix: true })
                    : '--'}
                </div>
              </div>
              <div>
                <div style={fieldLabelStyle}>Follow-up</div>
                <div className="flex items-center gap-1.5">
                  {contact.follow_up_date && (
                    <span
                      className="inline-block rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background:
                          isPast(new Date(contact.follow_up_date + "T00:00:00")) && !isToday(new Date(contact.follow_up_date + "T00:00:00"))
                            ? '#ef4444'
                            : isToday(new Date(contact.follow_up_date + "T00:00:00"))
                            ? '#ca8a04'
                            : '#22c55e',
                      }}
                    />
                  )}
                  <span style={fieldValueStyle}>
                    {contact.follow_up_date
                      ? format(new Date(contact.follow_up_date + 'T00:00:00'), 'MMM d, yyyy')
                      : '--'}
                  </span>
                </div>
              </div>
              {contact.email && (
                <div>
                  <div style={fieldLabelStyle}>Email</div>
                  <a
                    href={`mailto:${contact.email}`}
                    style={{ ...fieldValueStyle, color: 'var(--fg)' }}
                    className="underline"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div>
                  <div style={fieldLabelStyle}>Phone</div>
                  <div style={fieldValueStyle}>{contact.phone}</div>
                </div>
              )}
              {contact.linkedin_url && (
                <div>
                  <div style={fieldLabelStyle}>LinkedIn</div>
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...fieldValueStyle, color: 'var(--fg)' }}
                    className="underline"
                  >
                    Profile
                  </a>
                </div>
              )}
              {contact.source && (
                <div>
                  <div style={fieldLabelStyle}>Source</div>
                  <div style={fieldValueStyle}>{contact.source}</div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <div style={fieldLabelStyle}>Notes</div>
                  {notesSaved && (
                    <span className="text-[10px]" style={{ color: '#22c55e' }}>Saved</span>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    ref={notesTextareaRef}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    onBlur={handleNotesBlur}
                    onKeyDown={handleNotesKeyDown}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: 80,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 13,
                      color: 'var(--fg)',
                      resize: 'vertical',
                    }}
                  />
                ) : (
                  <div
                    onClick={() => setEditingNotes(true)}
                    className="cursor-pointer rounded"
                    style={{
                      ...fieldValueStyle,
                      whiteSpace: 'pre-wrap',
                      minHeight: 20,
                      padding: '2px 0',
                    }}
                    title="Click to edit"
                  >
                    {contact.notes || (
                      <span style={{ color: 'var(--fg-faint)', fontStyle: 'italic', fontSize: 12 }}>
                        Click to add notes...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: Activity */}
          <div className="flex flex-col min-h-0">
            <div
              className="text-[10px] uppercase font-medium mb-3"
              style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
            >
              Activity
            </div>

            {/* Activity feed */}
            <div
              className="flex-1 overflow-y-auto space-y-2 mb-3"
              style={{ maxHeight: 'calc(100vh - 340px)' }}
            >
              {!interactions || interactions.length === 0 ? (
                <div
                  className="py-8 text-center text-[12px]"
                  style={{ color: 'var(--fg-faint)' }}
                >
                  No interactions logged yet.
                </div>
              ) : (
                interactions.map((interaction: Interaction) => {
                  const Icon = interactionIcons[interaction.type] || Globe;
                  return (
                    <div key={interaction.id} className="flex gap-2.5 items-start">
                      <div
                        className="shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: 24,
                          height: 24,
                          background: 'var(--bg-muted)',
                        }}
                      >
                        <Icon size={12} style={{ color: 'var(--fg-muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium capitalize" style={{ color: 'var(--fg)' }}>
                            {interaction.type}
                          </span>
                          {interaction.outcome && (
                            <span
                              className="rounded-full text-[10px]"
                              style={{
                                padding: '0 6px',
                                height: 17,
                                lineHeight: '17px',
                                background: 'var(--bg-muted)',
                                color: 'var(--fg-muted)',
                              }}
                            >
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
                          {format(new Date(interaction.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Inline log area */}
            <div
              className="pt-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="flex gap-1 mb-2">
                {LOG_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setLogType(t)}
                    className="rounded-full text-[11px] font-medium"
                    style={{
                      height: 24,
                      padding: '0 10px',
                      background: logType === t ? 'var(--fg)' : 'transparent',
                      color: logType === t ? 'var(--bg)' : 'var(--fg-muted)',
                      border: logType === t ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Add a note..."
                style={{
                  width: '100%',
                  height: 62,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 13,
                  color: 'var(--fg)',
                  resize: 'none',
                }}
              />
              <div className="flex items-center justify-end mt-2">
                <button
                  onClick={handleLog}
                  disabled={!logText.trim() || createInteraction.isPending}
                  className="rounded text-[12px] font-medium disabled:opacity-40"
                  style={{
                    height: 28,
                    padding: '0 14px',
                    background: 'var(--fg)',
                    color: 'var(--bg)',
                  }}
                >
                  Log
                </button>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div>
            <div
              className="text-[10px] uppercase font-medium mb-3"
              style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
            >
              Actions
            </div>
            <div className="space-y-4">
              {/* Follow-up date */}
              <div>
                <div style={fieldLabelStyle}>Follow-up date</div>
                <input
                  type="date"
                  value={contact.follow_up_date || ''}
                  onChange={(e) => handleFollowUpChange(e.target.value)}
                  style={{
                    width: '100%',
                    height: 32,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '0 8px',
                    fontSize: 12,
                    color: 'var(--fg)',
                  }}
                />
              </div>

              {/* Goal & Milestones */}
              <div>
                <div style={fieldLabelStyle}>Goal</div>
                {editingGoal ? (
                  <div className="space-y-2">
                    <input
                      value={goalValue}
                      onChange={(e) => setGoalValue(e.target.value)}
                      placeholder="e.g. Make them a client"
                      autoFocus
                      style={{
                        width: '100%',
                        height: 30,
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '0 8px',
                        fontSize: 12,
                        color: 'var(--fg)',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--fg-faint)', marginBottom: 2 }}>Target date</div>
                      <input
                        type="date"
                        value={goalDateValue}
                        onChange={(e) => setGoalDateValue(e.target.value)}
                        style={{
                          width: '100%',
                          height: 30,
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '0 8px',
                          fontSize: 12,
                          color: 'var(--fg)',
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await updateContact.mutateAsync({
                            id: contact.id,
                            contact: {
                              goal: goalValue || null,
                              goal_target_date: goalDateValue || null,
                            },
                          });
                          setEditingGoal(false);
                        }}
                        style={{
                          height: 26,
                          padding: '0 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          borderRadius: 4,
                          border: 'none',
                          background: 'var(--fg)',
                          color: 'var(--bg)',
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setGoalValue(contact.goal || '');
                          setGoalDateValue(contact.goal_target_date || '');
                          setEditingGoal(false);
                        }}
                        style={{
                          height: 26,
                          padding: '0 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          borderRadius: 4,
                          border: '1px solid var(--border-med)',
                          background: 'var(--bg)',
                          color: 'var(--fg)',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingGoal(true)}
                    className="cursor-pointer rounded"
                    style={{ padding: '2px 0' }}
                  >
                    {contact.goal ? (
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                          {contact.goal}
                        </div>
                        {contact.goal_target_date && (
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                            Target: {format(new Date(contact.goal_target_date + 'T00:00:00'), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--fg-faint)', fontStyle: 'italic', fontSize: 12 }}>
                        Click to set a goal...
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Milestones */}
              <div>
                <div style={fieldLabelStyle}>Milestones</div>
                <div className="space-y-1.5">
                  {(milestones || []).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start gap-2"
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: m.completed ? 'var(--bg-subtle)' : 'var(--bg)',
                      }}
                    >
                      <button
                        onClick={async () => {
                          await updateMilestone.mutateAsync({
                            id: m.id,
                            contactId: id,
                            update: {
                              completed: !m.completed,
                              completed_at: !m.completed ? new Date().toISOString() : null,
                            },
                          });
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          marginTop: 1,
                          borderRadius: 4,
                          border: m.completed ? 'none' : '1.5px solid var(--border-med)',
                          background: m.completed ? '#22c55e' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: '#fff',
                          fontSize: 10,
                        }}
                      >
                        {m.completed && '✓'}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[12px]"
                          style={{
                            color: m.completed ? 'var(--fg-muted)' : 'var(--fg)',
                            textDecoration: m.completed ? 'line-through' : 'none',
                          }}
                        >
                          {m.title}
                        </div>
                        {m.target_date && (
                          <div className="text-[10px]" style={{ color: 'var(--fg-faint)' }}>
                            {format(new Date(m.target_date + 'T00:00:00'), 'MMM d')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await deleteMilestone.mutateAsync({ id: m.id, contactId: id });
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: 'none',
                          color: 'var(--fg-faint)',
                          cursor: 'pointer',
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {/* Add milestone */}
                <div className="flex gap-1.5 mt-2">
                  <input
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="Add milestone..."
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newMilestoneTitle.trim()) {
                        await createMilestone.mutateAsync({
                          contact_id: id,
                          title: newMilestoneTitle.trim(),
                          target_date: newMilestoneDate || null,
                          completed: false,
                          sort_order: (milestones?.length || 0),
                        });
                        setNewMilestoneTitle('');
                        setNewMilestoneDate('');
                      }
                    }}
                    style={{
                      flex: 1,
                      height: 28,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '0 8px',
                      fontSize: 12,
                      color: 'var(--fg)',
                    }}
                  />
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    title="Target date"
                    style={{
                      width: 36,
                      height: 28,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '0 4px',
                      fontSize: 11,
                      color: 'var(--fg)',
                    }}
                  />
                </div>
                {milestones && milestones.length > 0 && (
                  <div className="mt-1.5">
                    <div
                      className="rounded-full overflow-hidden"
                      style={{ width: '100%', height: 4, background: 'var(--bg-muted2)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)}%`,
                          background: '#22c55e',
                          transition: 'width 200ms',
                        }}
                      />
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--fg-faint)' }}>
                      {milestones.filter((m) => m.completed).length}/{milestones.length} completed
                    </div>
                  </div>
                )}
              </div>

              {/* Relationship status */}
              <div>
                <div style={fieldLabelStyle}>Relationship</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="flex items-center gap-1.5 rounded text-[11px] font-medium capitalize"
                      style={{
                        height: 30,
                        padding: '0 8px',
                        border: '1px solid var(--border)',
                        background: contact.status === s ? 'var(--bg-muted2)' : 'transparent',
                        color: 'var(--fg)',
                      }}
                    >
                      <span
                        className="inline-block rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: statusDotColors[s],
                        }}
                      />
                      {s === 'lead' ? 'Warm' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div style={fieldLabelStyle}>Tags</div>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full"
                      style={{
                        height: 19,
                        padding: '0 7px',
                        fontSize: 10,
                        fontWeight: 500,
                        lineHeight: '19px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-muted)',
                        color: 'var(--fg-muted)',
                      }}
                    >
                      {t.label}
                    </span>
                  ))}
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="rounded-full text-[10px]"
                    style={{
                      height: 19,
                      padding: '0 7px',
                      lineHeight: '19px',
                      border: '1px dashed var(--border-med)',
                      color: 'var(--fg-faint)',
                      background: 'transparent',
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Warmth Score */}
              {contact && (() => {
                const score = calculateWarmthScore(contact, interactionCounts?.[contact.id] || 0);
                const color = getScoreColor(score);
                const label = getScoreLabel(score);
                return (
                  <div>
                    <div style={fieldLabelStyle}>Warmth Score</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[26px] font-bold" style={{ color }}>{score}</span>
                      <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
                    </div>
                    <div
                      className="rounded-full overflow-hidden mt-1"
                      style={{ width: '100%', height: 4, background: 'var(--bg-muted2)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${score}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Touches */}
              <div>
                <div style={fieldLabelStyle}>Touches</div>
                <div className="text-[26px] font-bold" style={{ color: 'var(--fg)' }}>
                  {touchCount}
                </div>
              </div>

              {/* Reach out */}
              <div>
                <div style={fieldLabelStyle}>Reach out</div>
                <div className="space-y-1.5">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 rounded text-[12px] font-medium w-full"
                      style={{
                        height: 30,
                        padding: '0 10px',
                        border: '1px solid var(--border)',
                        color: 'var(--fg)',
                      }}
                    >
                      <Phone size={13} /> Call
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 rounded text-[12px] font-medium w-full"
                      style={{
                        height: 30,
                        padding: '0 10px',
                        border: '1px solid var(--border)',
                        color: 'var(--fg)',
                      }}
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}
                  {contact.linkedin_url && (
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded text-[12px] font-medium w-full"
                      style={{
                        height: 30,
                        padding: '0 10px',
                        border: '1px solid var(--border)',
                        color: 'var(--fg)',
                      }}
                    >
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
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
    </Shell>
  );
}
