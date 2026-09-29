import { supabase } from './supabase';
import { LogReadingSessionResult } from '../types/database.types';

export const readingService = {
  /**
   * Invokes the atomic RPC stored procedure log_reading_session.
   * Updates book progress, inserts a reading session, computes XP, level up, and streak.
   */
  async logReadingSession(
    bookId: string,
    childId: string,
    durationMinutes: number,
    endPage: number
  ): Promise<LogReadingSessionResult> {
    const { data, error } = await supabase.rpc('log_reading_session', {
      p_book_id: bookId,
      p_child_id: childId,
      p_duration_minutes: durationMinutes,
      p_end_page: endPage,
    });

    if (error) throw error;
    return data as LogReadingSessionResult;
  },

  /**
   * Pure client calculation for real-time live preview during active reading.
   */
  calculateSessionPreview(
    startPage: number,
    endPage: number,
    totalPages: number,
    durationMinutes: number
  ) {
    const pagesRead = Math.max(0, endPage - startPage);
    let xpEarned = 0;
    let bonusXp = 0;

    if (pagesRead > 0) {
      xpEarned = pagesRead * 1 + durationMinutes * 5;
      if (endPage === totalPages) {
        bonusXp = 100;
        xpEarned += bonusXp;
      }
    }

    return {
      pagesRead,
      xpEarned,
      bonusXp,
      isCompleted: endPage === totalPages,
    };
  },

  /**
   * Fetches aggregated analytics for a child from Supabase reading_sessions.
   */
  async getChildAnalytics(childId: string) {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('duration_minutes, start_page, end_page, session_date')
      .eq('child_id', childId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalPagesRead: 0,
        totalMinutesRead: 0,
        totalSessionsCount: 0,
        avgSessionMinutes: 0,
        avgPagesPerDay: 0,
        todayMinutesRead: 0,
      };
    }

    let totalPages = 0;
    let totalMinutes = 0;
    let todayMinutes = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const uniqueDays = new Set<string>();

    for (const session of data) {
      const pages = Math.max(0, (session.end_page || 0) - (session.start_page || 0));
      totalPages += pages;
      totalMinutes += session.duration_minutes || 0;
      if (session.session_date) {
        uniqueDays.add(session.session_date);
        if (session.session_date === todayStr) {
          todayMinutes += session.duration_minutes || 0;
        }
      }
    }

    const totalSessionsCount = data.length;
    const avgSessionMinutes = totalSessionsCount > 0 ? Math.round(totalMinutes / totalSessionsCount) : 0;
    const daysCount = Math.max(1, uniqueDays.size);
    const avgPagesPerDay = Math.round(totalPages / daysCount);

    return {
      totalPagesRead: totalPages,
      totalMinutesRead: totalMinutes,
      totalSessionsCount,
      avgSessionMinutes,
      avgPagesPerDay,
      todayMinutesRead: todayMinutes,
    };
  },
};
