import { create } from 'zustand';
import { BookRow, LogReadingSessionResult } from '../types/database.types';
import { readingService } from '../services/reading.service';

interface ReadingSessionState {
  isSessionActive: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  goalMinutes: number;
  book: BookRow | null;
  startPage: number;
  currentReadingPage: number;
  lastResult: LogReadingSessionResult | null;
  isSaving: boolean;
  error: string | null;

  // Actions
  startSession: (book: BookRow, goalMinutes?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  tick: () => void;
  incrementPage: () => void;
  decrementPage: () => void;
  setCurrentReadingPage: (page: number) => void;
  finishSession: (childId: string, endPage: number) => Promise<LogReadingSessionResult>;
  resetSession: () => void;
}

export const useReadingSessionStore = create<ReadingSessionState>((set, get) => ({
  isSessionActive: false,
  isPaused: false,
  elapsedSeconds: 0,
  goalMinutes: 20,
  book: null,
  startPage: 1,
  currentReadingPage: 1,
  lastResult: null,
  isSaving: false,
  error: null,

  startSession: (book: BookRow, goalMinutes = 20) => {
    set({
      isSessionActive: true,
      isPaused: false,
      elapsedSeconds: 0,
      goalMinutes,
      book,
      startPage: book.current_page,
      currentReadingPage: book.current_page,
      lastResult: null,
      error: null,
    });
  },

  pauseSession: () => set({ isPaused: true }),

  resumeSession: () => set({ isPaused: false }),

  tick: () => {
    const { isSessionActive, isPaused } = get();
    if (isSessionActive && !isPaused) {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }
  },

  incrementPage: () => {
    const { book, currentReadingPage } = get();
    if (!book) return;
    const max = book.total_pages;
    if (currentReadingPage < max) {
      set({ currentReadingPage: currentReadingPage + 1 });
    }
  },

  decrementPage: () => {
    const { startPage, currentReadingPage } = get();
    if (currentReadingPage > startPage) {
      set({ currentReadingPage: currentReadingPage - 1 });
    }
  },

  setCurrentReadingPage: (page: number) => {
    const { book, startPage } = get();
    if (!book) return;
    const bounded = Math.max(startPage, Math.min(book.total_pages, page));
    set({ currentReadingPage: bounded });
  },

  finishSession: async (childId: string, endPage: number) => {
    const { book, elapsedSeconds } = get();
    if (!book) throw new Error('No active session book');

    try {
      set({ isSaving: true, error: null });

      // Calculate elapsed minutes (at least 1 min if timer ran for > 30s)
      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

      const result = await readingService.logReadingSession(
        book.id,
        childId,
        durationMinutes,
        endPage
      );

      set({
        lastResult: result,
        isSessionActive: false,
        isPaused: false,
        isSaving: false,
      });

      return result;
    } catch (err: any) {
      console.error('Failed to log reading session:', err);
      set({
        error: err.message || 'Failed to log session',
        isSaving: false,
      });
      throw err;
    }
  },

  resetSession: () => {
    set({
      isSessionActive: false,
      isPaused: false,
      elapsedSeconds: 0,
      book: null,
      startPage: 1,
      currentReadingPage: 1,
      lastResult: null,
      error: null,
    });
  },
}));
