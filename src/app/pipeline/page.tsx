'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/shell';
import { useContacts } from '@/hooks/use-contacts';
import { usePipelineStages, useMoveContactStage } from '@/hooks/use-pipeline';
import { isPast, isToday, format } from 'date-fns';
import { Settings2 } from 'lucide-react';
import type { ContactWithTags, PipelineStage } from '@/types/database';

// Card field configuration
const CARD_FIELDS = [
  { key: 'role_company', label: 'Role & Company' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'goal', label: 'Goal' },
  { key: 'goal_target_date', label: 'Goal Target Date' },
  { key: 'follow_up', label: 'Follow-Up Date' },
  { key: 'follow_up_type', label: 'Follow-Up Type' },
  { key: 'follow_up_note', label: 'Follow-Up Note' },
  { key: 'tags', label: 'Tags' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
  { key: 'last_contacted', label: 'Last Contacted' },
] as const;

type CardFieldKey = (typeof CARD_FIELDS)[number]['key'];

const DEFAULT_VISIBLE: CardFieldKey[] = ['role_company', 'goal'];

function useCardFields() {
  const [visible, setVisible] = useState<CardFieldKey[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBLE;
    try {
      const stored = localStorage.getItem('pipeline_card_fields');
      return stored ? JSON.parse(stored) : DEFAULT_VISIBLE;
    } catch { return DEFAULT_VISIBLE; }
  });

  const toggle = useCallback((key: CardFieldKey) => {
    setVisible((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem('pipeline_card_fields', JSON.stringify(next));
      return next;
    });
  }, []);

  return { visible, toggle };
}

const AVATAR_COLORS = ['#3f3f46', '#52525b', '#71717a', '#27272a', '#18181b'];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(first: string, last?: string | null) {
  return (first[0] + (last?.[0] || '')).toUpperCase();
}

function CardFieldValue({ field, contact }: { field: CardFieldKey; contact: ContactWithTags }) {
  const cls = "text-[10px] truncate";
  const style = { color: 'var(--fg-faint)' };
  switch (field) {
    case 'role_company': {
      const ctx = [contact.role, contact.company_name].filter(Boolean).join(' · ');
      return ctx ? <div className={cls} style={{ color: 'var(--fg-muted)' }}>{ctx}</div> : null;
    }
    case 'email':
      return contact.email ? <div className={cls} style={style}>{contact.email}</div> : null;
    case 'phone':
      return contact.phone ? <div className={cls} style={style}>{contact.phone}</div> : null;
    case 'goal':
      return contact.goal ? <div className={cls} style={{ ...style, fontStyle: 'italic' }}>{contact.goal}</div> : null;
    case 'goal_target_date':
      return contact.goal_target_date ? <div className={cls} style={style}>Target: {format(new Date(contact.goal_target_date + 'T00:00:00'), 'MMM d, yyyy')}</div> : null;
    case 'follow_up':
      return contact.follow_up_date ? <div className={cls} style={style}>Follow-up: {format(new Date(contact.follow_up_date + 'T00:00:00'), 'MMM d, yyyy')}</div> : null;
    case 'follow_up_type':
      return contact.follow_up_type ? <div className={cls} style={style}>Type: {contact.follow_up_type}</div> : null;
    case 'follow_up_note':
      return contact.follow_up_note ? <div className={cls} style={style}>{contact.follow_up_note}</div> : null;
    case 'tags':
      return contact.tags?.length ? (
        <div className="flex flex-wrap gap-1">
          {contact.tags.map((t) => (
            <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: t.color + '22', color: t.color }}>{t.label}</span>
          ))}
        </div>
      ) : null;
    case 'source':
      return contact.source ? <div className={cls} style={style}>Source: {contact.source}</div> : null;
    case 'status':
      return <div className={cls} style={style}>Status: {contact.status}</div>;
    case 'notes':
      return contact.notes ? <div className={cls} style={{ ...style, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.notes}</div> : null;
    case 'last_contacted':
      return contact.last_contacted_at ? <div className={cls} style={style}>Last contact: {format(new Date(contact.last_contacted_at), 'MMM d, yyyy')}</div> : null;
    default:
      return null;
  }
}

