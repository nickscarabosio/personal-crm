import type { Contact, ContactWithTags } from '@/types/database';

/**
 * Calculate warmth score (0-100) based on:
 * - Recency: 0-7 days = 50pts, 8-14 = 40, 15-30 = 30, 31-60 = 15, 60+ = 0
 * - Frequency: each interaction in last 90 days = 10pts (max 50pts)
 */
export function calculateWarmthScore(
  contact: Contact | ContactWithTags,
  recentInteractionCount: number
): number {
  // Recency score
  let recencyScore = 0;
  if (contact.last_contacted_at) {
    const daysSince = Math.floor(
      (Date.now() - new Date(contact.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 7) recencyScore = 50;
    else if (daysSince <= 14) recencyScore = 40;
    else if (daysSince <= 30) recencyScore = 30;
    else if (daysSince <= 60) recencyScore = 15;
    else recencyScore = 0;
  }

  // Frequency score: each interaction in last 90 days = 10pts, max 50
  const frequencyScore = Math.min(recentInteractionCount * 10, 50);

  return recencyScore + frequencyScore;
}

/**
 * Returns the color for a warmth score
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#ca8a04';
  return '#ef4444';
}

/**
 * Returns the label for a warmth score
 */
export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cold';
}
