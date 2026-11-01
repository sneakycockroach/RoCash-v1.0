/**
 * Transactions API
 * Never throws to the UI. Always returns { data, error }.
 */

import { supabase } from '../lib/supabase.ts';
import type { ApiResponse, Transaction, TransactionType } from '../types.ts';

// Helper to normalize amount to JavaScript number
function normalizeTransaction(row: any): Transaction {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as TransactionType,
    amount: Number(row.amount ?? 0),
    currency: row.currency || 'UGX',
    category_id: row.category_id ?? null,
    note: row.note ?? null,
    occurred_on: row.occurred_on,
    occurred_at: row.occurred_at,
    deleted_at: row.deleted_at ?? null,
  };
}

export async function createTransaction({
  type,
  amount,
  categoryId,
  note,
  occurredOn,
  occurredAt,
}: {
  type: TransactionType;
  amount: number;
  categoryId?: string | null;
  note?: string | null;
  occurredOn: string;
  occurredAt?: string;
}): Promise<ApiResponse<Transaction>> {
  try {
    // Validation: Expenses require a category; savings must have none.
    if (type === 'expense' && (!categoryId || categoryId.trim() === '')) {
      return { data: null, error: 'Expenses require a category' };
    }

    const finalCategoryId = type === 'saving' ? null : (categoryId || null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: authError ? authError.message : 'No authenticated user' };
    }

    // Generate id on the client with crypto.randomUUID()
    const id = crypto.randomUUID();
    const cleanAmount = Math.round(Number(amount) || 0);
    const finalOccurredAt = occurredAt || new Date().toISOString();

    const insertPayload = {
      id,
      user_id: authData.user.id,
      type,
      amount: cleanAmount,
      currency: 'UGX',
      category_id: finalCategoryId,
      note: note ? note.trim() : null,
      occurred_on: occurredOn,
      occurred_at: finalOccurredAt,
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      // If the insert fails with a duplicate key (code 23505) treat it as success (idempotent retry)
      if (error.code === '23505') {
        const { data: existing, error: fetchErr } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (existing) {
          return { data: normalizeTransaction(existing), error: null };
        }
        if (fetchErr) {
          return { data: null, error: fetchErr.message };
        }
      }
      return { data: null, error: error.message };
    }

    return { data: normalizeTransaction(data), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function listTransactions({
  from,
  to,
  type,
  categoryId,
  search,
  limit,
}: {
  from?: string;
  to?: string;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  limit?: number;
} = {}): Promise<ApiResponse<Transaction[]>> {
  try {
    // Newest first, excluding rows where deleted_at is set
    let query = supabase
      .from('transactions')
      .select('*')
      .is('deleted_at', null)
      .order('occurred_on', { ascending: false })
      .order('occurred_at', { ascending: false });

    if (from) {
      query = query.gte('occurred_on', from);
    }
    if (to) {
      query = query.lte('occurred_on', to);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (search && search.trim() !== '') {
      query = query.ilike('note', `%${search.trim()}%`);
    }
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      return { data: null, error: error.message };
    }

    const list = (data || []).map(normalizeTransaction);
    return { data: list, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>
): Promise<ApiResponse<Transaction>> {
  try {
    const updatePayload: Record<string, any> = { ...patch };
    if (updatePayload.amount !== undefined) {
      updatePayload.amount = Math.round(Number(updatePayload.amount) || 0);
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: normalizeTransaction(data), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function softDeleteTransaction(id: string): Promise<ApiResponse<Transaction>> {
  try {
    // Sets deleted_at
    const { data, error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: normalizeTransaction(data), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function undoDeleteTransaction(id: string): Promise<ApiResponse<Transaction>> {
  try {
    // Restores deleted transaction
    const { data, error } = await supabase
      .from('transactions')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: normalizeTransaction(data), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}
