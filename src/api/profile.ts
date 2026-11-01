/**
 * Profile API
 * Never throws to the UI. Always returns { data, error }.
 */

import { supabase } from '../lib/supabase.ts';
import type { ApiResponse, Profile } from '../types.ts';

export async function getProfile(): Promise<ApiResponse<Profile>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: authError ? authError.message : 'No authenticated user' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function updateProfile(patch: Partial<Profile>): Promise<ApiResponse<Profile>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: authError ? authError.message : 'No authenticated user' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', authData.user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}
