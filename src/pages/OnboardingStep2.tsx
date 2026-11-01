import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { setDailyGoal } from '../api/goals.ts';
import { todayLocal } from '../lib/date.ts';
import { formatUGX, parseAmount } from '../lib/money.ts';
import { OrangeSheetLayout } from '../components/OrangeSheetLayout.tsx';
import { StepProgress } from '../components/StepProgress.tsx';
import { Button } from '../components/Button.tsx';

const QUICK_PICKS = [2000, 5000, 10000, 20000];

export const OnboardingStep2: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [goalAmount, setGoalAmount] = useState<number>(5000);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('5000');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clampGoal = (val: number) => Math.max(1000, Math.min(500000, Math.round(val)));

  const handleMinus = () => {
    const next = clampGoal(goalAmount - 1000);
    setGoalAmount(next);
    setInputText(String(next));
  };

  const handlePlus = () => {
    const next = clampGoal(goalAmount + 1000);
    setGoalAmount(next);
    setInputText(String(next));
  };

  const handleQuickPick = (val: number) => {
    setGoalAmount(val);
    setInputText(String(val));
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    const parsed = parseAmount(raw);
    if (parsed > 0) {
      setGoalAmount(clampGoal(parsed));
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseAmount(inputText);
    const finalVal = clampGoal(parsed || 5000);
    setGoalAmount(finalVal);
    setInputText(String(finalVal));
  };

  const handleContinue = async () => {
    setLoading(true);
    setErrorMsg(null);
    const effectiveToday = todayLocal(profile?.timezone || 'Africa/Kampala');
    const res = await setDailyGoal(goalAmount, effectiveToday);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    navigate('/onboarding/step-3');
  };

  const handleSkip = () => {
    // Skips without writing a goal
    navigate('/onboarding/step-3');
  };

  const monthlyEstimate = formatUGX(goalAmount * 30);

  return (
    <OrangeSheetLayout
      onBack={() => navigate('/onboarding/step-1')}
      topSlot={<StepProgress currentStep={2} />}
      title="Set your daily goal"
      footer={
        <div className="flex flex-col items-center">
          <Button
            variant="primary"
            onClick={handleContinue}
            loading={loading}
          >
            Continue
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 text-center text-[15px] font-bold text-[#2B2622] hover:text-[#D96F0A] transition-colors cursor-pointer"
          >
            I'll set this later
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6">
        {errorMsg && (
          <div className="w-full p-3 bg-red-50 border border-[#FF4B4B]/30 rounded-xl text-[#FF4B4B] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Counter Card */}
        <div className="w-full bg-[#F7F4EF] rounded-[24px] p-6 border-2 border-[#E8E5E0] flex flex-col items-center">
          <span className="text-[14px] font-medium text-[#8A837B] mb-2">per day</span>

          <div className="w-full flex items-center justify-between gap-3">
            {/* Minus Button */}
            <button
              type="button"
              onClick={handleMinus}
              disabled={goalAmount <= 1000}
              aria-label="Decrease by 1,000"
              className="w-[48px] h-[48px] rounded-full bg-white border-2 border-[#E8E5E0] flex items-center justify-center text-[22px] font-black text-[#2B2622] active:bg-stone-100 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              -
            </button>

            {/* Editable Amount */}
            <div
              onClick={() => setIsEditing(true)}
              className="flex-1 flex flex-col items-center justify-center cursor-pointer py-1"
            >
              {isEditing ? (
                <div className="flex items-center">
                  <span className="text-[20px] font-bold text-[#8A837B] mr-1">UGX</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputText}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={e => e.key === 'Enter' && handleInputBlur()}
                    autoFocus
                    className="w-36 text-center text-[34px] font-extrabold text-[#2B2622] tabular bg-white border border-[#FF8A1F] rounded-xl px-2 py-0.5 outline-none"
                  />
                </div>
              ) : (
                <div className="text-[36px] font-extrabold text-[#2B2622] leading-none tracking-tight tabular">
                  {formatUGX(goalAmount)}
                </div>
              )}
            </div>

            {/* Plus Button */}
            <button
              type="button"
              onClick={handlePlus}
              disabled={goalAmount >= 500000}
              aria-label="Increase by 1,000"
              className="w-[48px] h-[48px] rounded-full bg-white border-2 border-[#E8E5E0] flex items-center justify-center text-[22px] font-black text-[#2B2622] active:bg-stone-100 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              +
            </button>
          </div>

          {/* Monthly Strip */}
          <div className="mt-5 w-full py-2 px-4 rounded-full bg-[#FFF1E4] border border-[#FF8A1F]/20 text-center">
            <span className="text-[14px] font-bold text-[#D96F0A]">
              About {monthlyEstimate} a month
            </span>
          </div>
        </div>

        {/* Quick Picks */}
        <div className="w-full">
          <div className="text-[14px] font-bold text-[#2B2622] mb-2.5">
            Quick picks
          </div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_PICKS.map(amt => {
              const isSelected = goalAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickPick(amt)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition-all border tabular ${
                    isSelected
                      ? 'bg-[#FF8A1F] border-[#D96F0A] text-[#2B2622] shadow-xs'
                      : 'bg-[#F7F4EF] border-[#E8E5E0] text-[#8A837B] hover:text-[#2B2622]'
                  }`}
                >
                  {amt.toLocaleString('en-US')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanatory note */}
        <div className="w-full p-4 rounded-2xl bg-[#F7F4EF] border border-[#E8E5E0] text-[13px] text-[#8A837B] flex items-start gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span className="leading-snug">
            You can change your goal any time. Past days keep the goal you had then.
          </span>
        </div>
      </div>
    </OrangeSheetLayout>
  );
};
