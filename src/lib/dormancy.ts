import type { Contact, ContactWithTags } from '@/types/database';

/**
 * Returns true if a contact is at risk of going dormant:
 * - Status is "active"
 * - Last contacted more than 30 days ago (or never contacted)
 */
export function isDormantRisk(contact: Contact | ContactWithTags): boolean {
  if (contact.status !== 'active') return false;
  if (!contact.last_contacted_at) return true;
  const lastTouch = new Date(contact.last_contacted_at);
  const daysSince = Math.floor((Date.now() - lastTouch.getTime()) / (1000 * 60 * 60 * 24));
  return daysSince > 30;
}

/**
 * Returns the number of days since last contact, or null if never contacted.
 */
export function daysSinceLastTouch(contact: Contact | ContactWithTags): number | null {
  if (!contact.last_contacted_at) return null;
  const lastTouch = new Date(contact.last_contacted_at);
  return Math.floor((Date.now() - lastTouch.getTime()) / (1000 * 60 * 60 * 24));
}