function ContactCard({
  contact,
  stages,
  visibleFields,
  onDragStart,
  onMove,
}: {
  contact: ContactWithTags;
  stages: PipelineStage[];
  visibleFields: CardFieldKey[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onMove: (contactId: string, stageId: string) => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // Separate role_company (shown inline with name) from other fields (shown below)
  const showRoleCompany = visibleFields.includes('role_company');
  const extraFields = visibleFields.filter((f) => f !== 'role_company');

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, contact.id)}
      className="cursor-grab active:cursor-grabbing"
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        marginBottom: 6,
        position: 'relative',
      }}
    >
      <div
        className="flex items-center gap-2"
        onClick={() => router.push(`/contacts/${contact.id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div
          className="shrink-0 flex items-center justify-center rounded-full text-[9px] font-medium"
          style={{ width: 24, height: 24, background: getAvatarColor(fullName), color: '#fafafa' }}
        >
          {getInitials(contact.first_name, contact.last_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium truncate" style={{ color: 'var(--fg)' }}>
            {fullName}
          </div>
          {showRoleCompany && <CardFieldValue field="role_company" contact={contact} />}
        </div>
      </div>
      {extraFields.length > 0 && (
        <div className="mt-1 flex flex-col gap-0.5">
          {extraFields.map((f) => (
            <CardFieldValue key={f} field={f} contact={contact} />
          ))}
        </div>
      )}
      {/* Move to stage button */}
      <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border)' }} ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          className="text-[10px] font-medium w-full text-left"
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            color: 'var(--fg-muted)',
            cursor: 'pointer',
          }}
        >
          Move to →
        </button>
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              left: 6,
              right: 6,
              bottom: '100%',
              marginBottom: 2,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,.12)',
              zIndex: 50,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(contact.id, s.id);
                  setShowMenu(false);
                }}
                disabled={s.id === contact.pipeline_stage_id}
                className="w-full text-left flex items-center gap-2 text-[11px]"
                style={{
                  padding: '6px 8px',
                  color: s.id === contact.pipeline_stage_id ? 'var(--fg-faint)' : 'var(--fg)',
                  background: 'transparent',
                  border: 'none',
                  cursor: s.id === contact.pipeline_stage_id ? 'default' : 'pointer',
                }}
                onMouseEnter={(e) => { if (s.id !== contact.pipeline_stage_id) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: s.color, flexShrink: 0 }} />
                {s.label}
                <span className="text-[9px] ml-auto" style={{ color: 'var(--fg-faint)' }}>{s.weight}%</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  contacts,
  allStages,
  visibleFields,
  onDragStart,
  onDrop,
  onMoveContact,
  dragOver,
  setDragOver,
}: {
  stage: PipelineStage;
  contacts: ContactWithTags[];
  allStages: PipelineStage[];
  visibleFields: CardFieldKey[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (stageId: string) => void;
  onMoveContact: (contactId: string, stageId: string) => void;
  dragOver: string | null;
  setDragOver: (id: string | null) => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => { e.preventDefault(); setDragOver(null); onDrop(stage.id); }}
      style={{
        minWidth: 220,
        maxWidth: 260,
        width: 260,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        background: dragOver === stage.id ? 'var(--bg-muted)' : 'var(--bg-subtle)',
        border: `1px solid ${dragOver === stage.id ? stage.color : 'var(--border)'}`,
        transition: 'border-color 150ms, background 150ms',
        maxHeight: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-full"
            style={{ width: 7, height: 7, background: stage.color }}
          />
          <span className="text-[11px] font-medium" style={{ color: 'var(--fg)' }}>
            {stage.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium" style={{ color: 'var(--fg-muted)' }}>
            {contacts.length}
          </span>
          <span className="text-[9px]" style={{ color: 'var(--fg-faint)' }}>
            {stage.weight}%
          </span>
        </div>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        {contacts.length === 0 ? (
          <div className="text-[11px] text-center py-4" style={{ color: 'var(--fg-faint)' }}>
            No contacts
          </div>
        ) : (
          contacts.map((c) => (
            <ContactCard key={c.id} contact={c} stages={allStages} visibleFields={visibleFields} onDragStart={onDragStart} onMove={onMoveContact} />
          ))
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const { data: contacts } = useContacts({});
  const { data: stages } = usePipelineStages();
  const moveContact = useMoveContactStage();
  const [dragContactId, setDragContactId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const fieldSettingsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { visible: visibleFields, toggle: toggleField } = useCardFields();

  // Close field settings on outside click
  useEffect(() => {
    if (!showFieldSettings) return;
    const handler = (e: MouseEvent) => {
      if (fieldSettingsRef.current && !fieldSettingsRef.current.contains(e.target as Node)) setShowFieldSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFieldSettings]);

  const { data: allContacts } = useContacts({});
  const followUpCount = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.filter(
      (c) => c.follow_up_date && (isPast(new Date(c.follow_up_date + 'T00:00:00')) || isToday(new Date(c.follow_up_date + 'T00:00:00')))
    ).length;
  }, [allContacts]);

  const tabTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'people', label: 'People', badge: allContacts?.length || 0 },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'follow-up', label: 'Follow-Up', badge: followUpCount, alert: followUpCount > 0 },
    { key: 'companies', label: 'Companies' },
    { key: 'activity', label: 'Activity' },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'people') router.push('/');
    if (key === 'dashboard') router.push('/dashboard');
    if (key === 'follow-up') router.push('/follow-ups');
    if (key === 'companies') router.push('/companies');
    if (key === 'activity') router.push('/activity');
  };

  // Group contacts by stage
  const grouped = useMemo(() => {
    const map: Record<string, ContactWithTags[]> = {};
    if (stages) {
      for (const s of stages) map[s.id] = [];
    }
    // Add "unassigned" bucket
    map['__unassigned'] = [];
    for (const c of contacts || []) {
      if (c.pipeline_stage_id && map[c.pipeline_stage_id]) {
        map[c.pipeline_stage_id].push(c);
      } else {
        map['__unassigned'].push(c);
      }
    }
    return map;
  }, [contacts, stages]);

  // Pipeline value calculation
  const totalWeightedValue = useMemo(() => {
    if (!stages || !contacts) return 0;
    const stageMap = Object.fromEntries(stages.map((s) => [s.id, s.weight]));
    return contacts.filter((c) => c.pipeline_stage_id).length;
  }, [stages, contacts]);

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDragContactId(contactId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (stageId: string) => {
    if (!dragContactId) return;
    await moveContact.mutateAsync({ contactId: dragContactId, stageId });
    setDragContactId(null);
  };

  // Active stages (sorted), then terminal stages
  const activeStages = (stages || []).filter((s) => s.sort_order <= 8);
  const terminalStages = (stages || []).filter((s) => s.sort_order > 8);

  return (
    <Shell
      tabs={tabTabs}
      activeTab="pipeline"
      onTabChange={handleTabChange}
      showFollowUpDot={followUpCount > 0}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}
        >
          <div>
            <h1 className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>Pipeline</h1>
            <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              {contacts?.filter((c) => c.pipeline_stage_id).length || 0} contacts in pipeline
              {grouped['__unassigned']?.length ? ` · ${grouped['__unassigned'].length} unassigned` : ''}
            </div>
          </div>
          <div className="relative" ref={fieldSettingsRef}>
            <button
              onClick={() => setShowFieldSettings((v) => !v)}
              className="flex items-center gap-1.5 text-[11px]"
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                color: 'var(--fg-muted)',
                cursor: 'pointer',
              }}
            >
              <Settings2 size={13} />
              Card Fields
            </button>
            {showFieldSettings && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,.12)',
                  zIndex: 50,
                  width: 220,
                  padding: '6px 0',
                }}
              >
                <div className="text-[10px] font-medium px-3 py-1.5" style={{ color: 'var(--fg-muted)' }}>
                  Show on cards
                </div>
                {CARD_FIELDS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => toggleField(f.key)}
                    className="w-full text-left flex items-center gap-2 text-[11px]"
                    style={{
                      padding: '5px 12px',
                      color: 'var(--fg)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        border: '1px solid var(--border)',
                        background: visibleFields.includes(f.key) ? 'var(--fg)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: 'var(--bg)',
                        fontSize: 10,
                      }}
                    >
                      {visibleFields.includes(f.key) ? '✓' : ''}
                    </span>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kanban board */}
        <div
          ref={scrollRef}
          className="flex gap-3 px-4 py-3 overflow-x-auto"
          style={{ flex: 1, alignItems: 'stretch' }}
        >
          {/* Unassigned column */}
          {grouped['__unassigned']?.length > 0 && (
            <div
              style={{
                minWidth: 200,
                maxWidth: 220,
                width: 220,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                border: '1px dashed var(--border-med)',
                maxHeight: '100%',
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--fg-muted)' }}>Unassigned</span>
                  <span className="text-[10px]" style={{ color: 'var(--fg-faint)' }}>{grouped['__unassigned'].length}</span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
                {grouped['__unassigned'].map((c) => (
                  <ContactCard key={c.id} contact={c} stages={stages || []} visibleFields={visibleFields} onDragStart={handleDragStart} onMove={(cId, sId) => moveContact.mutateAsync({ contactId: cId, stageId: sId })} />
                ))}
              </div>
            </div>
          )}

          {activeStages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              contacts={grouped[stage.id] || []}
              allStages={stages || []}
              visibleFields={visibleFields}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onMoveContact={(cId, sId) => moveContact.mutateAsync({ contactId: cId, stageId: sId })}
              dragOver={dragOver}
              setDragOver={setDragOver}
            />
          ))}

          {terminalStages.length > 0 && (
            <>
              <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '0 4px' }} />
              {terminalStages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  contacts={grouped[stage.id] || []}
                  allStages={stages || []}
                  visibleFields={visibleFields}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onMoveContact={(cId, sId) => moveContact.mutateAsync({ contactId: cId, stageId: sId })}
                  dragOver={dragOver}
                  setDragOver={setDragOver}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
