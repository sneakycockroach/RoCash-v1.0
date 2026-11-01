import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { getAvatarSvg } from '../lib/avatar.ts';
import { formatUGX } from '../lib/money.ts';
import { todayLocal } from '../lib/date.ts';
import { getCurrentGoal } from '../api/goals.ts';
import { useData } from '../hooks/useData.tsx';

interface PlaceholderProps {
  title: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isProfile = location.pathname === '/profile';

  if (isProfile) {
    const avatarSvg = getAvatarSvg(profile?.avatar_seed || 'sunrise');
    const today = todayLocal(profile?.timezone);
    const goalQuery = useData(() => getCurrentGoal(today), [today]);
    const dailyGoalAmount = goalQuery.data?.daily_amount ?? 5000;

    return (
      <div className="flex flex-col px-5 pt-4 pb-8 max-w-[430px] mx-auto w-full">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-[#F7F4EF] border border-[#E8E5E0] flex items-center justify-center text-[#2B2622] hover:bg-[#EFEBE5] cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[20px] font-extrabold text-[#2B2622]">Profile</h1>
          <div className="w-10" />
        </div>

        {/* Profile Card */}
        <div className="w-full rounded-[28px] bg-[#F7F4EF] p-6 border-2 border-[#E8E5E0] flex flex-col items-center text-center mb-6">
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm mb-4 bg-[#FFF1E4]"
            dangerouslySetInnerHTML={{ __html: avatarSvg }}
          />

          <h2 className="text-[24px] font-extrabold text-[#2B2622] mb-1">
            {profile?.display_name || 'User'}
          </h2>
          <span className="text-[13px] font-medium text-[#8A837B] mb-4">
            {user?.email}
          </span>

          <div className="w-full bg-white rounded-2xl p-4 border border-[#E8E5E0] flex items-center justify-between">
            <span className="text-[14px] font-bold text-[#8A837B]">Daily Goal</span>
            <span className="text-[15px] font-extrabold tabular text-[#2DBE6C]">
              {formatUGX(dailyGoalAmount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/debug')}
            className="w-full h-[52px] rounded-full bg-white border-2 border-[#E8E5E0] text-[#2B2622] font-extrabold text-[15px] flex items-center justify-center hover:bg-[#F7F4EF] transition-colors cursor-pointer"
          >
            Debug & Self-Checks
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full h-[52px] rounded-full bg-red-50 border-2 border-red-200 text-[#FF4B4B] font-extrabold text-[15px] flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center max-w-[430px] mx-auto w-full">
      <div className="w-16 h-16 rounded-[22px] bg-[#FFF1E4] border-2 border-[#FF8A1F] flex items-center justify-center mb-4">
        <span className="text-2xl font-extrabold text-[#FF8A1F]">{title.charAt(0)}</span>
      </div>

      <h1 className="text-[24px] font-extrabold text-[#2B2622] mb-2">{title}</h1>
      <p className="text-[14px] font-medium text-[#8A837B] max-w-[280px] mb-6">
        {title} screen is coming in Block {title === 'History' ? '4' : '5'}.
      </p>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-6 h-[46px] rounded-full bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] text-[#2B2622] font-extrabold text-[14px] cursor-pointer"
      >
        Back to Home
      </button>
    </div>
  );
};
