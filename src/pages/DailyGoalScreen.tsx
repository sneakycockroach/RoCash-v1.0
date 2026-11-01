import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { setDailyGoal, getCurrentGoal, listGoals } from '../api/goals.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import { todayLocal, parts } from '../lib/date.ts';
import { formatCompact, formatUGX } from '../lib/money.ts';
import { Button } from '../components/Button.tsx';
import { useAppShell } from '../components/AppShell.tsx';

const QUICK_PICKS = [2000, 5000, 10000, 20000];

export const DailyGoalScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useAppShell();

  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const todayStr = todayLocal(userTimezone);

  // Calculate tomorrow's date string
  const tomorrowStr = (() => {
    const { year, month, day } = parts(todayStr);
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 1);
    const ty = d.getUTCFullYear();
    const tm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const td = String(d.getUTCDate()).padStart(2, '0');
    return `${ty}-${tm}-${td}`;
  })();

  // Current goal query
  const currentGoalQuery = useData(() => getCurrentGoal(todayStr), [todayStr]);
  const goalsHistoryQuery = useData(() => listGoals(), []);

  const [amount, setAmount] = useState<number>(5000);
  const [effectiveFrom, setEffectiveFrom] = useState<string>(todayStr);
  const [isEditingInput, setIsEditingInput] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('5000');
  const [saving, setSaving] = useState<boolean>(false);

  // Initialize amount once current goal is loaded
  useEffect(() => {
    if (currentGoalQuery.data && currentGoalQuery.data.daily_amount > 0) {
      setAmount(currentGoalQuery.data.daily_amount);
      setInputText(String(currentGoalQuery.data.daily_amount));
    }
  }, [currentGoalQuery.data]);

  const handleStepMinus = () => {
    setAmount(prev => {
      const next = Math.max(1000, prev - 1000);
      setInputText(String(next));
      return next;
    });
  };

  const handleStepPlus = () => {
    setAmount(prev => {
      const next = Math.min(500000, prev + 1000);
      setInputText(String(next));
      return next;
    });
  };

  const handleInputBlur = () => {
    setIsEditingInput(false);
    const parsed = parseInt(inputText.replace(/[^\d]/g, ''), 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(1000, Math.min(500000, parsed));
      setAmount(clamped);
      setInputText(String(clamped));
    } else {
      setInputText(String(amount));
    }
  };

  const handleQuickPick = (val: number) => {
    setAmount(val);
    setInputText(String(val));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await setDailyGoal(amount, effectiveFrom);
    setSaving(false);

    if (res.error) {
      showToast(res.error || 'Failed to save goal', 'error');
    } else {
      bumpRefresh();
      showToast('Daily savings goal updated', 'success');
      navigate('/profile');
    }
  };

  const goalsList = goalsHistoryQuery.data || [];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-12">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 flex items-center gap-3 border-b border-[#E8E5E0] bg-white sticky top-0 z-20 shadow-2xs">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Back to profile"
          className="w-9 h-9 rounded-full bg-[#F7F4EF] border border-[#E8E5E0] flex items-center justify-center text-[#2B2622] hover:bg-[#FFF1E4] transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-[24px] font-extrabold text-[#2B2622] tracking-tight leading-tight">
            Daily savings goal
          </h1>
          <p className="text-[12px] font-medium text-[#8A837B]">
            Set how much you aim to save each day
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-5 py-5 flex flex-col gap-6">
        {/* Green Hero Card */}
        <section
          aria-label="Daily goal selector"
          className="w-full rounded-[28px] bg-gradient-to-br from-[#E6F7EE] via-[#D8F3E5] to-[#C7EED8] border-2 border-[#2DBE6C]/30 p-6 flex flex-col items-center gap-5 shadow-xs"
        >
          <span className="text-[12px] font-extrabold text-[#1F9A52] uppercase tracking-wider">
            Target per day
          </span>

          {/* Stepper with tap-to-type */}
          <div className="flex items-center justify-between w-full max-w-[280px]">
            <button
              type="button"
              onClick={handleStepMinus}
              disabled={amount <= 1000}
              aria-label="Decrease 1000"
              className="w-12 h-12 rounded-2xl bg-white border-2 border-[#2DBE6C]/40 flex items-center justify-center text-[#1F9A52] text-[24px] font-black hover:bg-[#E6F7EE] disabled:opacity-30 cursor-pointer shadow-xs active:translate-y-0.5 transition-all"
            >
              -
            </button>

            <div className="flex flex-col items-center">
              {isEditingInput ? (
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleInputBlur();
                  }}
                  className="w-36 text-center text-[30px] font-black text-[#2B2622] bg-white rounded-xl border-2 border-[#2DBE6C] outline-none py-1"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingInput(true)}
                  className="cursor-pointer group flex flex-col items-center"
                >
                  <div className="flex items-baseline gap-1">
                    <span className="text-[14px] font-bold text-[#1F9A52]">UGX</span>
                    <span className="text-[34px] font-black text-[#2B2622] tabular tracking-tight">
                      {formatCompact(amount)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1F9A52] underline group-hover:text-[#187A41]">
                    Tap to type
                  </span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleStepPlus}
              disabled={amount >= 500000}
              aria-label="Increase 1000"
              className="w-12 h-12 rounded-2xl bg-white border-2 border-[#2DBE6C]/40 flex items-center justify-center text-[#1F9A52] text-[24px] font-black hover:bg-[#E6F7EE] disabled:opacity-30 cursor-pointer shadow-xs active:translate-y-0.5 transition-all"
            >
              +
            </button>
          </div>

          {/* Monthly Estimate Strip */}
          <div className="px-4 py-2 rounded-full bg-white/90 border border-[#2DBE6C]/25 text-[12px] font-extrabold text-[#1F9A52] shadow-2xs">
            About UGX {formatCompact(amount * 30)} a month
          </div>
        </section>

        {/* Quick Picks */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider px-1">
            Quick picks
          </span>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_PICKS.map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickPick(val)}
                className={`py-2.5 rounded-2xl text-[13px] font-extrabold transition-all cursor-pointer ${
                  amount === val
                    ? 'bg-[#2DBE6C] text-white shadow-xs scale-[1.02]'
                    : 'bg-[#F7F4EF] border border-[#E8E5E0] text-[#2B2622] hover:bg-white'
                }`}
              >
                {formatCompact(val)}
              </button>
            ))}
          </div>
        </div>

        {/* Applies From Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider px-1">
            Applies from
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEffectiveFrom(todayStr)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                effectiveFrom === todayStr
                  ? 'bg-[#FFF1E4] border-[#FF8A1F] text-[#2B2622]'
                  : 'bg-white border-[#E8E5E0] text-[#8A837B] hover:border-[#D9D4CC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-extrabold">From today</span>
                {effectiveFrom === todayStr && (
                  <span className="text-[#FF8A1F] font-black">✓</span>
                )}
              </div>
              <span className="text-[11px] font-medium text-[#8A837B] block mt-0.5">
                {todayStr}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEffectiveFrom(tomorrowStr)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                effectiveFrom === tomorrowStr
                  ? 'bg-[#FFF1E4] border-[#FF8A1F] text-[#2B2622]'
                  : 'bg-white border-[#E8E5E0] text-[#8A837B] hover:border-[#D9D4CC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-extrabold">From tomorrow</span>
                {effectiveFrom === tomorrowStr && (
                  <span className="text-[#FF8A1F] font-black">✓</span>
                )}
              </div>
              <span className="text-[11px] font-medium text-[#8A837B] block mt-0.5">
                {tomorrowStr}
              </span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <Button
            variant="green"
            loading={saving}
            onClick={handleSave}
          >
            Save goal
          </Button>
        </div>

        {/* Info Note */}
        <div className="p-3.5 rounded-2xl bg-[#F7F4EF] border border-[#E8E5E0] flex items-center gap-2.5 text-[#8A837B] text-[12px] font-medium">
          <span className="text-[16px]">💡</span>
          <span>Past days keep the goal you had then. New goals take effect on the chosen date.</span>
        </div>

        {/* Goal History */}
        {goalsList.length > 0 && (
          <section aria-label="Goal history" className="flex flex-col gap-2 pt-2">
            <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider px-1">
              Goal history
            </span>
            <div className="rounded-[24px] bg-white border-2 border-[#E8E5E0] divide-y divide-[#E8E5E0]/70 overflow-hidden shadow-2xs">
              {goalsList.map((g, idx) => {
                const isCurrent = g.effective_from <= todayStr && (idx === 0 || goalsList[0].effective_from > todayStr);
                const isUpcoming = g.effective_from > todayStr;
                const isPast = !isCurrent && !isUpcoming;

                return (
                  <div key={g.id} className="p-3.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-extrabold text-[#2B2622] tabular">
                        UGX {formatCompact(g.daily_amount)}
                      </span>
                      <span className="text-[11px] font-medium text-[#8A837B]">
                        Effective from {g.effective_from}
                      </span>
                    </div>

                    <div>
                      {isUpcoming ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1E4] border border-[#FF8A1F]/30 text-[#D96F0A] text-[10px] font-extrabold uppercase">
                          Upcoming
                        </span>
                      ) : isCurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E6F7EE] border border-[#2DBE6C]/30 text-[#1F9A52] text-[10px] font-extrabold uppercase">
                          Current
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F7F4EF] border border-[#E8E5E0] text-[#8A837B] text-[10px] font-extrabold uppercase">
                          Past
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
