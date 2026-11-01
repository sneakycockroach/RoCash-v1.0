import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { current_streak, period_totals, daily_summary } from '../api/rpc.ts';
import { updateProfile } from '../api/profile.ts';
import { todayLocal, addDays, parts } from '../lib/date.ts';
import { formatUGX } from '../lib/money.ts';
import { useData } from '../hooks/useData.tsx';
import { getAvatarSvg } from '../lib/avatar.ts';
import { WELCOME_BACK_SESSION_KEY } from '../routes/boot.ts';
import { FlameIcon } from '../components/Icons.tsx';

export const WelcomeBackScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  const [countdown, setCountdown] = useState<number>(10);
  const [countdownActive, setCountdownActive] = useState<boolean>(true);
  const timerStartedRef = useRef(false);

  const localToday = todayLocal(profile?.timezone || 'Africa/Kampala');
  const sevenDaysAgo = addDays(localToday, -6);

  const streakQuery = useData(() => current_streak(localToday), [localToday]);
  const last7DaysQuery = useData(
    () => daily_summary(sevenDaysAgo, localToday),
    [sevenDaysAgo, localToday]
  );
  // All-time saved total: period_totals from "2000-01-01" to today
  const allTimeTotalsQuery = useData(
    () => period_totals('2000-01-01', localToday),
    [localToday]
  );

  const streak = streakQuery.data ?? 0;
  const totals = allTimeTotalsQuery.data;
  const totalEntries = (totals?.expense_count ?? 0) + (totals?.saving_count ?? 0);
  const totalSaved = totals?.saved ?? 0;

  const isEmptyState = totalEntries === 0;

  // Real 7 days list
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dayStr = addDays(sevenDaysAgo, i);
    const summaryRow = (last7DaysQuery.data || []).find(r => r.day === dayStr);
    const { year, month, day } = parts(dayStr);
    const d = new Date(Date.UTC(year, month - 1, day));
    const weekdayLetter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'narrow',
    }).format(d);

    return {
      date: dayStr,
      weekdayLetter,
      isToday: dayStr === localToday,
      goalMet: Boolean(summaryRow?.goal_met),
    };
  });

  // Mark in sessionStorage that welcome back has been shown in this browser session
  useEffect(() => {
    sessionStorage.setItem(WELCOME_BACK_SESSION_KEY, 'true');
  }, []);

  // Countdown timer logic: starts once per visit and never restarts
  useEffect(() => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Any tap or key press cancels countdown
  const cancelCountdown = () => {
    if (countdownActive) {
      setCountdownActive(false);
    }
  };

  useEffect(() => {
    const handleKey = () => cancelCountdown();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [countdownActive]);

  const handleHopIn = () => {
    navigate('/', { replace: true });
  };

  const handleDontShowAgain = async () => {
    await updateProfile({ welcome_back_enabled: false });
    await refreshProfile();
    navigate('/', { replace: true });
  };

  const displayName = profile?.display_name || 'Friend';
  const avatarSeed = profile?.avatar_seed || 'sunrise';

  return (
    <div
      onClick={cancelCountdown}
      className="min-h-screen max-w-[430px] mx-auto bg-[#FF8A1F] flex flex-col justify-between relative overflow-hidden select-none cursor-pointer"
    >
      {/* Orange Header Section */}
      <header className="px-6 pt-12 pb-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[24px] font-extrabold text-[#2B2622] tracking-tight">
            RoCash
          </span>
          <div
            className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-white shadow-xs"
            dangerouslySetInnerHTML={{ __html: getAvatarSvg(avatarSeed) }}
          />
        </div>

        <div className="mt-2">
          <h1 className="text-[40px] font-extrabold leading-[1.08] text-[#2B2622] tracking-tight">
            Welcome back,<br />{displayName}
          </h1>
          <p className="mt-2 text-[17px] font-medium text-[#2B2622]/80 leading-snug">
            {isEmptyState
              ? 'Your RoCash is ready when you are.'
              : 'Your progress is still here.'}
          </p>
        </div>
      </header>

      {/* White Sheet Section */}
      <main className="bg-white rounded-t-[32px] px-6 pt-7 pb-8 flex-1 flex flex-col justify-between">
        <div className="flex flex-col w-full">
          {/* 1. STREAK CARD */}
          {isEmptyState ? (
            /* Empty state streak card */
            <div className="w-full rounded-[28px] bg-[#F7F4EF] border-2 border-[#E8E5E0] p-5 flex flex-col justify-between">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-14 h-14 rounded-full bg-[#FFD9BD] flex items-center justify-center shrink-0">
                  <FlameIcon size={30} color="#2B2622" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[26px] font-extrabold text-[#2B2622] leading-tight tracking-tight">
                    No streak yet
                  </span>
                  <span className="text-[14px] font-medium text-[#8A837B] mt-0.5">
                    Log something today to start one
                  </span>
                </div>
              </div>

              {/* 7 Day Columns */}
              <div className="flex justify-between items-center w-full pt-1">
                {last7Days.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className={`text-[13px] font-bold ${item.isToday ? 'text-[#2B2622]' : 'text-[#8A837B]'}`}>
                      {item.weekdayLetter}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full bg-white border-2 border-[#E8E5E0]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Populated state streak card */
            <div className="w-full rounded-[28px] bg-[#FFE9E3] border-2 border-[#FFD2C6] p-5 flex flex-col justify-between">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-14 h-14 rounded-full bg-[#F2542D] flex items-center justify-center shrink-0">
                  <FlameIcon size={30} color="#2B2622" />
                </div>

                <div className="flex flex-col">
                  <span className="text-[28px] font-extrabold text-[#2B2622] leading-tight tracking-tight">
                    {streak} day streak
                  </span>
                  <span className="text-[14px] font-medium text-[#8A837B] mt-0.5">
                    Keep it going
                  </span>
                </div>
              </div>

              {/* 7 Day Columns */}
              <div className="flex justify-between items-center w-full pt-1">
                {last7Days.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className={`text-[13px] font-bold ${item.isToday ? 'text-[#2B2622]' : 'text-[#8A837B]'}`}>
                      {item.weekdayLetter}
                    </span>
                    {item.isToday ? (
                      <div className="w-9 h-9 rounded-full bg-white border-2 border-dashed border-[#FF8A1F] flex items-center justify-center">
                        {item.goalMet && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DBE6C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    ) : item.goalMet ? (
                      <div className="w-9 h-9 rounded-full bg-[#2DBE6C] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white border-2 border-[#E8E5E0]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. NUDGE LINE */}
          <div className="flex justify-center items-center gap-1.5 mt-3 text-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC93C" stroke="#FFC93C" strokeWidth="1.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span className="text-[14px] font-bold text-[#2B2622]">
              {isEmptyState
                ? 'Log your first entry to begin'
                : `Log today to make it ${streak + 1}`}
            </span>
          </div>

          {/* 3. TOTAL SAVED ROW */}
          <div className="w-full rounded-[24px] bg-[#E6F7EE] border-2 border-[#C5EBD6] p-4 flex items-center justify-between mt-4">
            <div className="flex items-center">
              <div className="w-13 h-13 rounded-full bg-[#2DBE6C] flex items-center justify-center shrink-0">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 11V9a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2a4 4 0 0 0-2 3.5V16a2 2 0 0 0 2 2h1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h4v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h1a2 2 0 0 0 2-2v-1.5a4 4 0 0 0-2-3.5Z"></path>
                  <path d="M16 5v-1a2 2 0 0 0-2-2h-1"></path>
                  <path d="M2 12h2"></path>
                  <circle cx="8" cy="10" fill="#2B2622" r="1"></circle>
                </svg>
              </div>
              <div className="ml-3.5 flex flex-col">
                <span className="text-[13px] font-medium text-[#8A837B] leading-tight">
                  Total saved
                </span>
                <span className="text-[26px] font-extrabold text-[#2B2622] leading-tight tabular">
                  {formatUGX(totalSaved)}
                </span>
              </div>
            </div>

            {isEmptyState && (
              <div className="text-[13px] font-medium text-[#4D6B5C] text-right leading-tight max-w-[110px]">
                Your first saving starts here
              </div>
            )}
          </div>
        </div>

        {/* 4. BOTTOM ACTIONS & COUNTDOWN */}
        <footer className="flex flex-col items-center w-full mt-6">
          <button
            type="button"
            onClick={handleHopIn}
            className="w-full h-[56px] bg-[#FF8A1F] rounded-full border-b-[4px] border-[#D96F0A] flex items-center justify-center text-[18px] font-extrabold text-[#2B2622] active:translate-y-[2px] transition-transform cursor-pointer"
          >
            Hop In
          </button>

          {countdownActive && countdown > 0 && (
            <div className="w-full mt-4 flex flex-col items-center">
              <div className="w-full h-2 bg-[#EFEBE5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF8A1F] rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
              <div className="text-[13px] font-medium text-[#8A837B] text-center mt-2">
                Opening your dashboard in {countdown} seconds…
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleDontShowAgain}
            className="text-[14px] font-bold text-[#2B2622] hover:text-[#D96F0A] text-center mt-3 cursor-pointer"
          >
            Don't show this screen again
          </button>
        </footer>
      </main>
    </div>
  );
};
