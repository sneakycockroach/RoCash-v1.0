/**
 * Database Functions via supabase.rpc
 * Params named exactly as specified.
 * Numeric and bigint values converted to JavaScript numbers.
 * Results returned as { data, error }, never throws to UI.
 */

import { supabase } from '../lib/supabase.ts';
import type {
  ApiResponse,
  DailySummaryRow,
  PeriodTotalsRow,
  YearOverviewRow,
  WeeklyBucketRow,
  CategoryBreakdownRow,
  SavingsGrowthRow,
  RewardStateRow,
  BadgeItemRow,
} from '../types.ts';

export async function daily_summary(
  p_from: string,
  p_to: string
): Promise<ApiResponse<DailySummaryRow[]>> {
  try {
    const { data, error } = await supabase.rpc('daily_summary', { p_from, p_to });
    if (error) {
      return { data: null, error: error.message };
    }

    const rows: DailySummaryRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
      day: String(r.day),
      spent: Number(r.spent ?? 0),
      saved: Number(r.saved ?? 0),
      expense_count: Number(r.expense_count ?? 0),
      saving_count: Number(r.saving_count ?? 0),
      goal: r.goal !== null && r.goal !== undefined ? Number(r.goal) : null,
      goal_met: Boolean(r.goal_met),
    }));

    return { data: rows, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function period_totals(
  p_from: string,
  p_to: string
): Promise<ApiResponse<PeriodTotalsRow>> {
  try {
    const { data, error } = await supabase.rpc('period_totals', { p_from, p_to });
    if (error) {
      return { data: null, error: error.message };
    }

    // Results are arrays of rows; return the first row for single-row functions
    const first = Array.isArray(data) ? data[0] : data;
    if (!first) {
      return {
        data: {
          spent: 0,
          saved: 0,
          expense_count: 0,
          saving_count: 0,
        },
        error: null,
      };
    }

    const row: PeriodTotalsRow = {
      spent: Number(first.spent ?? 0),
      saved: Number(first.saved ?? 0),
      expense_count: Number(first.expense_count ?? 0),
      saving_count: Number(first.saving_count ?? 0),
    };

    return { data: row, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function year_overview(
  p_year: number
): Promise<ApiResponse<YearOverviewRow[]>> {
  try {
    const { data, error } = await supabase.rpc('year_overview', { p_year });
    if (error) {
      return { data: null, error: error.message };
    }

    const rows: YearOverviewRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
      month: Number(r.month),
      spent: Number(r.spent ?? 0),
      saved: Number(r.saved ?? 0),
      entries: Number(r.entries ?? 0),
    }));

    return { data: rows, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function weekly_buckets(
  p_year: number,
  p_month: number
): Promise<ApiResponse<WeeklyBucketRow[]>> {
  try {
    const { data, error } = await supabase.rpc('weekly_buckets', { p_year, p_month });
    if (error) {
      return { data: null, error: error.message };
    }

    const rows: WeeklyBucketRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
      bucket: Number(r.bucket),
      start_day: String(r.start_day),
      end_day: String(r.end_day),
      spent: Number(r.spent ?? 0),
      saved: Number(r.saved ?? 0),
    }));

    return { data: rows, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function category_breakdown(
  p_from: string,
  p_to: string
): Promise<ApiResponse<CategoryBreakdownRow[]>> {
  try {
    const { data, error } = await supabase.rpc('category_breakdown', { p_from, p_to });
    if (error) {
      return { data: null, error: error.message };
    }

    const rows: CategoryBreakdownRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
      category_id: String(r.category_id),
      name: String(r.name),
      icon: String(r.icon),
      color: String(r.color),
      total: Number(r.total ?? 0),
      entries: Number(r.entries ?? 0),
      share: Number(r.share ?? 0),
    }));

    return { data: rows, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function savings_growth(
  p_from: string,
  p_to: string
): Promise<ApiResponse<SavingsGrowthRow[]>> {
  try {
    const { data, error } = await supabase.rpc('savings_growth', { p_from, p_to });
    if (error) {
      return { data: null, error: error.message };
    }

    const rows: SavingsGrowthRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
      day: String(r.day),
      saved: Number(r.saved ?? 0),
      running_total: Number(r.running_total ?? 0),
    }));

    return { data: rows, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function current_streak(p_today: string): Promise<ApiResponse<number>> {
  try {
    const { data, error } = await supabase.rpc('current_streak', { p_today });
    if (error) {
      return { data: null, error: error.message };
    }

    let val = 0;
    if (typeof data === 'number') {
      val = data;
    } else if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      val = typeof first === 'number' ? first : Number(first?.current_streak ?? 0);
    } else if (data && typeof data === 'object') {
      val = Number((data as any).current_streak ?? 0);
    }

    return { data: Number.isFinite(val) ? val : 0, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function reward_state(): Promise<ApiResponse<RewardStateRow>> {
  try {
    const { data, error } = await supabase.rpc('reward_state');
    if (error) {
      return { data: null, error: error.message };
    }

    const first = Array.isArray(data) ? data[0] : data;
    if (!first) {
      return {
        data: {
          xp: 0,
          level: 1,
          level_name: 'Beginner',
          level_floor: 0,
          next_name: 'Saver',
          next_floor: 100,
        },
        error: null,
      };
    }

    const row: RewardStateRow = {
      xp: Number(first.xp ?? 0),
      level: Number(first.level ?? 1),
      level_name: String(first.level_name ?? ''),
      level_floor: Number(first.level_floor ?? 0),
      next_name: String(first.next_name ?? ''),
      next_floor: Number(first.next_floor ?? 0),
    };

    return { data: row, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function sync_badges(p_today: string): Promise<ApiResponse<BadgeItemRow[]>> {
  try {
    const { data, error } = await supabase.rpc('sync_badges', { p_today });
    if (error) {
      return { data: null, error: error.message };
    }

    const rows: BadgeItemRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
      code: String(r.code),
      name: String(r.name),
      description: String(r.description),
      progress: Number(r.progress ?? 0),
      target: Number(r.target ?? 0),
      earned: Boolean(r.earned),
      earned_at: r.earned_at ? String(r.earned_at) : null,
    }));

    return { data: rows, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

export async function record_event(
  p_event: 'viewed_categories'
): Promise<ApiResponse<boolean>> {
  try {
    if (p_event !== 'viewed_categories') {
      return { data: null, error: 'Only viewed_categories is accepted' };
    }

    const { error } = await supabase.rpc('record_event', { p_event });
    if (error) {
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}
