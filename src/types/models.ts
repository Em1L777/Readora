import { ProfileRow, BookRow, ReadingSessionRow, BookStatus, UserRole } from './database.types';

export interface ChildProfile extends ProfileRow {
  role: 'child';
  parent_id: string;
}

export interface ParentProfile extends ProfileRow {
  role: 'parent' | 'admin';
}

export interface BookItem extends BookRow {
  progressPercentage: number;
}

export interface ReadingProgressCalculation {
  pagesRead: number;
  xpEarned: number;
  bonusXp: number;
  willLevelUp: boolean;
  projectedLevel: number;
  projectedXp: number;
}

export interface AuthState {
  session: import('@supabase/supabase-js').Session | null;
  user: import('@supabase/supabase-js').User | null;
  parentProfile: ParentProfile | null;
  children: ChildProfile[];
  activeChildId: string | null;
  isParentUnlocked: boolean;
  lastParentUnlockTimestamp: number | null;
  isLoading: boolean;
  error: string | null;
}
