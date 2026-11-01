import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { period_totals, daily_summary } from '../api/rpc.ts';
import { listTransactions } from '../api/transactions.ts';
import { listCategories } from '../api/categories.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';

import { todayLocal, parts, daysInMonth } from '../lib/date.ts';
import { formatCompact, formatUGX } from '../lib/money.ts';
import { getCategoryIcon } from '../lib/categories.tsx';

import { useAppShell } from '../components/AppShell.tsx';
import { BottomSheet } from '../components/BottomSheet.tsx';
import type { Transaction, Category } from '../types.ts';

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

export const MonthDetailScreen: React.FC = () => {
  const { yearMonth } = useParams<{ yearMonth: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { openQuickEntry } = useAppShell();

  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const todayStr = todayLocal(userTimezone);
  const { year: currentYear, month: currentMonth } = parts(todayStr);

  // Validate or parse yearMonth param
  const parsed = useMemo(() => {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return { year: currentYear, month: currentMonth };
    }
    const [y, m] = yearMonth.split('-').map(Number);
    return { year: y, month: Math.min(Math.max(m, 1), 12) };
  }, [yearMonth, currentYear, currentMonth]);

  const year = parsed.year;
  const month = parsed.month;
  const monthName = MONTH_NAMES[month - 1];
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = daysInMonth(year, month);
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const isCurrentMonth = year === currentYear && month === currentMonth;

  // Filter state
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'saving'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  // Category filter from query param (reading searchParams or hash)
  const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
  const hashCategoryParam = useMemo(() => {
    try {
      return new URLSearchParams(hashQuery).get('category');
    } catch {
      return null;
    }
  }, [hashQuery]);

  const selectedCategoryId = searchParams.get('category') || hashCategoryParam || '';

  // 1. Month Totals Query
  const totalsQuery = useData(
    () => period_totals(monthStart, monthEnd),
    [monthStart, monthEnd]
  );
  const totals = totalsQuery.data;

  // 2. Daily Summary for day headers
  const summaryQuery = useData(
    () => daily_summary(monthStart, monthEnd),
    [monthStart, monthEnd]
  );
  const summaryRows = summaryQuery.data || [];

  // 3. Transactions List Query for this month
  const transactionsQuery = useData(
    () => listTransactions({ from: monthStart, to: monthEnd }),
    [monthStart, monthEnd]
  );
  const transactions = transactionsQuery.data || [];

  // 4. Categories list (including archived)
  const categoriesQuery = useData(
    () => listCategories({ includeArchived: true }),
    []
  );
  const categories = categoriesQuery.data || [];
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const selectedCategory = selectedCategoryId ? categoryMap.get(selectedCategoryId) : null;

  // Navigation between months
  const handlePrevMonth = () => {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const suffix = selectedCategoryId ? `?category=${selectedCategoryId}` : '';
    navigate(`/history/${prevYear}-${String(prevMonth).padStart(2, '0')}${suffix}`);
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const suffix = selectedCategoryId ? `?category=${selectedCategoryId}` : '';
    navigate(`/history/${nextYear}-${String(nextMonth).padStart(2, '0')}${suffix}`);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      // Category filter
      if (selectedCategoryId) {
        if (tx.type !== 'expense' || tx.category_id !== selectedCategoryId) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const cat = tx.category_id ? categoryMap.get(tx.category_id) : null;
        const catMatch = (cat?.name || '').toLowerCase().includes(query);
        if (!noteMatch && !catMatch) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, typeFilter, selectedCategoryId, searchQuery, categoryMap]);

  // Group filtered transactions by day
  const groupedByDay = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredTransactions.forEach(tx => {
      const day = tx.occurred_on;
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day)!.push(tx);
    });

    const sortedDays = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    sortedDays.forEach(day => {
      groups.push({ date: day, items: map.get(day)! });
    });

    return groups;
  }, [filteredTransactions]);

  const isFiltersActive =
    typeFilter !== 'all' || Boolean(selectedCategoryId) || searchQuery.trim().length > 0;

  const formatDayHeader = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const { year: y, month: m, day: d } = parts(dateStr);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(dateObj);
  };

  const formatTxTime = (occurredAt?: string) => {
    if (!occurredAt) return '';
    try {
      const d = new Date(occurredAt);
      return new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return '';
    }
  };

  const handleSelectCategory = (catId: string) => {
    setIsCategorySheetOpen(false);
    if (catId === '') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const isLoading = totalsQuery.loading || transactionsQuery.loading;
  const isError = Boolean(totalsQuery.error || transactionsQuery.error);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* Header Container */}
      <div className="px-5 pt-7 pb-4 flex flex-col gap-4 border-b border-[#E8E5E0] bg-white sticky top-0 z-20 shadow-2xs">
        {/* Top Action Row: Back to Year & Search Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F7F4EF] border border-[#E8E5E0] text-[13px] font-extrabold text-[#2B2622] hover:bg-[#FFF1E4] transition-colors cursor-pointer"
          >
            <span>‹</span>
            <span>{year}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(prev => !prev)}
              aria-label="Toggle search"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen || searchQuery
                  ? 'bg-[#FF8A1F] text-[#2B2622]'
                  : 'bg-[#F7F4EF] border border-[#E8E5E0] text-[#2B2622] hover:bg-[#FFF1E4]'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>

        {/* Month Selector Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[26px] font-extrabold text-[#2B2622] tracking-tight leading-none">
              {monthName} {year}
            </h1>
            {isCurrentMonth && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFF1E4] border border-[#FF8A1F]/30 text-[#D96F0A] text-[10px] font-extrabold uppercase tracking-wider">
                Current
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#F7F4EF] p-1 rounded-full border border-[#E8E5E0]">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B2622] hover:bg-white cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B2622] hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar (Toggled) */}
        {isSearchOpen && (
          <div className="relative w-full">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search note or category…"
              className="w-full h-[42px] pl-10 pr-9 rounded-xl bg-[#F7F4EF] border-2 border-[#FF8A1F] text-[14px] font-medium text-[#2B2622] outline-none"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A837B]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A837B] hover:text-[#2B2622] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Filter Chips Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-[#2B2622] text-white'
                : 'bg-[#F7F4EF] text-[#8A837B] border border-[#E8E5E0] hover:text-[#2B2622]'
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-[#FF8A1F] text-[#2B2622]'
                : 'bg-[#F7F4EF] text-[#8A837B] border border-[#E8E5E0] hover:text-[#2B2622]'
            }`}
          >
            Expenses
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('saving')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'saving'
                ? 'bg-[#2DBE6C] text-white'
                : 'bg-[#F7F4EF] text-[#8A837B] border border-[#E8E5E0] hover:text-[#2B2622]'
            }`}
          >
            Savings
          </button>

          {/* Fix-up 3: Category chip shows selected category name */}
          <button
            type="button"
            onClick={() => setIsCategorySheetOpen(true)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-extrabold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory || selectedCategoryId
                ? 'bg-[#FFF1E4] border border-[#FF8A1F] text-[#D96F0A]'
                : 'bg-[#F7F4EF] text-[#8A837B] border border-[#E8E5E0] hover:text-[#2B2622]'
            }`}
          >
            {selectedCategory || selectedCategoryId ? (
              <>
                <span>{selectedCategory ? selectedCategory.name : 'Category'}</span>
                <span
                  onClick={e => {
                    e.stopPropagation();
                    handleSelectCategory('');
                  }}
                  className="hover:text-black ml-0.5"
                >
                  ✕
                </span>
              </>
            ) : (
              <>
                <span>Category</span>
                <span className="text-[10px]">▼</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Error State */}
        {isError && (
          <div className="p-5 rounded-[24px] bg-[#FFF1E4] border-2 border-[#FF8A1F]/30 flex flex-col items-center text-center gap-2">
            <span className="text-[15px] font-extrabold text-[#2B2622]">
              Couldn't load month entries
            </span>
            <p className="text-[13px] text-[#8A837B]">
              {totalsQuery.error || transactionsQuery.error || 'Connection error'}
            </p>
            <button
              type="button"
              onClick={() => bumpRefresh()}
              className="mt-2 px-5 py-2 rounded-full bg-[#FF8A1F] border-b-[3px] border-[#D96F0A] text-[#2B2622] font-extrabold text-[13px] cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-[88px] rounded-[24px] bg-[#F7F4EF] border border-[#E8E5E0]" />
            <div className="h-[140px] rounded-[24px] bg-[#F7F4EF] border border-[#E8E5E0]" />
            <div className="h-[140px] rounded-[24px] bg-[#F7F4EF] border border-[#E8E5E0]" />
          </div>
        )}

        {/* Populated / Filtered List */}
        {!isLoading && !isError && (
          <>
            {/* Month Figures Card */}
            <section
              aria-label="Month figures"
              className="w-full rounded-[24px] bg-[#F7F4EF] border border-[#E8E5E0] p-4 flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#8A837B] uppercase tracking-wider">
                  Spent
                </span>
                <span className="text-[20px] font-extrabold text-[#2B2622] tabular mt-0.5">
                  UGX {formatCompact(totals?.spent ?? 0)}
                </span>
              </div>

              <div className="h-9 w-[1px] bg-[#E8E5E0]" />

              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#8A837B] uppercase tracking-wider">
                  Saved
                </span>
                <span className="text-[20px] font-extrabold text-[#2DBE6C] tabular mt-0.5">
                  UGX {formatCompact(totals?.saved ?? 0)}
                </span>
              </div>

              <div className="h-9 w-[1px] bg-[#E8E5E0]" />

              <div className="flex flex-col text-right">
                <span className="text-[12px] font-bold text-[#8A837B] uppercase tracking-wider">
                  Entries
                </span>
                <span className="text-[20px] font-extrabold text-[#2B2622] tabular mt-0.5">
                  {(totals?.expense_count ?? 0) + (totals?.saving_count ?? 0)}
                </span>
              </div>
            </section>

            {/* Empty Month State */}
            {transactions.length === 0 ? (
              <div className="py-12 px-6 rounded-[28px] bg-[#F7F4EF] border-2 border-dashed border-[#E8E5E0] flex flex-col items-center text-center gap-3 mt-2">
                <div className="w-14 h-14 rounded-full bg-[#FFF1E4] text-[#FF8A1F] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-extrabold text-[#2B2622]">
                  No entries in {monthName}
                </h3>
                <p className="text-[13px] font-medium text-[#8A837B] max-w-[240px]">
                  You have not logged any expenses or savings for this month.
                </p>

                <div className="flex flex-col gap-2 w-full max-w-[220px] mt-2">
                  <button
                    type="button"
                    onClick={() => openQuickEntry({ mode: 'expense' })}
                    className="w-full h-[46px] rounded-full bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] font-extrabold text-[14px] text-[#2B2622] cursor-pointer"
                  >
                    Add an entry
                  </button>

                  {!isCurrentMonth && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/history/${currentYear}-${String(currentMonth).padStart(2, '0')}`)
                      }
                      className="w-full py-2 text-[13px] font-bold text-[#8A837B] hover:text-[#2B2622] cursor-pointer"
                    >
                      Back to {currentMonthName}
                    </button>
                  )}
                </div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-10 px-6 rounded-[24px] bg-[#F7F4EF] border border-[#E8E5E0] flex flex-col items-center text-center gap-2 mt-2">
                <span className="text-[15px] font-extrabold text-[#2B2622]">
                  No matching transactions
                </span>
                <p className="text-[13px] text-[#8A837B]">
                  No entries found for your selected filters or search.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('all');
                    setSearchQuery('');
                    handleSelectCategory('');
                  }}
                  className="mt-2 text-[13px] font-extrabold text-[#FF8A1F] hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {groupedByDay.map(({ date, items }) => {
                  const daySummary = summaryRows.find(s => s.day === date);

                  return (
                    <div
                      key={date}
                      className="w-full rounded-[24px] bg-white border-2 border-[#E8E5E0] overflow-hidden shadow-2xs"
                    >
                      {/* Day Header */}
                      <div className="px-4 py-3 bg-[#F7F4EF]/80 border-b border-[#E8E5E0] flex items-center justify-between">
                        <span className="text-[13px] font-extrabold text-[#2B2622]">
                          {formatDayHeader(date)}
                        </span>

                        {!isFiltersActive && daySummary && (
                          <span className="text-[12px] font-bold text-[#8A837B] tabular">
                            Spent {formatCompact(daySummary.spent)} · Saved {formatCompact(daySummary.saved)}
                          </span>
                        )}
                      </div>

                      {/* Entries inside Day Card */}
                      <div className="divide-y divide-[#E8E5E0]/70">
                        {items.map(tx => {
                          const isExpense = tx.type === 'expense';
                          const cat = tx.category_id ? categoryMap.get(tx.category_id) : null;
                          const iconKey = cat?.icon || 'grid';
                          const catColor = cat?.color || '#FF8A1F';

                          return (
                            <button
                              key={tx.id}
                              type="button"
                              onClick={() => openQuickEntry({ tx })}
                              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F7F4EF]/50 active:bg-[#F7F4EF] transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  style={{
                                    backgroundColor: isExpense ? `${catColor}20` : '#E6F7EE',
                                    color: isExpense ? catColor : '#2DBE6C',
                                  }}
                                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-black/5"
                                >
                                  {isExpense ? (
                                    getCategoryIcon(iconKey, 20)
                                  ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M19 11V9a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2a4 4 0 0 0-2 3.5V16a2 2 0 0 0 2 2h1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h4v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h1a2 2 0 0 0 2-2v-1.5a4 4 0 0 0-2-3.5Z" />
                                    </svg>
                                  )}
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <span className="text-[15px] font-bold text-[#2B2622] truncate">
                                    {isExpense ? (cat?.name || 'Expense') : 'Saving'}
                                  </span>
                                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#8A837B]">
                                    {tx.note && (
                                      <span className="truncate max-w-[140px] text-[#2B2622]/70">
                                        {tx.note}
                                      </span>
                                    )}
                                    {tx.note && <span>·</span>}
                                    <span>{formatTxTime(tx.occurred_at)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 pl-2">
                                <span
                                  className={`text-[15px] font-extrabold tabular ${
                                    isExpense ? 'text-[#2B2622]' : 'text-[#2DBE6C]'
                                  }`}
                                >
                                  {isExpense ? `-${formatUGX(tx.amount)}` : `+${formatUGX(tx.amount)}`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Category Picker Bottom Sheet */}
      <BottomSheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        title="Filter by category"
      >
        <div className="flex flex-col gap-2 pt-1 max-h-[360px] overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelectCategory('')}
            className={`w-full p-3 rounded-xl flex items-center justify-between text-left font-bold text-[14px] cursor-pointer ${
              selectedCategoryId === ''
                ? 'bg-[#FFF1E4] text-[#D96F0A] border border-[#FF8A1F]'
                : 'hover:bg-[#F7F4EF] text-[#2B2622]'
            }`}
          >
            <span>All categories</span>
            {selectedCategoryId === '' && <span>✓</span>}
          </button>

          {categories.map(cat => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#FFF1E4] border border-[#FF8A1F]'
                    : 'hover:bg-[#F7F4EF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  >
                    {getCategoryIcon(cat.icon, 18)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-[#2B2622]">
                      {cat.name}
                    </span>
                    {cat.archived_at && (
                      <span className="text-[11px] font-medium text-[#8A837B]">
                        Archived
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && <span className="text-[#FF8A1F] font-extrabold">✓</span>}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};
