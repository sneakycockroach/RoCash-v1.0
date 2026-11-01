/**
 * Categories API
 * Never throws to the UI. Always returns { data, error }.
 */

import { supabase } from '../lib/supabase.ts';
import type { ApiResponse, Category } from '../types.ts';

export async function listCategories({
  includeArchived = false,
}: {
  includeArchived?: boolean;
} = {}): Promise<ApiResponse<Category[]>> {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) {
      return { data: null, error: error.message };
    }

    const items: Category[] = (data || []).map(row => ({
      ...row,
      sort_order: Number(row.sort_order ?? 0),
    }));

    return { data: items, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function createCategory({
  name,
  icon,
  color,
}: {
  name: string;
  icon: string;
  color: string;
}): Promise<ApiResponse<Category>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: authError ? authError.message : 'No authenticated user' };
    }

    // Determine highest sort_order
    const { data: existing } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('user_id', authData.user.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existing && existing.length > 0 ? (Number(existing[0].sort_order) + 1) : 0;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: authData.user.id,
        name,
        icon,
        color,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        sort_order: Number(data.sort_order ?? 0),
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function updateCategory(
  id: string,
  patch: Partial<Category>
): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        sort_order: Number(data.sort_order ?? 0),
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function archiveCategory(id: string): Promise<ApiResponse<Category>> {
  try {
    // Sets archived_at, never deletes
    const { data, error } = await supabase
      .from('categories')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        sort_order: Number(data.sort_order ?? 0),
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function reorderCategories(ids: string[]): Promise<ApiResponse<boolean>> {
  try {
    const updates = ids.map((id, index) =>
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error);
    if (firstError && firstError.error) {
      return { data: null, error: firstError.error.message };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}
