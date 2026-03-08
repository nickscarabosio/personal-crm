'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronDown, Trash2, CalendarDays, MessageSquare, Tag, Activity, Clock } from 'lucide-react';
import { Check } from 'lucide-react';
import type { Tag as TagType } from '@/types/database';
import {
  useBulkUpdateContacts,
  useBulkAddTags,
  useBulkRemoveTags,
  useBulkAddNote,
  useDeleteContact,
} from '@/hooks/use-contacts';

type BulkActionBarProps = {
  selectedIds: string[];
  tags: TagType[];
  onClearSelection: () => void;
};

const STATUS_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: 'active', label: 'Active', dot: '#22c55e' },
  { value: 'lead', label: 'Lead (Warm)', dot: '#ca8a04' },
  { value: 'dormant', label: 'Dormant', dot: '#a1a1aa' },
  { value: 'closed', label: 'Closed', dot: '#ef4444' },
];

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--fg)',
        color: 'var(--bg)',
        fontSize: 13,
        fontWeight: 500,
        padding: '8px 16px',
        borderRadius: 8,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'bulkToastIn 0.2s ease-out',
      }}
    >
      {message}
      <style>{`
        @keyframes bulkToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function DropdownButton({
  label,
  icon,
  children,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        style={{
          height: 30,
          padding: '0 10px',
          fontSize: 12,
          fontWeight: 500,
          borderRadius: 6,
          border: '1px solid var(--border-med)',
          background: 'var(--bg)',
          color: 'var(--fg)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        {label}
        <ChevronDown size={11} />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow)',
            zIndex: 100,
            minWidth: 180,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function BulkActionBar({ selectedIds, tags, onClearSelection }: BulkActionBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tagMode, setTagMode] = useState<'add' | 'remove'>('add');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);

  const bulkUpdate = useBulkUpdateContacts();
  const bulkAddTags = useBulkAddTags();
  const bulkRemoveTags = useBulkRemoveTags();
  const bulkAddNote = useBulkAddNote();
  const deleteContact = useDeleteContact();

  const count = selectedIds.length;

  useClickOutside(noteRef, useCallback(() => {
    setNoteOpen(false);
    setNoteText('');
  }, []));

  const showToast = (msg: string) => {
    setToast(msg);
  };

  const handleStatusUpdate = async (status: string) => {
    await bulkUpdate.mutateAsync({
      ids: selectedIds,
      update: { status: status as 'active' | 'lead' | 'dormant' | 'closed' },
    });
    setOpenDropdown(null);
    showToast(`Updated ${count} contact${count !== 1 ? 's' : ''}`);
  };

  const handleTagApply = async () => {
    if (selectedTagIds.length === 0) return;
    if (tagMode === 'add') {
      await bulkAddTags.mutateAsync({ contactIds: selectedIds, tagIds: selectedTagIds });
    } else {
      await bulkRemoveTags.mutateAsync({ contactIds: selectedIds, tagIds: selectedTagIds });
    }
    setOpenDropdown(null);
    setSelectedTagIds([]);
    showToast(`${tagMode === 'add' ? 'Added' : 'Removed'} tags on ${count} contact${count !== 1 ? 's' : ''}`);
  };

  const handleFollowUp = async (date: string) => {
    await bulkUpdate.mutateAsync({
      ids: selectedIds,
      update: { follow_up_date: date },
    });
    setOpenDropdown(null);
    showToast(`Set follow-up for ${count} contact${count !== 1 ? 's' : ''}`);
  };

  const handleLastContacted = async (date: string) => {
    await bulkUpdate.mutateAsync({
      ids: selectedIds,
      update: { last_contacted_at: date },
    });
    setOpenDropdown(null);
    showToast(`Updated ${count} contact${count !== 1 ? 's' : ''}`);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await bulkAddNote.mutateAsync({ contactIds: selectedIds, summary: noteText.trim() });
    setNoteOpen(false);
    setNoteText('');
    showToast(`Added note to ${count} contact${count !== 1 ? 's' : ''}`);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteContact.mutateAsync(id);
    }
    setConfirmDelete(false);
    onClearSelection();
    showToast(`Deleted ${count} contact${count !== 1 ? 's' : ''}`);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          marginBottom: 8,
          background: 'var(--bg-muted)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          overflowX: 'auto',
          animation: 'bulkBarIn 0.15s ease-out',
        }}
      >
        <style>{`
          @keyframes bulkBarIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Left: count + clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', whiteSpace: 'nowrap' }}>
            {count} selected
          </span>
          <button
            onClick={onClearSelection}
            style={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              border: 'none',
              background: 'none',
              color: 'var(--fg-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Clear selection"
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        {/* Status dropdown */}
        <DropdownButton
          label="Status"
          icon={<Activity size={12} />}
          isOpen={openDropdown === 'status'}
          onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
          onClose={() => { if (openDropdown === 'status') setOpenDropdown(null); }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusUpdate(opt.value)}
              style={{
                width: '100%',
                height: 32,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--fg)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />
              {opt.label}
            </button>
          ))}
        </DropdownButton>

        {/* Tags dropdown */}
        <DropdownButton
          label="Tags"
          icon={<Tag size={12} />}
          isOpen={openDropdown === 'tags'}
          onToggle={() => {
            setOpenDropdown(openDropdown === 'tags' ? null : 'tags');
            setSelectedTagIds([]);
          }}
          onClose={() => { if (openDropdown === 'tags') { setOpenDropdown(null); setSelectedTagIds([]); } }}
        >
          <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setTagMode('add')}
                style={{
                  flex: 1,
                  height: 26,
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: tagMode === 'add' ? 'var(--fg)' : 'var(--bg)',
                  color: tagMode === 'add' ? 'var(--bg)' : 'var(--fg)',
                  cursor: 'pointer',
                }}
              >
                Add tags
              </button>
              <button
                onClick={() => setTagMode('remove')}
                style={{
                  flex: 1,
                  height: 26,
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: tagMode === 'remove' ? 'var(--fg)' : 'var(--bg)',
                  color: tagMode === 'remove' ? 'var(--bg)' : 'var(--fg)',
                  cursor: 'pointer',
                }}
              >
                Remove tags
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 170, overflowY: 'auto' }}>
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTag(t.id)}
                style={{
                  width: '100%',
                  height: 32,
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--fg)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: '1px solid var(--border-med)',
                    background: selectedTagIds.includes(t.id) ? 'var(--fg)' : 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {selectedTagIds.includes(t.id) && <Check size={9} style={{ color: 'var(--bg)' }} />}
                </div>
                <span
                  style={{
                    height: 19,
                    padding: '0 7px',
                    fontSize: 10,
                    fontWeight: 500,
                    lineHeight: '19px',
                    borderRadius: 9999,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-muted)',
                    color: 'var(--fg-muted)',
                  }}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          {selectedTagIds.length > 0 && (
            <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleTagApply}
                style={{
                  width: '100%',
                  height: 28,
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 4,
                  border: 'none',
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  cursor: 'pointer',
                }}
              >
                {tagMode === 'add' ? 'Add' : 'Remove'} {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </DropdownButton>

        {/* Follow-Up date picker */}
        <DropdownButton
          label="Follow-Up"
          icon={<CalendarDays size={12} />}
          isOpen={openDropdown === 'followup'}
          onToggle={() => setOpenDropdown(openDropdown === 'followup' ? null : 'followup')}
          onClose={() => { if (openDropdown === 'followup') setOpenDropdown(null); }}
        >
          <div style={{ padding: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 500, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>
              Set follow-up date
            </label>
            <input
              type="date"
              onChange={(e) => {
                if (e.target.value) handleFollowUp(e.target.value);
              }}
              style={{
                width: '100%',
                height: 30,
                fontSize: 12,
                padding: '0 8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            />
          </div>
        </DropdownButton>

        {/* Last Contacted date picker */}
        <DropdownButton
          label="Last Touch"
          icon={<Clock size={12} />}
          isOpen={openDropdown === 'lastcontacted'}
          onToggle={() => setOpenDropdown(openDropdown === 'lastcontacted' ? null : 'lastcontacted')}
          onClose={() => { if (openDropdown === 'lastcontacted') setOpenDropdown(null); }}
        >
          <div style={{ padding: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 500, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>
              Set last contacted
            </label>
            <input
              type="date"
              onChange={(e) => {
                if (e.target.value) handleLastContacted(new Date(e.target.value).toISOString());
              }}
              style={{
                width: '100%',
                height: 30,
                fontSize: 12,
                padding: '0 8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                marginBottom: 6,
              }}
            />
            <button
              onClick={() => handleLastContacted(new Date().toISOString())}
              style={{
                width: '100%',
                height: 28,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                border: '1px solid var(--border-med)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                cursor: 'pointer',
              }}
            >
              Now
            </button>
          </div>
        </DropdownButton>

        {/* Add Note */}
        <div ref={noteRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setNoteOpen(!noteOpen); setOpenDropdown(null); }}
            style={{
              height: 30,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              border: '1px solid var(--border-med)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
            }}
          >
            <MessageSquare size={12} />
            Note
          </button>
          {noteOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: 'var(--shadow)',
                zIndex: 100,
                width: 260,
                padding: 8,
              }}
            >
              <label style={{ fontSize: 10, fontWeight: 500, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>
                Add note to {count} contact{count !== 1 ? 's' : ''}
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type a note..."
                rows={3}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                style={{
                  width: '100%',
                  height: 28,
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 4,
                  border: 'none',
                  background: noteText.trim() ? 'var(--fg)' : 'var(--bg-muted2)',
                  color: noteText.trim() ? 'var(--bg)' : 'var(--fg-faint)',
                  cursor: noteText.trim() ? 'pointer' : 'default',
                  marginTop: 6,
                }}
              >
                Add Note
              </button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Separator before delete */}
        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        {/* Delete */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                height: 30,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border: '1px solid var(--border-med)',
                background: 'var(--bg)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={handleBulkDelete}
                style={{
                  height: 30,
                  padding: '0 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Confirm Delete ({count})
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  height: 30,
                  padding: '0 8px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid var(--border-med)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
