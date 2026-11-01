import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider.tsx';
import { reward_state, sync_badges } from '../api/rpc.ts';
import { useData } from '../hooks/useData.tsx';
import { todayLocal } from '../lib/date.ts';
import { formatCompact } from '../lib/money.ts';
import { useAppShell } from '../components/AppShell.tsx';
import { BottomSheet } from '../components/BottomSheet.tsx';
import type { BadgeItemRow, RewardStateRow } from '../types.ts';

const LEVEL_NAMES: Record<number, string> = {
  1: 'Starter',
  2: 'Explorer',
  3: 'Builder',
  4: 'Saver',
  5: 'Strategist',
  6: 'Money Master',
};

// SVG Badge Icons mapping
export function renderBadgeIcon(code: string, size = 24) {
  switch (code) {
    case 'first_spark':
      // Lightning bolt
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'savings_seed':
      // Sprout
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 20h10" />
          <path d="M10 20c5.5-2.5.8-6.4 3-10" />
          <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4-.1 5.5.8Z" />
          <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.4 1.7-4.6-2.7.1-4.1.7-4.9 2Z" />
        </svg>
      );
    case 'money_minded':
      // Coins
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" />
          <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
          <path d="M7 6h2v4H7z" />
          <path d="M15 12h2v4h-2z" />
        </svg>
      );
    case 'steady_steps':
      // Footsteps
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16v-2.38C4 11.5 5.5 10 7.5 10S11 11.5 11 13.62V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <path d="M13 10V7.62C13 5.5 14.5 4 16.5 4S20 5.5 20 7.62V10a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2Z" />
        </svg>
      );
    case 'consistency_club':
      // Flame
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case 'sleuth':
      // Magnifier
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'month_in_focus':
      // Calendar
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'goal_getter':
      // Target
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'rocash_regular':
      // Medal / Trophy
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}

