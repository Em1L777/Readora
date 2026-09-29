import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { ProfileRow, ProfileInsert, ProfileUpdate } from '../types/database.types';
import { ChildProfile, ParentProfile } from '../types/models';
import { hashPin, verifyPin } from '../utils/crypto';

const ACTIVE_CHILD_STORAGE_KEY = '@readora_active_child_id';

export const profileService = {
  /**
   * Fetches the Parent or Admin profile corresponding to the Supabase auth_id.
   */
  async getParentProfile(authId: string): Promise<ParentProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authId)
      .in('role', ['parent', 'admin'])
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as ParentProfile) || null;
  },

  /**
   * Fetches all child profiles belonging to a parent.
   */
  async getChildren(parentId: string): Promise<ChildProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('parent_id', parentId)
      .eq('role', 'child')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ChildProfile[]) || [];
  },

  /**
   * Creates a new child profile under the specified parent.
   */
  async createChild(parentId: string, displayName: string, avatarUrl?: string): Promise<ChildProfile> {
    const newChild: ProfileInsert = {
      parent_id: parentId,
      role: 'child',
      display_name: displayName.trim(),
      avatar_url: avatarUrl || null,
      xp: 0,
      level: 1,
      current_streak: 0,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newChild)
      .select('*')
      .single();

    if (error) throw error;
    return data as ChildProfile;
  },

  /**
   * Updates an existing profile (child or parent).
   */
  async updateProfile(profileId: string, updates: ProfileUpdate): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Sets or updates the 4-digit PIN for parent zone access.
   */
  async setParentPin(parentProfileId: string, rawPin: string): Promise<void> {
    const pin_hash = hashPin(rawPin);
    const { error } = await supabase
      .from('profiles')
      .update({ pin_hash })
      .eq('id', parentProfileId);

    if (error) throw error;
  },

  /**
   * Validates a raw 4-digit PIN against the hashed PIN in the parent profile.
   */
  verifyParentPin(parentProfile: ParentProfile, rawPin: string): boolean {
    return verifyPin(rawPin, parentProfile.pin_hash);
  },

  /**
   * Persists active child ID in local storage for fast session restoration.
   */
  async setStoredActiveChildId(childId: string | null): Promise<void> {
    if (childId) {
      await AsyncStorage.setItem(ACTIVE_CHILD_STORAGE_KEY, childId);
    } else {
      await AsyncStorage.removeItem(ACTIVE_CHILD_STORAGE_KEY);
    }
  },

  /**
   * Reads persisted active child ID from local storage.
   */
  async getStoredActiveChildId(): Promise<string | null> {
    return AsyncStorage.getItem(ACTIVE_CHILD_STORAGE_KEY);
  },
};
