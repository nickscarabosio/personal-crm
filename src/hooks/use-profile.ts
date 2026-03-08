'use client';

import { useState, useEffect, useCallback } from 'react';

type Profile = {
  name: string;
  initials: string;
  avatarUrl: string | null;
};

const STORAGE_KEY = 'nexus_profile';

const defaultProfile: Profile = {
  name: 'Nick Scarabosio',
  initials: 'NK',
  avatarUrl: null,
};

function load(): Profile {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {}
  return defaultProfile;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  useEffect(() => {
    setProfile(load());
  }, []);

  const update = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Dispatch a storage event so other components re-render
      window.dispatchEvent(new Event('nexus_profile_update'));
      return next;
    });
  }, []);

  // Listen for updates from other components
  useEffect(() => {
    const handler = () => setProfile(load());
    window.addEventListener('nexus_profile_update', handler);
    return () => window.removeEventListener('nexus_profile_update', handler);
  }, []);

  return { profile, update };
}
