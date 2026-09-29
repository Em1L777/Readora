import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { ChildProfile, ParentProfile } from '../types/models';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';

interface AuthState {
  session: Session | null;
  user: User | null;
  parentProfile: ParentProfile | null;
  children: ChildProfile[];
  activeChildId: string | null;
  isParentUnlocked: boolean;
  lastParentUnlockTimestamp: number | null;
  isLoading: boolean;
  error: string | null;

  // Selectors / Helpers
  getActiveChild: () => ChildProfile | null;

  // Actions
  initialize: () => Promise<void>;
  setActiveChildId: (childId: string) => Promise<void>;
  unlockParent: (pin: string) => boolean;
  lockParent: () => void;
  refreshProfiles: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  parentProfile: null,
  children: [],
  activeChildId: null,
  isParentUnlocked: false,
  lastParentUnlockTimestamp: null,
  isLoading: true,
  error: null,

  getActiveChild: () => {
    const { children, activeChildId } = get();
    if (!activeChildId) return children[0] || null;
    return children.find((c) => c.id === activeChildId) || children[0] || null;
  },

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // 1. Initial Session Check
      const session = await authService.getSession();
      if (!session) {
        set({
          session: null,
          user: null,
          parentProfile: null,
          children: [],
          activeChildId: null,
          isLoading: false,
        });
      } else {
        set({ session, user: session.user });
        await get().refreshProfiles();
      }

      // 2. Auth State Change Listener
      authService.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          await profileService.setStoredActiveChildId(null);
          set({
            session: null,
            user: null,
            parentProfile: null,
            children: [],
            activeChildId: null,
            isParentUnlocked: false,
            lastParentUnlockTimestamp: null,
            isLoading: false,
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          set({ session: newSession, user: newSession.user });
          await get().refreshProfiles();
        }
      });
    } catch (err: unknown) {
      console.error('Failed to initialize auth state:', err);
      const message = err instanceof Error ? err.message : 'Auth initialization failed';
      set({ error: message, isLoading: false });
    }
  },

  setActiveChildId: async (childId: string) => {
    try {
      await profileService.setStoredActiveChildId(childId);
      set({ activeChildId: childId });
    } catch (err: unknown) {
      console.error('Failed to persist active child ID:', err);
      set({ activeChildId: childId });
    }
  },

  unlockParent: (pin: string) => {
    const { parentProfile } = get();
    if (!parentProfile || !parentProfile.pin_hash) {
      return false;
    }

    const isValid = profileService.verifyParentPin(parentProfile, pin);
    if (isValid) {
      set({
        isParentUnlocked: true,
        lastParentUnlockTimestamp: Date.now(),
        error: null,
      });
      return true;
    }
    return false;
  },

  lockParent: () => {
    set({
      isParentUnlocked: false,
      lastParentUnlockTimestamp: null,
    });
  },

  refreshProfiles: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // 1. Load Parent Profile
      const parentProfile = await profileService.getParentProfile(user.id);
      if (!parentProfile) {
        set({
          parentProfile: null,
          children: [],
          activeChildId: null,
          isLoading: false,
        });
        return;
      }

      // 2. Load Children Profiles
      const children = await profileService.getChildren(parentProfile.id);

      // 3. Resolve Active Child ID
      const storedChildId = await profileService.getStoredActiveChildId();
      let activeChildId = storedChildId;

      if (!activeChildId || !children.some((c) => c.id === activeChildId)) {
        activeChildId = children.length > 0 ? children[0].id : null;
        if (activeChildId) {
          await profileService.setStoredActiveChildId(activeChildId);
        }
      }

      set({
        parentProfile,
        children,
        activeChildId,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      console.error('Failed to refresh profiles:', err);
      const message = err instanceof Error ? err.message : 'Failed to refresh profiles';
      set({ error: message, isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await authService.signOut();
      await profileService.setStoredActiveChildId(null);
      set({
        session: null,
        user: null,
        parentProfile: null,
        children: [],
        activeChildId: null,
        isParentUnlocked: false,
        lastParentUnlockTimestamp: null,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      console.error('Error signing out:', err);
      const message = err instanceof Error ? err.message : 'Error signing out';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
