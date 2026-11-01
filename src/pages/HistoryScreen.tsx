import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { year_overview } from '../api/rpc.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import { todayLocal, parts } from '../lib/date.ts';
import { formatCompact } from '../lib/money.ts';
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

export const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { openQuickEntry } = useAppShell();

  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const todayStr = todayLocal(userTimezone);
  const { year: currentYear, month: currentMonth } = parts(todayStr);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const currentMonthCardRef = useRef<HTMLButtonElement | null>(null);
  const hasAutoScrolledRef = useRef<boolean>(false);

  const minYear = currentYear - 4;

  const yearOverviewQuery = useData(
    () => year_overview(selectedYear),
    [selectedYear]
  );

  const rows = yearOverviewQuery.data || [];
  const isLoading = yearOverviewQuery.loading;
  const isError = Boolean(yearOverviewQuery.error);

  const yearSpent = rows.reduce((sum, r) => sum + (r.spent || 0), 0);
  const yearSaved = rows.reduce((sum, r) => sum + (r.saved || 0), 0);
  const yearEntries = rows.reduce((sum, r) => sum + (r.entries || 0), 0);

  useEffect(() => {
    if (
      !isLoading &&
      selectedYear === currentYear &&
      currentMonthCardRef.current &&
      !hasAutoScrolledRef.current
    ) {
      hasAutoScrolledRef.current = true;
      currentMonthCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isLoading, selectedYear, currentYear]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 70) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrevYear = () => {
    if (selectedYear > minYear) {
      setSelectedYear(prev => prev - 1);
      hasAutoScrolledRef.current = false;
    }
  };

  const handleNextYear = () => {
    if (selectedYear < currentYear) {
      setSelectedYear(prev => prev + 1);
      hasAutoScrolledRef.current = false;
    }
  };

  const handleMonthClick = (monthNum: number) => {
    const paddedMonth = String(monthNum).padStart(2, '0');
    navigate(`/history/${selectedYear}-${paddedMonth}`);
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* Sticky Slim Header (shown on scroll) */}
      <div
        className={`fixed top-0 left-0 right-0 max-w-[430px] mx-auto z-30 transition-all duration-200 ${
          isScrolled
            ? 'opacity-100 translate-y-0 shadow-sm pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        } bg-[#FF8A1F] border-b border-[#D96F0A] px-4 py-2.5 flex items-center justify-between text-[#2B2622]`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-extrabold tracking-tight">History</span>
          <span className="text-[14px] font-bold opacity-80">· {selectedYear}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevYear}
            disabled={selectedYear <= minYear}
            aria-label="Previous year"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-[14px] font-extrabold px-1">{selectedYear}</span>
          <button
            type="button"
            onClick={handleNextYear}
            disabled={selectedYear >= currentYear}
            aria-label="Next year"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-5 pt-8 pb-6 flex flex-col gap-5">
        {/* Full Header at top */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#2B2622] tracking-tight leading-tight">
              History
            </h1>
            <p className="text-[13px] font-medium text-[#8A837B]">
              Browse your spending & savings by month
            </p>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1 bg-[#F7F4EF] p-1 rounded-full border border-[#E8E5E0]">
            <button
              type="button"
              onClick={handlePrevYear}
              disabled={selectedYear <= minYear}
              aria-label="Previous year"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B2622] hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-[14px] font-extrabold text-[#2B2622] px-2 tabular">
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextYear}
              disabled={selectedYear >= currentYear}
              aria-label="Next year"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B2622] hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </header>

        {/* Error State */}
        {isError && (
          <div className="p-5 rounded-[24px] bg-[#FFF1E4] border-2 border-[#FF8A1F]/30 flex flex-col items-center text-center gap-3">
            <span className="text-[15px] font-extrabold text-[#2B2622]">
              Couldn't load history for {selectedYear}
            </span>
            <p className="text-[13px] text-[#8A837B]">
              {yearOverviewQuery.error || 'Please check your connection.'}
            </p>
            <button
              type="button"
              onClick={() => bumpRefresh()}
              className="px-5 py-2 rounded-full bg-[#FF8A1F] border-b-[3px] border-[#D96F0A] text-[#2B2622] font-extrabold text-[13px] cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State Skeletons */}
        {isLoading && (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-[96px] rounded-[24px] bg-[#F7F4EF] border border-[#E8E5E0]" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square rounded-[22px] bg-[#F7F4EF] border border-[#E8E5E0]" />
              ))}
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && !isError && (
          <>
            {/* Fix-up 5: Year Summary Card - exactly 2 columns, Total spent & Total saved, no total transactions count */}
            <section
              aria-label="Year summary"
              className="w-full rounded-[24px] bg-[#F7F4EF] border-2 border-[#E8E5E0] p-4 flex items-center justify-between"
            >
              <div className="flex-1 flex flex-col">
                <span className="text-[12px] font-bold text-[#8A837B] uppercase tracking-wider">
                  Total spent
                </span>
                <span className="text-[22px] font-extrabold text-[#2B2622] tabular mt-0.5">
                  UGX {formatCompact(yearSpent)}
                </span>
              </div>

              <div className="h-10 w-[1px] bg-[#E8E5E0] mx-4" />

              <div className="flex-1 flex flex-col pl-2">
                <span className="text-[12px] font-bold text-[#2DBE6C] uppercase tracking-wider">
                  Total saved
                </span>
                <span className="text-[22px] font-extrabold text-[#2DBE6C] tabular mt-0.5">
                  UGX {formatCompact(yearSaved)}
                </span>
              </div>
            </section>

            {/* Empty Year Check */}
            {yearEntries === 0 ? (
              <div className="py-12 px-6 rounded-[28px] bg-[#F7F4EF] border-2 border-dashed border-[#E8E5E0] flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#FFF1E4] text-[#FF8A1F] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-extrabold text-[#2B2622]">
                  Nothing logged in {selectedYear}
                </h3>
                <p className="text-[13px] font-medium text-[#8A837B] max-w-[260px]">
                  {selectedYear === currentYear
                    ? 'Track your daily expenses and savings to see your monthly archive here.'
                    : 'There are no recorded transactions for this entire calendar year.'}
                </p>
                {selectedYear === currentYear && (
                  <button
                    type="button"
                    onClick={() => openQuickEntry({ mode: 'expense' })}
                    className="mt-2 px-6 h-[46px] rounded-full bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] font-extrabold text-[14px] text-[#2B2622] cursor-pointer"
                  >
                    Add an entry
                  </button>
                )}
              </div>
            ) : null}

            {/* 12 Month Grid (2 columns) - Fix-up 5: No entries count on month cards */}
            <section
              aria-label="Months"
              className="grid grid-cols-2 gap-3"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const monthNum = i + 1;
                const monthName = MONTH_NAMES[i];
                const row = rows.find(r => r.month === monthNum);

                const isCurrentMonth =
                  selectedYear === currentYear && monthNum === currentMonth;
                const isPastMonth =
                  selectedYear < currentYear ||
                  (selectedYear === currentYear && monthNum < currentMonth);
                const isFutureMonth =
                  selectedYear > currentYear ||
                  (selectedYear === currentYear && monthNum > currentMonth);

                const hasEntries = (row?.entries ?? 0) > 0;
                const spent = row?.spent ?? 0;
                const saved = row?.saved ?? 0;

                // 1. Current Month Card
                if (isCurrentMonth) {
                  return (
                    <button
                      key={monthNum}
                      ref={currentMonthCardRef}
                      type="button"
                      onClick={() => handleMonthClick(monthNum)}
                      className="aspect-square rounded-[24px] bg-white border-2 border-[#FF8A1F] p-4 flex flex-col justify-between text-left shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] font-extrabold text-[#2B2622]">
                          {monthName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF1E4] border border-[#FF8A1F]/30 text-[#D96F0A] text-[10px] font-extrabold uppercase tracking-wider">
                          Now
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 my-auto">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-semibold text-[#8A837B]">Spent</span>
                          <span className="font-extrabold text-[#2B2622] tabular">
                            {formatCompact(spent)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-semibold text-[#8A837B]">Saved</span>
                          <span className="font-extrabold text-[#2DBE6C] tabular">
                            {formatCompact(saved)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-[#FF8A1F]">
                        View details ›
                      </div>
                    </button>
                  );
                }

                // 2. Past Month with Entries
                if (isPastMonth && hasEntries) {
                  return (
                    <button
                      key={monthNum}
                      type="button"
                      onClick={() => handleMonthClick(monthNum)}
                      className="aspect-square rounded-[24px] bg-white border-2 border-[#E8E5E0] p-4 flex flex-col justify-between text-left hover:border-[#FF8A1F] transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] font-extrabold text-[#2B2622]">
                          {monthName}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 my-auto">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-semibold text-[#8A837B]">Spent</span>
                          <span className="font-extrabold text-[#2B2622] tabular">
                            {formatCompact(spent)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-semibold text-[#8A837B]">Saved</span>
                          <span className="font-extrabold text-[#2DBE6C] tabular">
                            {formatCompact(saved)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-[#8A837B]">
                        View details ›
                      </div>
                    </button>
                  );
                }

                // 3. Past Month Empty (Dashed, Tappable)
                if (isPastMonth && !hasEntries) {
                  return (
                    <button
                      key={monthNum}
                      type="button"
                      onClick={() => handleMonthClick(monthNum)}
                      className="aspect-square rounded-[24px] bg-[#F7F4EF] border-2 border-dashed border-[#E8E5E0] p-4 flex flex-col justify-between text-left hover:border-[#FF8A1F] transition-all cursor-pointer"
                    >
                      <span className="text-[16px] font-bold text-[#8A837B]">
                        {monthName}
                      </span>
                      <div className="my-auto flex flex-col items-center justify-center text-center">
                        <span className="text-[12px] font-bold text-[#8A837B]/80">
                          No entries
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[#8A837B]/60">
                        Tap to view
                      </span>
                    </button>
                  );
                }

                // 4. Future Month (Faded + Lock, Not Tappable)
                return (
                  <div
                    key={monthNum}
                    className="aspect-square rounded-[24px] bg-[#F7F4EF]/60 border border-[#E8E5E0]/60 p-4 flex flex-col justify-between text-left opacity-45 select-none cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-[#8A837B]">
                        {monthName}
                      </span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A837B" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="my-auto flex items-center justify-center text-[12px] font-medium text-[#8A837B]">
                      Upcoming
                    </div>
                    <div className="h-3" />
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </div>
  );
};
