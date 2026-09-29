import { supabase } from './supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const authService = {
  /**
   * Registers a new parent user with Supabase Auth.
   * A database trigger `on_auth_user_created` creates the parent profile automatically.
   */
  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs in an existing parent with email and password.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs out current user and clears session tokens from AsyncStorage.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Retrieves the current Supabase session.
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Subscribes to auth state changes.
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Sends a password reset email for parents who forgot their credentials.
   */
  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
    return data;
  },
};
