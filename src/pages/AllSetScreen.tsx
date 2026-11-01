import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthProvider.tsx';
import { updateProfile } from '../api/profile.ts';
import { getCurrentGoal } from '../api/goals.ts';
import { listCategories } from '../api/categories.ts';
import { todayLocal } from '../lib/date.ts';
import { formatUGX } from '../lib/money.ts';
import { useData } from '../hooks/useData.tsx';
import { Button } from '../components/Button.tsx';
import { Toast } from '../components/Toast.tsx';

export const AllSetScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  const localToday = todayLocal(profile?.timezone || 'Africa/Kampala');
  const goalQuery = useData(() => getCurrentGoal(localToday), [localToday]);
  const categoriesQuery = useData(() => listCategories({ includeArchived: false }), []);

  const activeCategories = categoriesQuery.data || [];
  const currentGoal = goalQuery.data;

  const handleEnterRoCash = async () => {
    setLoading(true);
    setToastError(null);

    const now = new Date().toISOString();
    const res = await updateProfile({ onboarded_at: now });

    if (res.error) {
      setLoading(false);
      setToastError(`Failed to save setup: ${res.error}`);
      return;
    }

    await refreshProfile();
    setLoading(false);
    navigate('/', { replace: true });
  };

  const displayName = profile?.display_name || 'Friend';

  return (
    <div className="min-h-screen max-w-[430px] mx-auto bg-[#FF8A1F] flex flex-col justify-between relative overflow-hidden select-none">
      <Toast message={toastError} type="error" onClose={() => setToastError(null)} />

      {/* Top Orange Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 pt-14 pb-8 flex flex-col"
      >
        {/* +20 XP Pill */}
        <div className="inline-flex items-center gap-1.5 h-[36px] px-4 bg-white rounded-full self-start mb-5 shadow-xs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC93C" stroke="#FFC93C" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span className="text-[15px] font-extrabold text-[#2B2622]">+20 XP</span>
        </div>

        {/* Title */}
        <h1 className="text-[40px] font-extrabold leading-[1.08] text-[#2B2622] tracking-tight">
          You're all set,<br />{displayName}!
        </h1>

        <p className="mt-2.5 text-[16px] font-medium text-[#2B2622]/80 leading-snug">
          Here's what you set up. Time to log your first entry.
        </p>
      </motion.div>

      {/* Bottom White Sheet */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="bg-white rounded-t-[32px] px-6 pt-7 pb-8 flex-1 flex flex-col justify-between"
      >
        <div>
          <div className="text-[14px] font-bold text-[#8A837B] mb-3">
            Your setup
          </div>

          {/* Setup Card */}
          <div className="w-full bg-[#F7F4EF] rounded-[24px] border-2 border-[#E8E5E0] p-4 flex flex-col divide-y divide-[#E8E5E0]">
            {/* Row 1: Name */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8E5E0] flex items-center justify-center text-[#FF8A1F]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#8A837B]">Name</span>
                  <span className="text-[16px] font-extrabold text-[#2B2622]">{displayName}</span>
                </div>
              </div>
            </div>

            {/* Row 2: Daily goal */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8E5E0] flex items-center justify-center text-[#2DBE6C]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#8A837B]">Daily goal</span>
                  <span className="text-[16px] font-extrabold text-[#2B2622] tabular">
                    {currentGoal?.daily_amount
                      ? `${formatUGX(currentGoal.daily_amount)} a day`
                      : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Categories */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8E5E0] flex items-center justify-center text-[#3AA0FF]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#8A837B]">Categories</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[16px] font-extrabold text-[#2B2622]">
                      {activeCategories.length} categories
                    </span>
                    {/* Up to 4 colored dots */}
                    <div className="flex items-center gap-1">
                      {activeCategories.slice(0, 4).map((c, i) => (
                        <span
                          key={c.id || i}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.color || '#FF8A1F' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enter RoCash Button */}
        <div className="mt-8">
          <Button
            variant="primary"
            onClick={handleEnterRoCash}
            loading={loading}
          >
            Enter RoCash
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
