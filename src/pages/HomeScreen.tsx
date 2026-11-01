import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import {
  daily_summary,
  period_totals,
  current_streak,
} from '../api/rpc.ts';
import { listTransactions } from '../api/transactions.ts';
import { listCategories } from '../api/categories.ts';
import {
  todayLocal,
  addDays,
  startOfMonth,
  endOfMonth,
  parts,
  weekdayLetters,
} from '../lib/date.ts';
import { formatUGX, formatCompact } from '../lib/money.ts';
import { getCategoryIcon } from '../components/NewCategorySheet.tsx';
import {
  CloudCheckIcon,
  CloudSlashOfflineIcon,
  UserOutlineIcon,
  WalletIcon,
  CoinTargetIcon,
  FlameFilledIcon,
  FlameOutlineIcon,
  ReceiptBillIcon,
  ButtonPlusDarkIcon,
  ButtonPlusGreenIcon,
  HeroErrorCloudIcon,
  TryAgainRefreshIcon,
} from '../components/Icons.tsx';
import { useAppShell } from '../components/AppShell.tsx';
import type { Category } from '../types.ts';

/**
 * Animated count-up hook (never longer than 500 ms, respects reduced motion)
 */
function useCountUp(target: number, duration = 500): number {
  const [current, setCurrent] = useState(target);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCurrent(target);
      prevTargetRef.current = target;
      return;
    }

    const startVal = prevTargetRef.current;
    prevTargetRef.current = target;

    if (startVal === target) {
      setCurrent(target);
      return;
    }

    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startVal + (target - startVal) * eased);
      setCurrent(val);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setCurrent(target);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return current;
}

/**
 * Computes greeting based on the user's local hour
 */
function getGreeting(tz = 'Africa/Kampala'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  } catch {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }
}

/**
 * Calculates weekday letter ('M', 'T', 'W', 'T', 'F', 'S', 'S') from YYYY-MM-DD
 */