export const RewardsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { openQuickEntry } = useAppShell();
  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const todayStr = todayLocal(userTimezone);

  // Selected badge for details sheet
  const [selectedBadge, setSelectedBadge] = useState<BadgeItemRow | null>(null);

  // Queries
  const rewardStateQuery = useData(() => reward_state(), []);
  const badgesQuery = useData(() => sync_badges(todayStr), [todayStr]);

  const reward = rewardStateQuery.data || {
    xp: 0,
    level: 1,
    level_name: 'Starter',
    level_floor: 0,
    next_name: 'Explorer',
    next_floor: 100,
  };

  const badges = badgesQuery.data || [];
  const earnedBadges = useMemo(() => badges.filter(b => b.earned), [badges]);
  const lockedBadges = useMemo(() => badges.filter(b => !b.earned), [badges]);

  // Session-seen pop tracking
  const [newlyEarnedCode, setNewlyEarnedCode] = useState<string | null>(null);
  useEffect(() => {
    if (badges.length === 0) return;
    const seen = new Set<string>(
      JSON.parse(sessionStorage.getItem('rocash_seen_badges') || '[]')
    );

    const newlyEarned = earnedBadges.find(b => !seen.has(b.code));
    if (newlyEarned) {
      setNewlyEarnedCode(newlyEarned.code);
      seen.add(newlyEarned.code);
      sessionStorage.setItem('rocash_seen_badges', JSON.stringify(Array.from(seen)));
    }
  }, [badges, earnedBadges]);

  // Level Card calculations
  const currentLevel = Math.max(1, Math.min(6, reward.level || 1));
  const currentFloor = reward.level_floor ?? 0;
  const nextFloor = reward.next_floor ?? 0;
  const currentXp = reward.xp ?? 0;

  const xpProgressFraction = useMemo(() => {
    if (!reward.next_name || nextFloor <= currentFloor) return 1;
    return Math.min(1, Math.max(0, (currentXp - currentFloor) / (nextFloor - currentFloor)));
  }, [currentXp, currentFloor, nextFloor, reward.next_name]);

  const xpPercent = Math.round(xpProgressFraction * 100);

  // Level Path (4 nodes window clamped 1..6)
  const pathNodes = useMemo(() => {
    let start = currentLevel - 2;
    if (start < 1) start = 1;
    if (start > 3) start = 3; // Window of 4 ends at 6
    return [start, start + 1, start + 2, start + 3];
  }, [currentLevel]);

  // Almost there card: unearned badge with highest progress/target ratio
  const almostThereBadge = useMemo(() => {
    if (lockedBadges.length === 0) return null;
    const sorted = [...lockedBadges].sort((a, b) => {
      const ratioA = a.target > 0 ? a.progress / a.target : 0;
      const ratioB = b.target > 0 ? b.progress / b.target : 0;
      if (ratioB !== ratioA) {
        return ratioB - ratioA; // Descending
      }
      return a.code.localeCompare(b.code);
    });
    return sorted[0];
  }, [lockedBadges]);

  // Sort badge grid: Earned first (newest by earned_at desc), then locked by progress ratio desc
  const sortedBadges = useMemo(() => {
    const sortedEarned = [...earnedBadges].sort((a, b) => {
      return (b.earned_at || '').localeCompare(a.earned_at || '');
    });

    const sortedLocked = [...lockedBadges].sort((a, b) => {
      const ratioA = a.target > 0 ? a.progress / a.target : 0;
      const ratioB = b.target > 0 ? b.progress / b.target : 0;
      if (ratioB !== ratioA) return ratioB - ratioA;
      return a.code.localeCompare(b.code);
    });

    return [...sortedEarned, ...sortedLocked];
  }, [earnedBadges, lockedBadges]);

  // Helpers for units on badge progress
  const formatBadgeProgress = (b: BadgeItemRow) => {
    const isDayUnit = [
      'consistency_club',
      'steady_steps',
      'money_minded',
      'month_in_focus',
      'rocash_regular',
    ].includes(b.code);

    if (b.code === 'goal_getter') {
      return {
        progressText: `UGX ${formatCompact(b.progress)}`,
        targetText: `UGX ${formatCompact(b.target)}`,
        remainingText: `UGX ${formatCompact(Math.max(0, b.target - b.progress))} to go`,
        unit: 'UGX',
      };
    }

    if (isDayUnit) {
      return {
        progressText: `${b.progress} days`,
        targetText: `${b.target} days`,
        remainingText: `${Math.max(0, b.target - b.progress)} days to go`,
        unit: 'days',
      };
    }

    return {
      progressText: `${b.progress}`,
      targetText: `${b.target}`,
      remainingText: `${Math.max(0, b.target - b.progress)} to go`,
      unit: '',
    };
  };

  const isEmptyState = currentXp === 0 && earnedBadges.length === 0;

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-8">
      {/* 1. Header with Title & XP Pill */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-[#E8E5E0] bg-white sticky top-0 z-20 shadow-2xs">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#2B2622] tracking-tight leading-none">
            Rewards
          </h1>
          <p className="text-[13px] font-medium text-[#8A837B] mt-1">
            Levels, milestones & badges
          </p>
        </div>

        {/* Real XP Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF1E4] border border-[#FF8A1F]/30 text-[#D96F0A] shadow-xs">
          <span className="text-[14px]">⚡</span>
          <span className="text-[13px] font-extrabold tabular">{currentXp} XP</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-5 py-5 flex flex-col gap-6">
        {/* 2. LEVEL CARD */}
        <section
          aria-label="Level card"
          className="w-full rounded-[28px] bg-gradient-to-br from-[#FFF8F2] via-[#FFF1E4] to-[#FFE7D1] border-2 border-[#FF8A1F]/35 p-5 flex flex-col gap-4 shadow-xs"
        >
          <div className="flex items-center gap-4">
            {/* Medal Icon with Level Number */}
            <div className="relative w-14 h-14 rounded-2xl bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] flex items-center justify-center text-[#2B2622] shadow-sm shrink-0">
              <span className="text-[24px] font-black">{currentLevel}</span>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#FF8A1F] flex items-center justify-center text-[10px]">
                ⭐
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold text-[#D96F0A] uppercase tracking-wider">
                Current Level
              </span>
              <h2 className="text-[22px] font-black text-[#2B2622] tracking-tight leading-tight">
                Level {currentLevel} {LEVEL_NAMES[currentLevel] || reward.level_name}
              </h2>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="w-full h-3 rounded-full bg-white/80 border border-[#FF8A1F]/20 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#FF8A1F] to-[#2DBE6C] rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] font-bold">
              <span className="text-[#8A837B]">
                {reward.next_name
                  ? `${Math.max(0, nextFloor - currentXp)} XP to ${reward.next_name}`
                  : 'Max level reached'}
              </span>
              <span className="text-[#2B2622] tabular font-extrabold">
                {currentXp} / {nextFloor > 0 ? nextFloor : currentXp} XP
              </span>
            </div>
          </div>
        </section>

        {/* 3. LEVEL PATH (4 nodes window) */}
        <section aria-label="Level roadmap" className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider">
              Journey Roadmap
            </span>
            <span className="text-[12px] font-bold text-[#8A837B]">
              Stage {currentLevel} of 6
            </span>
          </div>

          <div className="w-full rounded-[24px] bg-[#F7F4EF] border-2 border-[#E8E5E0] p-4 flex flex-col justify-center shadow-xs">
            {/* Connecting Track & Nodes */}
            <div className="relative flex items-center justify-between px-3">
              {/* Background Connecting Line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#E8E5E0] z-0" />

              {pathNodes.map(nodeLvl => {
                const isDone = nodeLvl < currentLevel;
                const isCurrent = nodeLvl === currentLevel;
                const isLater = nodeLvl > currentLevel;

                return (
                  <div key={nodeLvl} className="relative z-10 flex flex-col items-center">
                    {/* Circle Node */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[13px] transition-all shadow-xs ${
                        isDone
                          ? 'bg-[#2DBE6C] text-white border-2 border-[#1F9A52]'
                          : isCurrent
                          ? 'bg-[#FF8A1F] text-[#2B2622] ring-4 ring-[#FF8A1F]/30 border-2 border-[#D96F0A] scale-110'
                          : 'bg-white text-[#8A837B] border-2 border-[#E8E5E0]'
                      }`}
                    >
                      {isDone ? (
                        <span className="text-[14px]">✓</span>
                      ) : isCurrent ? (
                        <span>{nodeLvl}</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                    </div>

                    {/* Node Label Below */}
                    <span
                      className={`text-[11px] mt-2 font-extrabold text-center truncate max-w-[70px] ${
                        isCurrent
                          ? 'text-[#2B2622]'
                          : isDone
                          ? 'text-[#2DBE6C]'
                          : 'text-[#8A837B]'
                      }`}
                    >
                      {LEVEL_NAMES[nodeLvl]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. EMPTY STATE / MISSION CARD (if no transactions or 0 XP) */}
        {isEmptyState && (
          <section
            aria-label="First mission"
            className="w-full rounded-[26px] bg-[#FFF8F2] border-2 border-[#FF8A1F]/40 p-5 flex flex-col gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FF8A1F] border-b-[3px] border-[#D96F0A] flex items-center justify-center text-[#2B2622]">
                {renderBadgeIcon('first_spark', 22)}
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-[#D96F0A] uppercase tracking-wider">
                  First Mission
                </span>
                <h3 className="text-[17px] font-extrabold text-[#2B2622]">
                  First Spark: Log your first entry
                </h3>
              </div>
            </div>
            <p className="text-[13px] font-medium text-[#8A837B]">
              Log your first expense or savings to earn 10 XP and unlock your first badge!
            </p>
            <button
              type="button"
              onClick={() => openQuickEntry({ mode: 'expense' })}
              className="mt-1 w-full h-[46px] rounded-full bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] font-extrabold text-[14px] text-[#2B2622] cursor-pointer shadow-xs active:translate-y-0.5"
            >
              Add an entry
            </button>
          </section>
        )}

        {/* 5. "ALMOST THERE" CARD (Unearned badge closest to target) */}
        {!isEmptyState && almostThereBadge && (
          <section
            aria-label="Almost there card"
            className="w-full rounded-[26px] bg-[#FFF8F2] border-2 border-[#FF8A1F]/30 p-5 flex flex-col gap-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#D96F0A] uppercase tracking-wider">
                Almost There
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#FF8A1F]/40 text-[#D96F0A] text-[11px] font-extrabold tabular shadow-2xs">
                {formatBadgeProgress(almostThereBadge).remainingText}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#FF8A1F]/30 flex items-center justify-center text-[#FF8A1F] shrink-0 shadow-2xs">
                {renderBadgeIcon(almostThereBadge.code, 24)}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-[16px] font-extrabold text-[#2B2622] truncate">
                  {almostThereBadge.name}
                </h3>
                <p className="text-[12px] font-medium text-[#8A837B] line-clamp-1">
                  {almostThereBadge.description}
                </p>
              </div>
            </div>

            {/* Segment Row if target <= 10, else Standard Progress Bar */}
            {almostThereBadge.target <= 10 && almostThereBadge.target > 1 ? (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 w-full">
                  {Array.from({ length: almostThereBadge.target }, (_, i) => {
                    const isFilled = i < almostThereBadge.progress;
                    return (
                      <div
                        key={i}
                        className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                          isFilled ? 'bg-[#2DBE6C]' : 'bg-[#E8E5E0]'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#8A837B]">
                  <span>{formatBadgeProgress(almostThereBadge).progressText}</span>
                  <span>{formatBadgeProgress(almostThereBadge).targetText}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="w-full h-2.5 rounded-full bg-[#E8E5E0] overflow-hidden">
                  <div
                    className="h-full bg-[#2DBE6C] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((almostThereBadge.progress / Math.max(1, almostThereBadge.target)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#8A837B]">
                  <span>{formatBadgeProgress(almostThereBadge).progressText}</span>
                  <span>{formatBadgeProgress(almostThereBadge).targetText}</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 6. BADGE GRID (3 columns) */}
        <section aria-label="Badges" className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[17px] font-extrabold text-[#2B2622]">
              Badges
            </h2>
            <span className="text-[12px] font-extrabold text-[#8A837B] tabular">
              {earnedBadges.length} of {badges.length || 9}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {sortedBadges.map(badge => {
              const isEarned = badge.earned;
              const isNewPop = badge.code === newlyEarnedCode;

              return (
                <button
                  key={badge.code}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  className={`aspect-square rounded-[22px] p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer relative shadow-xs ${
                    isEarned
                      ? 'bg-white border-2 border-[#FF8A1F] border-b-[4px] border-b-[#D96F0A] hover:brightness-105 active:translate-y-0.5'
                      : 'bg-[#F7F4EF] border-2 border-[#E8E5E0] opacity-85 hover:border-[#D9D4CC]'
                  } ${isNewPop ? 'animate-bounce' : ''}`}
                >
                  {/* Badge Medal / Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform ${
                      isEarned
                        ? 'bg-[#FFF1E4] text-[#D96F0A] border border-[#FF8A1F]/30'
                        : 'bg-[#E8E5E0]/60 text-[#8A837B]'
                    }`}
                  >
                    {isEarned ? (
                      renderBadgeIcon(badge.code, 22)
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <div className="opacity-40">{renderBadgeIcon(badge.code, 20)}</div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badge Name */}
                  <span
                    className={`text-[12px] font-extrabold line-clamp-1 leading-tight ${
                      isEarned ? 'text-[#2B2622]' : 'text-[#8A837B]'
                    }`}
                  >
                    {badge.name}
                  </span>

                  {/* Status Indicator */}
                  {isEarned ? (
                    <span className="text-[10px] font-extrabold text-[#2DBE6C] flex items-center gap-0.5">
                      ✓ Earned
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#8A837B] tabular">
                      {badge.progress}/{badge.target}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Badge Detail Bottom Sheet */}
      <BottomSheet
        isOpen={selectedBadge !== null}
        onClose={() => setSelectedBadge(null)}
        title={selectedBadge?.name || 'Badge'}
      >
        {selectedBadge && (
          <div className="flex flex-col items-center text-center gap-4 pt-2 pb-4">
            {/* Big Badge Icon */}
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center border-b-[5px] shadow-sm ${
                selectedBadge.earned
                  ? 'bg-[#FF8A1F] border-[#D96F0A] text-[#2B2622]'
                  : 'bg-[#E8E5E0] border-[#C5BFB8] text-[#8A837B]'
              }`}
            >
              {renderBadgeIcon(selectedBadge.code, 40)}
            </div>

            <div className="flex flex-col gap-1 max-w-[280px]">
              <h3 className="text-[20px] font-black text-[#2B2622]">
                {selectedBadge.name}
              </h3>
              <p className="text-[14px] font-medium text-[#8A837B]">
                {selectedBadge.description}
              </p>
            </div>

            {/* Progress Bar & Status */}
            <div className="w-full bg-[#F7F4EF] rounded-[20px] border border-[#E8E5E0] p-4 flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span className="text-[#8A837B]">Progress</span>
                <span className="text-[#2B2622] tabular font-extrabold">
                  {formatBadgeProgress(selectedBadge).progressText} / {formatBadgeProgress(selectedBadge).targetText}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-[#E8E5E0] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedBadge.earned ? 'bg-[#2DBE6C]' : 'bg-[#FF8A1F]'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((selectedBadge.progress / Math.max(1, selectedBadge.target)) * 100)
                    )}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[12px] pt-1">
                {selectedBadge.earned ? (
                  <span className="text-[#2DBE6C] font-extrabold flex items-center gap-1">
                    <span>✓</span> Unlocked
                    {selectedBadge.earned_at && (
                      <span className="font-normal text-[#8A837B] ml-1">
                        on {selectedBadge.earned_at.split('T')[0]}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[#D96F0A] font-bold">
                    {formatBadgeProgress(selectedBadge).remainingText}
                  </span>
                )}
                <span className="text-[11px] font-extrabold text-[#8A837B] tabular">
                  {Math.min(
                    100,
                    Math.round((selectedBadge.progress / Math.max(1, selectedBadge.target)) * 100)
                  )}
                  %
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="mt-2 w-full h-[46px] rounded-full bg-[#F7F4EF] border border-[#E8E5E0] text-[14px] font-extrabold text-[#2B2622] hover:bg-[#E8E5E0] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
