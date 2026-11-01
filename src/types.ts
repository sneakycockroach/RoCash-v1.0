/**
 * RoCash Database and Domain Types
 */

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_seed: string | null;
  currency: string;
  timezone: string;
  welcome_back_enabled: boolean;
  onboarded_at: string | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  archived_at: string | null;
}

export type TransactionType = 'expense' | 'saving';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category_id: string | null;
  note: string | null;
  occurred_on: string; // "YYYY-MM-DD"
  occurred_at: string; // ISO timestamp
  deleted_at: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  daily_amount: number;
  effective_from: string; // "YYYY-MM-DD"
}

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface UserAchievement {
  user_id: string;
  code: string;
  earned_at: string;
}

/* RPC Response Types */

export interface DailySummaryRow {
  day: string;
  spent: number;
  saved: number;
  expense_count: number;
  saving_count: number;
  goal: number | null;
  goal_met: boolean;
}

export interface PeriodTotalsRow {
  spent: number;
  saved: number;
  expense_count: number;
  saving_count: number;
}

export interface YearOverviewRow {
  month: number;
  spent: number;
  saved: number;
  entries: number;
}

export interface WeeklyBucketRow {
  bucket: number;
  start_day: string;
  end_day: string;
  spent: number;
  saved: number;
}

export interface CategoryBreakdownRow {
  category_id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  entries: number;
  share: number; // 0 to 1
}

export interface SavingsGrowthRow {
  day: string;
  saved: number;
  running_total: number;
}

export interface RewardStateRow {
  xp: number;
  level: number;
  level_name: string;
  level_floor: number;
  next_name: string;
  next_floor: number;
}

export interface BadgeItemRow {
  code: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  earned: boolean;
  earned_at: string | null;
}

/* API Return Signature: Every function returns { data, error } and never throws to the UI */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export type MutationStatus = 'pending' | 'synced' | 'failed';
