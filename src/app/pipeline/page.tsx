'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/shell';
import { useContacts } from '@/hooks/use-contacts';
import { usePipelineStages, useMoveContactStage } from '@/hooks/use-pipeline';
import { isPast, isToday } from 'date-fns';
import type { ContactWithTags, PipelineStage } from '@/types/database';

const AVATAR_COLORS = ['#3f3f46', '#52525b', '#71717a', '#27272a', '#18181b'];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(first: string, last?: string | null) {
  return (first[0] + (last?.[0] || '')).toUpperCase();
}

function ContactCard({
  contact,
  onDragStart,
}: {
  contact: ContactWithTags;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const router = useRouter();
  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
  const context = [contact.role, contact.company_name].filter(Boolean).join(' · ');

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, contact.id)}
      onClick={() => router.push(`/contacts/${contact.id}`)}
      className="cursor-grab active:cursor-grabbing"
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        marginBottom: 6,
      }}
    >
      <div className="flex items-center gap-2">
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
          {context && (
            <div className="text-[10px] truncate" style={{ color: 'var(--fg-muted)' }}>
              {context}
            </div>
          )}
        </div>
      </div>
      {contact.goal && (
        <div className="text-[10px] mt-1 truncate" style={{ color: 'var(--fg-faint)', fontStyle: 'italic' }}>
          {contact.goal}
        </div>
      )}
    </div>
  );
}

function StageColumn({
  stage,
  contacts,
  onDragStart,
  onDrop,
  dragOver,
  setDragOver,
}: {
  stage: PipelineStage;
  contacts: ContactWithTags[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (stageId: string) => void;
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
            <ContactCard key={c.id} contact={c} onDragStart={onDragStart} />
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
                  <ContactCard key={c.id} contact={c} onDragStart={handleDragStart} />
                ))}
              </div>
            </div>
          )}

          {activeStages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              contacts={grouped[stage.id] || []}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
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
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
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
