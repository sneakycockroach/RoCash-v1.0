import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUGX } from '../lib/money.ts';
import { getCategoryIcon } from './NewCategorySheet.tsx';
import { FlameIcon } from './Icons.tsx';
import type { Transaction, Category } from '../types.ts';

export interface SuccessSheetProps {
  isOpen: boolean;
  onDone: () => void;
  onAddAnother: () => void;
  transaction: Transaction | null;
  category: Category | null;
  xpGained: number;
  isGoalReached?: boolean;
  dayTotalSpentOrSaved: number;
  goalAmount?: number | null;
  streakCount?: number;
  isToday?: boolean;
}

export const SuccessSheet: React.FC<SuccessSheetProps> = ({
  isOpen,
  onDone,
  onAddAnother,
  transaction,
  category,
  xpGained,
  isGoalReached = false,
  dayTotalSpentOrSaved,
  goalAmount,
  streakCount = 0,
  isToday = true,
}) => {
  if (!isOpen || !transaction) return null;

  const isExpense = transaction.type === 'expense';
  const amount = transaction.amount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        {/* Dimmed backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
          className="fixed inset-0 bg-[#2B2622]/55"
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] px-6 pt-3 pb-8 z-50 flex flex-col items-center"
        >
          {/* Drag handle */}
          <div className="w-[40px] h-[5px] rounded-full bg-[#E8E5E0] mx-auto mb-4" />

          {/* If Daily Goal reached */}
          {isGoalReached ? (
            <div className="w-full flex flex-col items-center">
              {/* Flame Pop Badge */}
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 300 }}
                className="w-20 h-20 rounded-full bg-[#FFE9E3] border-4 border-[#FF8A1F] flex items-center justify-center mb-3 shadow-md"
              >
                <FlameIcon size={40} color="#F2542D" />
              </motion.div>

              <h2 className="text-[28px] font-extrabold text-[#2B2622] leading-tight text-center tracking-tight mb-1">
                Daily goal reached!
              </h2>
              <p className="text-[15px] font-medium text-[#8A837B] text-center mb-5">
                {formatUGX(amount)} added to your savings.
              </p>

              {/* Goal Card */}
              <div className="w-full h-[88px] bg-[#E6F7EE] rounded-[24px] p-4 flex flex-col justify-between border-2 border-[#C5EBD6] mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] font-bold text-[#2B2622]">Today's goal</span>
                  <span className="text-[13px] font-bold tabular text-[#4D6B5C]">
                    {formatUGX(goalAmount || 5000)} of {formatUGX(goalAmount || 5000)}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#CDEBDA] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-[#2DBE6C] rounded-full"
                  />
                </div>
              </div>

              {/* Reward Pills Row */}
              <div className="flex justify-center items-center gap-2.5 mb-6">
                {xpGained > 0 && (
                  <div className="h-[44px] px-4 rounded-full bg-[#FFF4D1] inline-flex items-center gap-2 text-[15px] font-bold text-[#2B2622]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC93C" stroke="#FFC93C">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>+{xpGained} XP</span>
                  </div>
                )}
                <div className="h-[44px] px-4 rounded-full bg-[#FFE9E3] inline-flex items-center gap-2 text-[15px] font-bold text-[#2B2622]">
                  <FlameIcon size={18} color="#F2542D" />
                  <span>{streakCount} day streak</span>
                </div>
              </div>
            </div>
          ) : (
            /* Quiet Success Sheet */
            <div className="w-full flex flex-col items-center">
              {/* Green checkmark badge */}
              <div className="w-16 h-16 rounded-full bg-[#E6F7EE] flex items-center justify-center text-[#2DBE6C] mb-3 border-2 border-[#2DBE6C]/30">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <h2 className="text-[26px] font-extrabold text-[#2B2622] leading-tight text-center tracking-tight mb-1">
                {isExpense ? 'Expense saved' : 'Saving added'}
              </h2>

              <p className="text-[14px] font-medium text-[#8A837B] text-center mb-4">
                {isExpense
                  ? `${isToday ? 'Spent today' : 'Spent that day'}: ${formatUGX(dayTotalSpentOrSaved)}`
                  : `${isToday ? 'Saved today' : 'Saved that day'}: ${formatUGX(dayTotalSpentOrSaved)}`}
              </p>

              {/* Entry Preview Card */}
              <div className="w-full h-[72px] rounded-[20px] bg-[#F7F4EF] px-4 py-3 flex items-center justify-between mb-4 border border-[#E8E5E0]">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[#2B2622] shrink-0"
                    style={{ backgroundColor: category?.color || (isExpense ? '#FF8A1F' : '#2DBE6C') }}
                  >
                    {getCategoryIcon(category?.icon || (isExpense ? 'grid' : 'gift'))}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[16px] font-extrabold text-[#2B2622] leading-tight truncate">
                      {transaction.note || category?.name || (isExpense ? 'Expense' : 'Saving')}
                    </span>
                    <span className="text-[13px] font-semibold text-[#8A837B] truncate">
                      {category?.name || (isExpense ? 'Expense' : 'Saving')}
                    </span>
                  </div>
                </div>

                <div className={`text-[16px] font-extrabold tabular shrink-0 ${isExpense ? 'text-[#2B2622]' : 'text-[#2DBE6C]'}`}>
                  {isExpense ? `-${formatUGX(amount)}` : `+${formatUGX(amount)}`}
                </div>
              </div>

              {/* XP pill if earned */}
              {xpGained > 0 && (
                <div className="mb-6 h-[38px] px-4 rounded-full bg-[#FFF4D1] inline-flex items-center gap-2 text-[14px] font-bold text-[#2B2622]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFC93C" stroke="#FFC93C">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <span>+{xpGained} XP</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={onDone}
              className="w-full h-[56px] rounded-full bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] text-[#2B2622] font-extrabold text-[17px] flex items-center justify-center active:translate-y-[2px] transition-transform cursor-pointer"
            >
              Done
            </button>

            <button
              type="button"
              onClick={onAddAnother}
              className="w-full h-[56px] rounded-full bg-white border-2 border-[#E8E5E0] text-[#2B2622] font-extrabold text-[17px] flex items-center justify-center active:bg-stone-50 transition-colors cursor-pointer"
            >
              Add another
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
