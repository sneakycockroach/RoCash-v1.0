import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import {
  period_totals,
  weekly_buckets,
  year_overview,
  category_breakdown,
  savings_growth,
  daily_summary,
  record_event,
  sync_badges,
} from '../api/rpc.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import { todayLocal, parts, daysInMonth } from '../lib/date.ts';
import { formatCompact, formatUGX } from '../lib/money.ts';
import { getCategoryIcon } from '../lib/categories.tsx';
import { useAppShell } from '../components/AppShell.tsx';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function calculateNiceTicks(maxValue: number, maxTicks = 4): number[] {
  if (maxValue <= 0) return [0, 10000];
  const range = maxValue;
  const roughStep = range / maxTicks;
  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / orderOfMagnitude;

  let niceStep = 1;
  if (normalizedStep <= 1) niceStep = 1;
  else if (normalizedStep <= 2) niceStep = 2;
  else if (normalizedStep <= 5) niceStep = 5;
  else niceStep = 10;

  const step = niceStep * orderOfMagnitude;
  const topTick = Math.ceil(maxValue / step) * step;

  const ticks: number[] = [];
  for (let val = 0; val <= topTick; val += step) {
    ticks.push(val);
  }
  return ticks;
}

export const ReportsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { openQuickEntry, showToast } = useAppShell();

  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const todayStr = todayLocal(userTimezone);
  const { year: currentYear, month: currentMonth, day: currentDay } = parts(todayStr);

  // Period View state: 'month' | 'year'
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Selected period state
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Tooltip state for Bar Chart
  const [activeTooltip, setActiveTooltip] = useState<{
    label: string;
    spent: number;
    saved: number;
  } | null>(null);

  // Ref for Category Breakdown 50% visibility tracking
  const categorySectionRef = useRef<HTMLDivElement | null>(null);
  const hasRecordedEventRef = useRef<boolean>(false);

  // Date ranges
  const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const lastDay = daysInMonth(selectedYear, selectedMonth);
  const monthEnd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const yearStart = `${selectedYear}-01-01`;
  const yearEnd = `${selectedYear}-12-31`;

  const fromDate = viewMode === 'month' ? monthStart : yearStart;
  const toDate = viewMode === 'month' ? monthEnd : yearEnd;

  const isCurrentPeriod =
    viewMode === 'month'
      ? selectedYear === currentYear && selectedMonth === currentMonth
      : selectedYear === currentYear;

  // 1. Period Totals
  const totalsQuery = useData(
    () => period_totals(fromDate, toDate),
    [fromDate, toDate]
  );
  const totals = totalsQuery.data;

  // 2. Bar Chart Data
  const weeklyBucketsQuery = useData(
    () => (viewMode === 'month' ? weekly_buckets(selectedYear, selectedMonth) : Promise.resolve({ data: [], error: null })),
    [viewMode, selectedYear, selectedMonth]
  );

  const yearOverviewQuery = useData(
    () => (viewMode === 'year' ? year_overview(selectedYear) : Promise.resolve({ data: [], error: null })),
    [viewMode, selectedYear]
  );

  // 3. Category Breakdown
  const categoriesQuery = useData(
    () => category_breakdown(fromDate, toDate),
    [fromDate, toDate]
  );
  const categories = categoriesQuery.data || [];

  // 4. Savings Growth
  const growthQuery = useData(
    () => savings_growth(fromDate, toDate),
    [fromDate, toDate]
  );
  const growthData = growthQuery.data || [];

  // 5. Daily Summary for monthly target progress
  const dailySummaryQuery = useData(
    () => (viewMode === 'month' ? daily_summary(monthStart, monthEnd) : Promise.resolve({ data: [], error: null })),
    [viewMode, monthStart, monthEnd]
  );
  const monthDailyRows = dailySummaryQuery.data || [];

  // IntersectionObserver for Category Breakdown (50% visibility)
  useEffect(() => {
    if (hasRecordedEventRef.current || !categorySectionRef.current) return;

    const observer = new IntersectionObserver(
      async entries => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasRecordedEventRef.current) {
          hasRecordedEventRef.current = true;
          await record_event('viewed_categories');
          const syncRes = await sync_badges(todayStr);
          if (syncRes.data) {
            const explorer = syncRes.data.find(b => b.code === 'category_explorer');
            if (explorer && explorer.earned) {
              showToast(`Badge Unlocked: ${explorer.name}!`, 'success');
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(categorySectionRef.current);
    return () => observer.disconnect();
  }, [todayStr, showToast]);

  const handlePrevPeriod = () => {
    setActiveTooltip(null);
    if (viewMode === 'month') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(y => y - 1);
      } else {
        setSelectedMonth(m => m - 1);
      }
    } else {
      setSelectedYear(y => y - 1);
    }
  };

  const handleNextPeriod = () => {
    if (isCurrentPeriod) return;
    setActiveTooltip(null);
    if (viewMode === 'month') {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(y => y + 1);
      } else {
        setSelectedMonth(m => m + 1);
      }
    } else {
      setSelectedYear(y => y + 1);
    }
  };

  // Bar Chart items calculation
  const barChartItems = useMemo(() => {
    if (viewMode === 'month') {
      const rows = weeklyBucketsQuery.data || [];
      const bucketRanges = [
        { bucket: 1, label: '1–7', startDay: 1, endDay: 7 },
        { bucket: 2, label: '8–14', startDay: 8, endDay: 14 },
        { bucket: 3, label: '15–21', startDay: 15, endDay: 21 },
        { bucket: 4, label: '22–28', startDay: 22, endDay: 28 },
        { bucket: 5, label: `29–${lastDay}`, startDay: 29, endDay: lastDay },
      ];

      return bucketRanges.map(range => {
        const found = rows.find(r => r.bucket === range.bucket);
        const isFuture =
          selectedYear > currentYear ||
          (selectedYear === currentYear && selectedMonth > currentMonth) ||
          (selectedYear === currentYear && selectedMonth === currentMonth && range.startDay > currentDay);

        return {
          id: `bucket-${range.bucket}`,
          label: range.label,
          fullLabel: `Days ${range.label}`,
          spent: found?.spent ?? 0,
          saved: found?.saved ?? 0,
          isFuture,
        };
      });
    } else {
      const rows = yearOverviewQuery.data || [];
      return Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const found = rows.find(r => r.month === monthNum);
        const isFuture =
          selectedYear > currentYear ||
          (selectedYear === currentYear && monthNum > currentMonth);

        return {
          id: `month-${monthNum}`,
          label: MONTH_LETTERS[i],
          fullLabel: MONTH_NAMES[i],
          spent: found?.spent ?? 0,
          saved: found?.saved ?? 0,
          isFuture,
        };
      });
    }
  }, [
    viewMode,
    weeklyBucketsQuery.data,
    yearOverviewQuery.data,
    selectedYear,
    selectedMonth,
    currentYear,
    currentMonth,
    currentDay,
    lastDay,
  ]);

  const chartMaxValue = useMemo(() => {
    let max = 0;
    barChartItems.forEach(item => {
      if (!item.isFuture) {
        if (item.spent > max) max = item.spent;
        if (item.saved > max) max = item.saved;
      }
    });
    return Math.max(max, 10000);
  }, [barChartItems]);

  const yTicks = useMemo(() => {
    return calculateNiceTicks(chartMaxValue, 4);
  }, [chartMaxValue]);

  const topTick = yTicks[yTicks.length - 1] || chartMaxValue;

  // Monthly Goal Progress
  const monthlyGoalTarget = useMemo(() => {
    if (viewMode !== 'month') return null;
    let target = 0;
    let hasAnyGoal = false;
    const todayRow = monthDailyRows.find(r => r.day === todayStr);
    const fallbackTodayGoal = todayRow?.goal ?? 0;

    for (let d = 1; d <= lastDay; d++) {
      const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const row = monthDailyRows.find(r => r.day === dayStr);
      if (row && row.goal !== null && row.goal > 0) {
        target += row.goal;
        hasAnyGoal = true;
      } else if (dayStr > todayStr && fallbackTodayGoal > 0) {
        target += fallbackTodayGoal;
        hasAnyGoal = true;
      }
    }

    if (!hasAnyGoal || target <= 0) return null;
    return target;
  }, [viewMode, monthDailyRows, selectedYear, selectedMonth, lastDay, todayStr]);

  const monthSavedTotal = totals?.saved ?? 0;
  const goalProgressPercent = monthlyGoalTarget
    ? Math.min(100, Math.round((monthSavedTotal / monthlyGoalTarget) * 100))
    : 0;

  const topCategory = categories.length > 0 && categories[0].total > 0 ? categories[0] : null;
  const topCategoryPercent = topCategory ? Math.round((topCategory.share || 0) * 100) : 0;

  // Fix-up 4: Weekly insight rule compares the two most recent weekly buckets that have already started and both have savings
  const weeklySavingsDiffInsight = useMemo(() => {
    if (viewMode !== 'month') return null;
    const rows = weeklyBucketsQuery.data || [];
    const bucketStartDays: Record<number, number> = { 1: 1, 2: 8, 3: 15, 4: 22, 5: 29 };

    // Filter buckets that have already started AND have saved > 0
    const startedWithSavings = rows.filter(b => {
      const startDay = bucketStartDays[b.bucket] || 1;
      const isPast =
        selectedYear < currentYear ||
        (selectedYear === currentYear && selectedMonth < currentMonth);
      const isCurrentMonthStarted =
        selectedYear === currentYear &&
        selectedMonth === currentMonth &&
        currentDay >= startDay;
      const hasStarted = isPast || isCurrentMonthStarted;
      return hasStarted && (b.saved ?? 0) > 0;
    });

    startedWithSavings.sort((a, b) => a.bucket - b.bucket);

    if (startedWithSavings.length >= 2) {
      const bPrev = startedWithSavings[startedWithSavings.length - 2];
      const bCurrent = startedWithSavings[startedWithSavings.length - 1];

      if (bCurrent.saved > bPrev.saved) {
        return `You saved UGX ${formatCompact(bCurrent.saved)} in week ${bCurrent.bucket}, up from UGX ${formatCompact(bPrev.saved)} in week ${bPrev.bucket}.`;
      } else if (bCurrent.saved < bPrev.saved) {
        return `You saved UGX ${formatCompact(bCurrent.saved)} in week ${bCurrent.bucket}, down from UGX ${formatCompact(bPrev.saved)} in week ${bPrev.bucket}.`;
      }
    }
    return null;
  }, [viewMode, weeklyBucketsQuery.data, selectedYear, selectedMonth, currentYear, currentMonth, currentDay]);

  const totalCategorySpent = categories.reduce((sum, c) => sum + (c.total || 0), 0);

  // SVG Chart Dimensions
  const svgWidth = 340;
  const svgHeight = 160;
  const chartPadLeft = 46;
  const chartPadRight = 12;
  const chartPadTop = 18;
  const chartPadBottom = 26;
  const plotWidth = svgWidth - chartPadLeft - chartPadRight;
  const plotHeight = svgHeight - chartPadTop - chartPadBottom;

  const hasAnyEntries =
    totals &&
    ((totals.expense_count ?? 0) > 0 ||
      (totals.saving_count ?? 0) > 0 ||
      (totals.spent ?? 0) > 0 ||
      (totals.saved ?? 0) > 0);

  const isPeriodEmpty = !totalsQuery.loading && !totalsQuery.error && !hasAnyEntries;

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-8">
      {/* 1. Header with Title & Segmented Control */}
      <header className="px-5 pt-8 pb-4 flex flex-col gap-4 border-b border-[#E8E5E0] bg-white sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#2B2622] tracking-tight leading-none">
              Reports
            </h1>
            <p className="text-[13px] font-medium text-[#8A837B] mt-1">
              Visualise your spending & savings trends
            </p>
          </div>

          {/* Month | Year Segmented Control */}
          <div className="flex items-center bg-[#F7F4EF] p-1 rounded-full border border-[#E8E5E0]">
            <button
              type="button"
              onClick={() => {
                setViewMode('month');
                setActiveTooltip(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-extrabold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-[#2B2622] shadow-xs'
                  : 'text-[#8A837B] hover:text-[#2B2622]'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('year');
                setActiveTooltip(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-extrabold transition-all cursor-pointer ${
                viewMode === 'year'
                  ? 'bg-white text-[#2B2622] shadow-xs'
                  : 'text-[#8A837B] hover:text-[#2B2622]'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Period Selector Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-extrabold text-[#2B2622] tracking-tight">
              {viewMode === 'month' ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : `${selectedYear}`}
            </span>
            {isCurrentPeriod && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFF1E4] border border-[#FF8A1F]/30 text-[#D96F0A] text-[10px] font-extrabold uppercase tracking-wider">
                Current
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#F7F4EF] p-1 rounded-full border border-[#E8E5E0]">
            <button
              type="button"
              onClick={handlePrevPeriod}
              aria-label="Previous period"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B2622] hover:bg-white cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleNextPeriod}
              disabled={isCurrentPeriod}
              aria-label="Next period"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B2622] hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Reports Content */}
      <div className="px-5 py-5 flex flex-col gap-6">
        {/* Full Period Empty State (subfolder: rocash_reports_screen_empty_state) */}
        {isPeriodEmpty ? (
          <div className="py-14 px-6 rounded-[28px] bg-[#F7F4EF] border-2 border-dashed border-[#E8E5E0] flex flex-col items-center text-center gap-4 my-2 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FFF1E4] text-[#FF8A1F] flex items-center justify-center shadow-xs">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="flex flex-col gap-1 max-w-[280px]">
              <h2 className="text-[20px] font-extrabold text-[#2B2622]">
                No data for this period
              </h2>
              <p className="text-[13px] font-medium text-[#8A837B]">
                Start logging your daily expenses and savings to unlock visual trends and category insights.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openQuickEntry({ mode: 'expense' })}
              className="mt-2 px-6 h-[46px] rounded-full bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] font-extrabold text-[14px] text-[#2B2622] cursor-pointer shadow-xs active:translate-y-0.5"
            >
              Add an entry
            </button>
          </div>
        ) : (
          <>
            {/* 2. Totals Summary Hero Card */}
            {totalsQuery.loading ? (
              <div className="w-full h-[120px] rounded-[26px] bg-[#F7F4EF] border-2 border-[#E8E5E0] p-5 animate-pulse" />
            ) : totalsQuery.error ? (
              <div className="w-full rounded-[26px] bg-[#FFF1E4] border-2 border-[#FF8A1F]/30 p-4 text-center">
                <p className="text-[13px] font-bold text-[#D96F0A]">Could not load totals.</p>
                <button
                  type="button"
                  onClick={() => bumpRefresh()}
                  className="mt-1 text-[12px] font-extrabold text-[#2B2622] underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <section
                aria-label="Period summary"
                className="w-full rounded-[26px] bg-[#F7F4EF] border-2 border-[#E8E5E0] p-5 flex flex-col gap-4 shadow-xs"
              >
                <div className="flex items-center justify-between text-[13px] font-bold text-[#8A837B] uppercase tracking-wider">
                  <span>{viewMode === 'month' ? 'Month Summary' : 'Year Summary'}</span>
                  <span className="tabular">
                    {(totals?.expense_count ?? 0) + (totals?.saving_count ?? 0)} transactions
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-[#8A837B]">Total Spent</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[13px] font-bold text-[#8A837B]">UGX</span>
                      <span className="text-[24px] font-extrabold text-[#2B2622] tabular tracking-tight">
                        {formatCompact(totals?.spent ?? 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col border-l border-[#E8E5E0] pl-4">
                    <span className="text-[13px] font-bold text-[#2DBE6C]">Total Saved</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[13px] font-bold text-[#2DBE6C]">UGX</span>
                      <span className="text-[24px] font-extrabold text-[#2DBE6C] tabular tracking-tight">
                        {formatCompact(totals?.saved ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. SPENT VS SAVED SVG BAR CHART */}
            {(viewMode === 'month' ? weeklyBucketsQuery.loading : yearOverviewQuery.loading) ? (
              <div className="w-full h-[220px] rounded-[26px] bg-[#F7F4EF] border-2 border-[#E8E5E0] animate-pulse" />
            ) : (viewMode === 'month' ? weeklyBucketsQuery.error : yearOverviewQuery.error) ? (
              <div className="w-full rounded-[26px] bg-[#FFF1E4] border-2 border-[#FF8A1F]/30 p-4 text-center">
                <p className="text-[13px] font-bold text-[#D96F0A]">Could not load bar chart data.</p>
                <button
                  type="button"
                  onClick={() => bumpRefresh()}
                  className="mt-1 text-[12px] font-extrabold text-[#2B2622] underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <section
                aria-label="Spent versus Saved Chart"
                className="w-full rounded-[26px] bg-white border-2 border-[#E8E5E0] p-5 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-extrabold text-[#2B2622]">
                    Spent vs Saved
                  </h2>
                  <div className="flex items-center gap-3 text-[12px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A1F]" />
                      <span className="text-[#2B2622]">Spent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2DBE6C]" />
                      <span className="text-[#2DBE6C]">Saved</span>
                    </div>
                  </div>
                </div>

                {activeTooltip && (
                  <div className="px-3.5 py-2 rounded-xl bg-[#2B2622] text-white flex items-center justify-between text-[12px] font-bold animate-fade-in">
                    <span>{activeTooltip.label}</span>
                    <div className="flex items-center gap-3 tabular">
                      <span className="text-[#FF8A1F]">
                        Spent: {formatUGX(activeTooltip.spent)}
                      </span>
                      <span className="text-[#2DBE6C]">
                        Saved: {formatUGX(activeTooltip.saved)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="w-full overflow-x-auto flex justify-center py-1">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-[180px] max-w-[380px] select-none"
                  >
                    {yTicks.map((tickVal, idx) => {
                      const y = chartPadTop + plotHeight - (tickVal / topTick) * plotHeight;
                      return (
                        <g key={idx}>
                          <line
                            x1={chartPadLeft}
                            y1={y}
                            x2={svgWidth - chartPadRight}
                            y2={y}
                            stroke="#E8E5E0"
                            strokeWidth="1"
                            strokeDasharray={idx === 0 ? 'none' : '3 3'}
                          />
                          <text
                            x={chartPadLeft - 6}
                            y={y + 4}
                            fill="#8A837B"
                            fontSize="10"
                            fontWeight="700"
                            textAnchor="end"
                          >
                            {formatCompact(tickVal)}
                          </text>
                        </g>
                      );
                    })}

                    {barChartItems.map((item, i) => {
                      const numGroups = barChartItems.length;
                      const groupWidth = plotWidth / numGroups;
                      const groupCenterX = chartPadLeft + i * groupWidth + groupWidth / 2;

                      if (item.isFuture) {
                        const baselineY = chartPadTop + plotHeight;
                        return (
                          <g key={item.id}>
                            <circle
                              cx={groupCenterX}
                              cy={baselineY}
                              r="2.5"
                              fill="#D9D4CC"
                            />
                            <text
                              x={groupCenterX}
                              y={chartPadTop + plotHeight + 16}
                              fill="#8A837B"
                              fontSize="10"
                              fontWeight="700"
                              textAnchor="middle"
                            >
                              {item.label}
                            </text>
                          </g>
                        );
                      }

                      const barWidth = Math.min(12, Math.max(7, (groupWidth - 8) / 2));
                      const barGap = 2;

                      const spentHeight = topTick > 0 ? (item.spent / topTick) * plotHeight : 0;
                      const savedHeight = topTick > 0 ? (item.saved / topTick) * plotHeight : 0;

                      const spentX = groupCenterX - barWidth - barGap / 2;
                      const savedX = groupCenterX + barGap / 2;

                      const spentY = chartPadTop + plotHeight - spentHeight;
                      const savedY = chartPadTop + plotHeight - savedHeight;

                      const isTooltipActive = activeTooltip?.label === item.fullLabel;

                      return (
                        <g
                          key={item.id}
                          onClick={() =>
                            setActiveTooltip({
                              label: item.fullLabel,
                              spent: item.spent,
                              saved: item.saved,
                            })
                          }
                          className="cursor-pointer group"
                        >
                          <rect
                            x={groupCenterX - groupWidth / 2}
                            y={chartPadTop}
                            width={groupWidth}
                            height={plotHeight}
                            fill="transparent"
                          />

                          {spentHeight > 0 ? (
                            <rect
                              x={spentX}
                              y={spentY}
                              width={barWidth}
                              height={spentHeight}
                              rx="3"
                              fill="#FF8A1F"
                              className="transition-all duration-300 hover:brightness-105"
                            />
                          ) : (
                            <line
                              x1={spentX}
                              y1={chartPadTop + plotHeight}
                              x2={spentX + barWidth}
                              y2={chartPadTop + plotHeight}
                              stroke="#FF8A1F"
                              strokeWidth="2"
                            />
                          )}

                          {savedHeight > 0 ? (
                            <rect
                              x={savedX}
                              y={savedY}
                              width={barWidth}
                              height={savedHeight}
                              rx="3"
                              fill="#2DBE6C"
                              className="transition-all duration-300 hover:brightness-105"
                            />
                          ) : (
                            <line
                              x1={savedX}
                              y1={chartPadTop + plotHeight}
                              x2={savedX + barWidth}
                              y2={chartPadTop + plotHeight}
                              stroke="#2DBE6C"
                              strokeWidth="2"
                            />
                          )}

                          <text
                            x={groupCenterX}
                            y={chartPadTop + plotHeight + 16}
                            fill={isTooltipActive ? '#2B2622' : '#8A837B'}
                            fontSize="10"
                            fontWeight={isTooltipActive ? '800' : '700'}
                            textAnchor="middle"
                          >
                            {item.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <p className="text-[11px] font-medium text-[#8A837B] text-center">
                  Tap any bar to view exact amounts
                </p>
              </section>
            )}

            {/* 4. CATEGORY BREAKDOWN ("Where your money went") */}
            {categoriesQuery.loading ? (
              <div className="w-full h-[180px] rounded-[26px] bg-[#F7F4EF] border-2 border-[#E8E5E0] animate-pulse" />
            ) : categoriesQuery.error ? (
              <div className="w-full rounded-[26px] bg-[#FFF1E4] border-2 border-[#FF8A1F]/30 p-4 text-center">
                <p className="text-[13px] font-bold text-[#D96F0A]">Could not load category breakdown.</p>
                <button
                  type="button"
                  onClick={() => bumpRefresh()}
                  className="mt-1 text-[12px] font-extrabold text-[#2B2622] underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <section
                ref={categorySectionRef}
                aria-label="Category breakdown"
                className="w-full rounded-[26px] bg-white border-2 border-[#E8E5E0] p-5 shadow-xs flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[17px] font-extrabold text-[#2B2622]">
                      Where your money went
                    </h2>
                    <span className="text-[12px] font-bold text-[#8A837B]">
                      {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[18px] font-extrabold text-[#2B2622] tabular">
                      UGX {formatCompact(totalCategorySpent)}
                    </span>
                  </div>
                </div>

                {/* Stacked Proportional Bar */}
                {totalCategorySpent > 0 ? (
                  <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-[#E8E5E0]">
                    {categories.map(cat => {
                      const widthPct = Math.max(1, (cat.total / totalCategorySpent) * 100);
                      return (
                        <div
                          key={cat.category_id}
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: cat.color || '#FF8A1F',
                          }}
                          title={`${cat.name}: ${formatUGX(cat.total)}`}
                          className="h-full border-r border-white/40 last:border-r-0 transition-all duration-500"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-3 rounded-full bg-[#E8E5E0]" />
                )}

                {/* Fix-up 2: Category list amounts use formatCompact ("UGX 60K"), as in the design */}
                {categories.length === 0 || totalCategorySpent === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center text-[#8A837B]">
                    <span className="text-[13px] font-medium">
                      No expense categories logged for this period.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#E8E5E0]/60 pt-1">
                    {categories.map(cat => {
                      const sharePct = Math.round((cat.share || 0) * 100);
                      const color = cat.color || '#FF8A1F';

                      return (
                        <button
                          key={cat.category_id}
                          type="button"
                          onClick={() => {
                            const targetParam =
                              viewMode === 'month'
                                ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
                                : `${selectedYear}-01`;
                            navigate(`/history/${targetParam}?category=${cat.category_id}`);
                          }}
                          className="py-3 flex items-center justify-between text-left hover:bg-[#F7F4EF]/60 rounded-xl px-2 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              style={{ backgroundColor: `${color}20`, color: color }}
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-black/5"
                            >
                              {getCategoryIcon(cat.icon, 18)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-[#2B2622] group-hover:text-[#FF8A1F] transition-colors">
                                {cat.name}
                              </span>
                              <span className="text-[11px] font-medium text-[#8A837B]">
                                {cat.entries} {cat.entries === 1 ? 'entry' : 'entries'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px] font-extrabold text-[#2B2622] tabular">
                              UGX {formatCompact(cat.total)}
                            </span>
                            <span
                              style={{ backgroundColor: `${color}15`, color: color }}
                              className="px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular"
                            >
                              {sharePct}%
                            </span>
                            <span className="text-[#8A837B] text-[12px] group-hover:translate-x-0.5 transition-transform">
                              ›
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* 5. SAVINGS GROWTH SVG CHART */}
            {growthQuery.loading ? (
              <div className="w-full h-[180px] rounded-[26px] bg-[#F7F4EF] border-2 border-[#E8E5E0] animate-pulse" />
            ) : growthQuery.error ? (
              <div className="w-full rounded-[26px] bg-[#FFF1E4] border-2 border-[#FF8A1F]/30 p-4 text-center">
                <p className="text-[13px] font-bold text-[#D96F0A]">Could not load savings growth.</p>
                <button
                  type="button"
                  onClick={() => bumpRefresh()}
                  className="mt-1 text-[12px] font-extrabold text-[#2B2622] underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <section
                aria-label="Savings growth chart"
                className="w-full rounded-[26px] bg-white border-2 border-[#E8E5E0] p-5 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-extrabold text-[#2B2622]">
                    Savings Growth
                  </h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[12px] font-bold text-[#2DBE6C]">Total:</span>
                    <span className="text-[16px] font-extrabold text-[#2DBE6C] tabular">
                      UGX {formatCompact(monthSavedTotal)}
                    </span>
                  </div>
                </div>

                {/* Monthly Target Progress Strip (Month view only, hidden if no goal) */}
                {viewMode === 'month' && monthlyGoalTarget !== null && (
                  <div className="w-full bg-[#E6F7EE] rounded-[18px] p-3.5 border border-[#C5EBD6] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[12px] font-bold">
                      <span className="text-[#1F9A52]">
                        {goalProgressPercent}% of your monthly target
                      </span>
                      <span className="text-[#4D6B5C] tabular">
                        about UGX {formatCompact(monthlyGoalTarget)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#CDEBDA] overflow-hidden">
                      <div
                        className="h-full bg-[#2DBE6C] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${goalProgressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Plain SVG Polyline Chart */}
                {growthData.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-[#8A837B] text-[13px]">
                    No savings recorded yet for this period.
                  </div>
                ) : (
                  <div className="w-full overflow-hidden py-1">
                    {(() => {
                      const growthMax = Math.max(
                        ...growthData.map(d => d.running_total),
                        10000
                      );
                      const gTicks = calculateNiceTicks(growthMax, 3);
                      const gTop = gTicks[gTicks.length - 1] || growthMax;

                      const gSvgWidth = 340;
                      const gSvgHeight = 130;
                      const gPadLeft = 46;
                      const gPadRight = 16;
                      const gPadTop = 14;
                      const gPadBottom = 22;
                      const gPlotW = gSvgWidth - gPadLeft - gPadRight;
                      const gPlotH = gSvgHeight - gPadTop - gPadBottom;

                      const n = growthData.length;
                      const points = growthData.map((d, idx) => {
                        const x = gPadLeft + (idx / Math.max(1, n - 1)) * gPlotW;
                        const y = gPadTop + gPlotH - (d.running_total / gTop) * gPlotH;
                        return { x, y, ...d };
                      });

                      const polylineStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                      const areaStr = `${gPadLeft},${gPadTop + gPlotH} ${polylineStr} ${points[points.length - 1].x.toFixed(1)},${gPadTop + gPlotH}`;

                      const lastPoint = points[points.length - 1];

                      return (
                        <svg
                          viewBox={`0 0 ${gSvgWidth} ${gSvgHeight}`}
                          className="w-full h-[140px] max-w-[380px] select-none mx-auto"
                        >
                          {gTicks.map((tVal, tIdx) => {
                            const y = gPadTop + gPlotH - (tVal / gTop) * gPlotH;
                            return (
                              <g key={tIdx}>
                                <line
                                  x1={gPadLeft}
                                  y1={y}
                                  x2={gSvgWidth - gPadRight}
                                  y2={y}
                                  stroke="#E8E5E0"
                                  strokeWidth="1"
                                  strokeDasharray={tIdx === 0 ? 'none' : '3 3'}
                                />
                                <text
                                  x={gPadLeft - 6}
                                  y={y + 3.5}
                                  fill="#8A837B"
                                  fontSize="9"
                                  fontWeight="700"
                                  textAnchor="end"
                                >
                                  {formatCompact(tVal)}
                                </text>
                              </g>
                            );
                          })}

                          <polygon points={areaStr} fill="#E6F7EE" opacity="0.9" />

                          <polyline
                            points={polylineStr}
                            fill="none"
                            stroke="#2DBE6C"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {lastPoint && (
                            <g>
                              <circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r="5"
                                fill="white"
                                stroke="#2DBE6C"
                                strokeWidth="2.5"
                              />
                              <circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r="2.5"
                                fill="#1F9A52"
                              />
                            </g>
                          )}
                        </svg>
                      );
                    })()}
                  </div>
                )}
              </section>
            )}

            {/* 6. INSIGHTS CARD (Only rendered when strictly supported by data) */}
            {(topCategory || weeklySavingsDiffInsight) && (
              <section
                aria-label="Insights"
                className="w-full rounded-[24px] bg-[#FFF1E4] border-2 border-[#FF8A1F]/30 p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">💡</span>
                  <h3 className="text-[15px] font-extrabold text-[#2B2622]">
                    Key Insights
                  </h3>
                </div>

                <div className="flex flex-col gap-2 text-[13px] font-semibold text-[#2B2622]/90">
                  {topCategory && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF8A1F] font-extrabold">•</span>
                      <span>
                        <strong className="font-extrabold text-[#2B2622]">
                          {topCategory.name}
                        </strong>{' '}
                        is your top category at{' '}
                        <strong className="font-extrabold text-[#D96F0A]">
                          {topCategoryPercent}%
                        </strong>{' '}
                        of spending.
                      </span>
                    </div>
                  )}

                  {weeklySavingsDiffInsight && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#2DBE6C] font-extrabold">•</span>
                      <span>{weeklySavingsDiffInsight}</span>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