function getWeekdayLetter(dateStr: string): string {
  const { year, month, day } = parts(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const letterIndex = (dayOfWeek + 6) % 7;
  return weekdayLetters[letterIndex] || 'M';
}

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isOnline } = useAuth();
  const { openQuickEntry } = useAppShell();

  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const today = todayLocal(userTimezone);
  const greeting = getGreeting(userTimezone);

  // 1. Daily summary for today
  const todaySummaryQuery = useData(
    () => daily_summary(today, today),
    [today]
  );
  const todayRow = todaySummaryQuery.data?.[0];
  const spentToday = todayRow?.spent ?? 0;
  const savedToday = todayRow?.saved ?? 0;
  const expenseCountToday = todayRow?.expense_count ?? 0;
  const goalToday = todayRow?.goal ?? null;

  // Count up animation for hero amount
  const animatedSpent = useCountUp(spentToday, 500);

  // 2. 7 days streak history ending today
  const sevenDaysStart = addDays(today, -6);
  const sevenDaysQuery = useData(
    () => daily_summary(sevenDaysStart, today),
    [sevenDaysStart, today]
  );
  const sevenDaysRows = sevenDaysQuery.data || [];

  // 3. Current streak count
  const streakQuery = useData(
    () => current_streak(today),
    [today]
  );
  const streakCount = streakQuery.data ?? 0;

  // 4. Month totals
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthTotalsQuery = useData(
    () => period_totals(monthStart, monthEnd),
    [monthStart, monthEnd]
  );
  const monthSpent = monthTotalsQuery.data?.spent ?? 0;
  const monthSaved = monthTotalsQuery.data?.saved ?? 0;

  // 5. Recent 5 transactions
  const recentTxQuery = useData(
    () => listTransactions({ limit: 5 }),
    []
  );
  const recentTransactions = recentTxQuery.data || [];

  // 6. Categories for icons and colors
  const categoriesQuery = useData(
    () => listCategories({ includeArchived: true }),
    []
  );
  const categoriesMap = new Map<string, Category>(
    (categoriesQuery.data || []).map(c => [c.id, c])
  );

  // Loading state
  const isInitialLoading =
    todaySummaryQuery.loading &&
    !todaySummaryQuery.data &&
    sevenDaysQuery.loading &&
    !sevenDaysQuery.data;

  // Error state
  const hasError =
    !todaySummaryQuery.data &&
    !sevenDaysQuery.data &&
    Boolean(todaySummaryQuery.error || sevenDaysQuery.error);

  const handleRefreshAll = () => {
    bumpRefresh();
  };

  return (
    <div className="w-full flex flex-col relative select-none">
      {/* Orange Header Area (height 260px, px-6, padding top 52px, padding bottom 18px) */}
      <header className="w-full h-[260px] bg-[#FF8A1F] px-6 flex flex-col justify-between pt-[52px] pb-[18px] box-border relative z-0 shrink-0">
        {/* Top row at y=52 (44px tall) */}
        <div className="w-full h-[44px] flex items-center justify-between">
          <div className="text-[24px] font-extrabold tracking-tight text-[#2B2622]">
            RoCash
          </div>

          <div className="flex items-center gap-[10px]">
            {/* Status indicator: CloudCheckIcon (online) or Offline pill (offline) */}
            {isOnline ? (
              <div
                className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center"
                title="Synced"
              >
                <CloudCheckIcon size={22} />
              </div>
            ) : (
              <div className="h-[44px] rounded-full bg-white px-[14px] flex items-center gap-2">
                <CloudSlashOfflineIcon size={20} />
                <span className="text-[14px] font-bold text-[#2B2622] leading-none">
                  Offline
                </span>
              </div>
            )}

            {/* Profile Avatar Button navigating to #/profile */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              aria-label="Profile"
              className="w-[44px] h-[44px] rounded-full bg-[#FFD9BD] flex items-center justify-center overflow-hidden cursor-pointer"
            >
              <UserOutlineIcon size={22} />
            </button>
          </div>
        </div>

        {/* Greeting block (y=108) */}
        <div>
          <div className="text-[16px] font-bold text-[#2B2622] text-opacity-80 leading-snug">
            {greeting}
          </div>
          <div className="text-[32px] font-extrabold text-[#2B2622] tracking-tight leading-tight">
            {profile?.display_name || 'Friend'}
          </div>
        </div>
      </header>

      {/* White Sheet: starts at y=260 and runs all the way down, rounded top corners 32px */}
      <section
        aria-label="Home Content"
        className="w-full bg-white rounded-t-[32px] px-6 pb-[100px] flex-1 flex flex-col relative z-10 min-h-[calc(100vh-260px)]"
      >
        {/* 1. ERROR STATE */}
        {hasError ? (
          <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-12">
            <div className="w-[88px] h-[88px] rounded-full bg-[#FFECEC] flex items-center justify-center mb-5">
              <HeroErrorCloudIcon className="w-11 h-11 text-[#FF4B4B]" />
            </div>

            <h3 className="text-[26px] font-extrabold text-[#2B2622] text-center tracking-tight whitespace-nowrap mb-2.5">
              We couldn't load your day
            </h3>

            <p className="text-[16px] text-[#8A837B] text-center leading-relaxed font-medium mb-7 max-w-[300px]">
              Check your connection and try again. Nothing was changed.
            </p>

            <button
              onClick={handleRefreshAll}
              className="w-full h-14 bg-[#FF8A1F] border-b-4 border-[#D96F0A] rounded-full flex items-center justify-center gap-2.5 active:translate-y-[2px] active:border-b-2 transition-all cursor-pointer mb-3.5"
              type="button"
            >
              <TryAgainRefreshIcon className="w-5 h-5 text-[#2B2622]" />
              <span className="text-[17px] font-bold text-[#2B2622] tracking-tight">
                Try again
              </span>
            </button>

            <a
              className="text-[15px] font-bold text-[#2B2622] hover:opacity-80 transition-opacity"
              href="#support"
            >
              Contact support
            </a>
          </div>
        ) : isInitialLoading ? (
          /* 2. LOADING STATE */
          <div className="w-full flex flex-col">
            {/* Hero Card Skeleton (-mt-[70px]) */}
            <div className="w-full h-[210px] rounded-[28px] bg-white border-2 border-[#E8E5E0] overflow-hidden flex flex-col -mt-[70px] animate-pulse">
              <div className="h-[142px] p-5 flex flex-col justify-between box-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[10px]">
                    <div className="w-[32px] h-[32px] rounded-full bg-[#EFEBE5]" />
                    <div className="w-[90px] h-[14px] rounded-full bg-[#EFEBE5]" />
                  </div>
                  <div className="w-[64px] h-[24px] rounded-full bg-[#EFEBE5]" />
                </div>
                <div className="w-[210px] h-[40px] rounded-xl bg-[#EFEBE5]" />
              </div>
              <div className="h-[68px] px-5 py-[14px] bg-[#F4F1EC] border-t-2 border-[#E8E5E0] flex flex-col justify-between box-border">
                <div className="flex items-center gap-[10px]">
                  <div className="w-[24px] h-[24px] rounded-full bg-[#EFEBE5]" />
                  <div className="w-[150px] h-[14px] rounded-full bg-[#EFEBE5]" />
                </div>
                <div className="w-full h-[8px] rounded-full bg-[#EFEBE5]" />
              </div>
            </div>

            {/* Day Strip Skeleton */}
            <div className="mt-5 w-full flex flex-col animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[6px]">
                  <div className="w-[20px] h-[20px] rounded-full bg-[#EFEBE5]" />
                  <div className="w-[110px] h-[16px] rounded-full bg-[#EFEBE5]" />
                </div>
                <div className="w-[60px] h-[14px] rounded-full bg-[#EFEBE5]" />
              </div>
              <div className="mt-3 flex justify-between items-center">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-[14px] h-[12px] rounded-md bg-[#EFEBE5]" />
                    <div className="w-[36px] h-[36px] rounded-full bg-[#EFEBE5]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Month Card Skeleton */}
            <div className="mt-5 w-full h-[92px] rounded-[24px] bg-[#F7F4EF] px-5 py-4 flex items-center justify-between box-border animate-pulse">
              <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="w-[100px] h-[12px] rounded-full bg-[#EFEBE5]" />
                <div className="w-[100px] h-[26px] rounded-lg bg-[#EFEBE5]" />
              </div>
              <div className="w-[2px] h-[44px] bg-[#E8E5E0] mx-4" />
              <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="w-[100px] h-[12px] rounded-full bg-[#EFEBE5]" />
                <div className="w-[100px] h-[26px] rounded-lg bg-[#EFEBE5]" />
              </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="mt-5 flex flex-col animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="w-[120px] h-[18px] rounded-full bg-[#EFEBE5]" />
                <div className="w-[50px] h-[14px] rounded-full bg-[#EFEBE5]" />
              </div>
              <div className="flex flex-col gap-[10px]">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-[68px] rounded-[20px] bg-[#F7F4EF] px-4 py-3 flex items-center justify-between box-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-[42px] h-[42px] rounded-full bg-[#EFEBE5]" />
                      <div className="flex flex-col gap-2">
                        <div className="w-[120px] h-[14px] rounded-full bg-[#EFEBE5]" />
                        <div className="w-[90px] h-[12px] rounded-full bg-[#EFEBE5]" />
                      </div>
                    </div>
                    <div className="w-[70px] h-[16px] rounded-full bg-[#EFEBE5]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 3. POPULATED & EMPTY STATES */
          <div className="w-full flex flex-col">
            {/* 1. HERO CARD (210px tall, radius 28px, border 2px solid #E8E5E0, -mt-[70px]) */}
            <div className="w-full h-[210px] rounded-[28px] bg-white border-2 border-[#E8E5E0] overflow-hidden flex flex-col -mt-[70px]">
              {/* Top Part: height 142px, padding 20px */}
              <div className="h-[142px] p-5 flex flex-col justify-between box-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[10px]">
                    <div className="w-[32px] h-[32px] rounded-full bg-[#FF8A1F] flex items-center justify-center">
                      <WalletIcon size={18} />
                    </div>
                    <span className="text-[15px] font-semibold text-[#8A837B]">
                      Spent today
                    </span>
                  </div>

                  {/* Entries pill */}
                  <div className="h-[28px] rounded-full bg-[#F7F4EF] px-3 flex items-center justify-center">
                    <span className="text-[13px] font-bold text-[#2B2622]">
                      {expenseCountToday > 0
                        ? `${expenseCountToday} ${expenseCountToday === 1 ? 'entry' : 'entries'}`
                        : 'No entries yet'}
                    </span>
                  </div>
                </div>

                <div className="text-[46px] font-extrabold text-[#2B2622] tracking-tight leading-none tabular-num whitespace-nowrap">
                  UGX {formatUGX(animatedSpent)}
                </div>
              </div>

              {/* Bottom Strip: height 68px, padding 14px 20px, bg #E6F7EE, border-top 2px #C5EBD6 */}
              <div className="h-[68px] px-5 py-[14px] bg-[#E6F7EE] border-t-2 border-[#C5EBD6] flex flex-col justify-between box-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[10px]">
                    <div className="w-[28px] h-[28px] rounded-full bg-[#2DBE6C] flex items-center justify-center">
                      <CoinTargetIcon size={16} />
                    </div>
                    <span className="text-[15px] font-bold text-[#2B2622]">
                      Saved UGX {formatUGX(savedToday)}
                    </span>
                  </div>

                  {goalToday && goalToday > 0 ? (
                    <span className="text-[13px] font-semibold text-[#4D6B5C]">
                      of UGX {formatCompact(goalToday)} goal
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="text-[13px] font-semibold text-[#4D6B5C] hover:underline cursor-pointer"
                    >
                      Set a daily goal
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-[8px] rounded-full bg-[#CDEBDA] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2DBE6C] transition-all duration-500 ease-out"
                    style={{
                      width:
                        goalToday && goalToday > 0
                          ? `${Math.min(100, Math.round((savedToday / goalToday) * 100))}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. DAY STRIP (NO CARD, directly on the white sheet, 20px gap) */}
            <div className="mt-5 w-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[6px] whitespace-nowrap min-w-[160px]">
                  {streakCount > 0 ? (
                    <>
                      <FlameFilledIcon size={20} fill="#F2542D" />
                      <span className="text-[16px] font-bold text-[#2B2622] whitespace-nowrap">
                        {streakCount} day streak
                      </span>
                    </>
                  ) : (
                    <>
                      <FlameOutlineIcon size={22} stroke="#CFC9C0" />
                      <span className="text-[17px] font-extrabold text-[#2B2622]">
                        No streak yet
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[14px] font-semibold text-[#8A837B] whitespace-nowrap">
                  This week
                </span>
              </div>

              {/* 7 circles for the last 7 days ending today */}
              <div className="mt-3 flex justify-between items-center">
                {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                  const dateStr = addDays(today, -6 + offset);
                  const isTodayDate = dateStr === today;
                  const letter = getWeekdayLetter(dateStr);
                  const dayRow = sevenDaysRows.find(r => r.day === dateStr);
                  const goalMet = Boolean(dayRow?.goal_met);

                  return (
                    <div key={dateStr} className="flex flex-col items-center gap-1">
                      <span
                        className={`text-[13px] font-bold ${
                          isTodayDate ? 'text-[#2B2622]' : 'text-[#8A837B]'
                        }`}
                      >
                        {letter}
                      </span>
                      {goalMet ? (
                        <div className="w-[40px] h-[40px] rounded-full bg-[#FFE9E3] flex items-center justify-center">
                          <FlameFilledIcon size={22} fill="#F2542D" />
                        </div>
                      ) : isTodayDate ? (
                        <div className="w-[40px] h-[40px] rounded-full bg-white border-[3px] border-dashed border-[#FF8A1F] flex items-center justify-center">
                          <FlameOutlineIcon size={22} stroke="#CFC9C0" />
                        </div>
                      ) : (
                        <div className="w-[40px] h-[40px] rounded-full bg-white border-2 border-[#E8E5E0] flex items-center justify-center">
                          <FlameOutlineIcon size={24} stroke="#CFC9C0" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. MONTH CARD (20px gap, height 92px, radius 24, fill #F7F4EF, NO border) */}
            <div className="mt-5 w-full h-[92px] rounded-[24px] bg-[#F7F4EF] px-5 py-4 flex items-center justify-between box-border">
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-[13px] font-semibold text-[#8A837B] mb-[2px]">
                  Spent this month
                </div>
                <div className="text-[28px] font-extrabold text-[#2B2622] tracking-tight leading-tight tabular-num">
                  UGX {formatCompact(monthSpent)}
                </div>
              </div>

              {/* 2px Divider */}
              <div className="w-[2px] h-[44px] bg-[#E8E5E0] mx-4" />

              <div className="flex-1 flex flex-col justify-center">
                <div className="text-[13px] font-semibold text-[#8A837B] mb-[2px]">
                  Saved this month
                </div>
                <div className="text-[28px] font-extrabold text-[#1F9A52] tracking-tight leading-tight tabular-num">
                  UGX {formatCompact(monthSaved)}
                </div>
              </div>
            </div>

            {/* 4. RECENT ACTIVITY (20px gap) */}
            <div className="mt-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[18px] font-extrabold text-[#2B2622]">
                  Recent activity
                </span>
                {recentTransactions.length > 0 && (
                  <span
                    onClick={() => navigate('/history')}
                    className="text-[14px] font-extrabold text-[#D96F0A] cursor-pointer"
                  >
                    See all
                  </span>
                )}
              </div>

              {recentTransactions.length === 0 ? (
                /* Empty state card matching rocash_home_screen_empty_state.html */
                <div className="w-full rounded-[24px] bg-[#F7F4EF] border-2 border-dashed border-[#E8E5E0] p-5 flex flex-col items-center text-center box-border">
                  <div className="w-[64px] h-[64px] rounded-full bg-[#FFF1E4] flex items-center justify-center">
                    <ReceiptBillIcon size={30} />
                  </div>
                  <div className="mt-[14px] text-[20px] font-extrabold text-[#2B2622] leading-snug">
                    Your story starts with one entry
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-[#8A837B] leading-snug px-3">
                    Add your first expense or saving to see your progress come to life.
                  </div>
                  <div className="mt-[18px] w-full flex items-center gap-[10px]">
                    <button
                      onClick={() => openQuickEntry({ mode: 'expense' })}
                      className="flex-1 h-[52px] rounded-full bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] flex items-center justify-center gap-1 cursor-pointer active:translate-y-[2px] transition-transform"
                      type="button"
                    >
                      <ButtonPlusDarkIcon size={18} />
                      <span className="text-[14px] font-bold text-[#2B2622]">
                        Add expense
                      </span>
                    </button>
                    <button
                      onClick={() => openQuickEntry({ mode: 'saving' })}
                      className="flex-1 h-[52px] rounded-full bg-white border-2 border-[#E8E5E0] flex items-center justify-center gap-1 cursor-pointer active:translate-y-[2px] transition-transform"
                      type="button"
                    >
                      <ButtonPlusGreenIcon size={18} />
                      <span className="text-[14px] font-bold text-[#2B2622]">
                        Add saving
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Stacked entries with 10px gaps, height 68px, radius 20, fill #F7F4EF, NO border */
                <div className="flex flex-col gap-[10px]">
                  {recentTransactions.map(tx => {
                    const isExpense = tx.type === 'expense';
                    const cat = tx.category_id ? categoriesMap.get(tx.category_id) : null;
                    const color = isExpense ? (cat?.color || '#FFC93C') : '#2DBE6C';
                    const iconName = isExpense ? (cat?.icon || 'grid') : 'gift';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => openQuickEntry({ tx })}
                        className="w-full h-[68px] rounded-[20px] bg-[#F7F4EF] px-4 py-3 flex items-center justify-between box-border cursor-pointer hover:bg-[#EFEBE5] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 text-[#2B2622]"
                            style={{ backgroundColor: color }}
                          >
                            {getCategoryIcon(iconName)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[16px] font-extrabold text-[#2B2622] leading-snug truncate">
                              {tx.note || cat?.name || (isExpense ? 'Expense' : 'Saving')}
                            </span>
                            <span className="text-[13px] font-semibold text-[#8A837B] truncate">
                              {cat?.name || (isExpense ? 'General' : 'Savings')} · {tx.occurred_on}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-[16px] font-extrabold tabular-num shrink-0 ml-3 ${
                            isExpense ? 'text-[#2B2622]' : 'text-[#2DBE6C]'
                          }`}
                        >
                          {isExpense ? `-UGX ${formatUGX(tx.amount)}` : `+UGX ${formatUGX(tx.amount)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
