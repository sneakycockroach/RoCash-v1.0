/**
 * Goals API
 * Never throws to the UI. Always returns { data, error }.
 */

import { supabase } from '../lib/supabase.ts';
import type { ApiResponse, Goal } from '../types.ts';

export async function setDailyGoal(
  amount: number,
  effectiveFrom: string
): Promise<ApiResponse<Goal>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: authError ? authError.message : 'No authenticated user' };
    }

    const cleanAmount = Math.round(Number(amount) || 0);

    const { data, error } = await supabase
      .from('goals')
      .upsert(
        {
          user_id: authData.user.id,
          daily_amount: cleanAmount,
          effective_from: effectiveFrom,
        },
        { onConflict: 'user_id,effective_from' }
      )
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        id: data.id,
        user_id: data.user_id,
        daily_amount: Number(data.daily_amount ?? 0),
        effective_from: data.effective_from,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function getCurrentGoal(date: string): Promise<ApiResponse<Goal | null>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: authError ? authError.message : 'No authenticated user' };
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', authData.user.id)
      .lte('effective_from', date)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: data.id,
        user_id: data.user_id,
        daily_amount: Number(data.daily_amount ?? 0),
        effective_from: data.effective_from,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function listGoals(): Promise<ApiResponse<Goal[]>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: authError ? authError.message : 'No authenticated user' };
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('effective_from', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const items: Goal[] = (data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      daily_amount: Number(row.daily_amount ?? 0),
      effective_from: row.effective_from,
    }));

    return { data: items, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}
