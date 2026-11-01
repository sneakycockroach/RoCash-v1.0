import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { softDeleteTransaction } from '../api/transactions.ts';
import { formatUGX } from '../lib/money.ts';
import { bumpRefresh } from '../hooks/useData.tsx';
import { getCategoryIcon } from './NewCategorySheet.tsx';
import type { Transaction, Category } from '../types.ts';

export interface DeleteEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  category: Category | null;
  dayTotalSpentOrSaved: number;
  isToday: boolean;
  onDeleted: (deletedTx: Transaction) => void;
}

export const DeleteEntrySheet: React.FC<DeleteEntrySheetProps> = ({
  isOpen,
  onClose,
  transaction,
  category,
  dayTotalSpentOrSaved,
  isToday,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !transaction) return null;

  const isExpense = transaction.type === 'expense';
  const amount = transaction.amount;
  const currentTotal = dayTotalSpentOrSaved;
  const newTotal = Math.max(0, currentTotal - amount);

  const dayLabel = isToday
    ? isExpense ? 'Spent today' : 'Saved today'
    : isExpense ? 'Spent that day' : 'Saved that day';

  const handleDelete = async () => {
    setLoading(true);
    const res = await softDeleteTransaction(transaction.id);
    setLoading(false);
    if (!res.error) {
      bumpRefresh();
      onDeleted(transaction);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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

          {/* Red Trash Icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-[#FF4B4B] mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>

          <h2 className="text-[24px] font-extrabold text-[#2B2622] mb-1">
            Delete this entry?
          </h2>
          <p className="text-[14px] font-medium text-[#8A837B] text-center mb-5">
            This will update your daily totals and streaks.
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
                  {category?.name || (isExpense ? 'Expense' : 'Saving')} · {transaction.occurred_on}
                </span>
              </div>
            </div>

            <div className={`text-[16px] font-extrabold tabular shrink-0 ${isExpense ? 'text-[#2B2622]' : 'text-[#2DBE6C]'}`}>
              {isExpense ? `-${formatUGX(amount)}` : `+${formatUGX(amount)}`}
            </div>
          </div>

          {/* Real Impact Line */}
          <div className="w-full py-2.5 px-4 rounded-xl bg-[#FFF1E4] border border-[#FF8A1F]/30 text-center mb-6">
            <span className="text-[13px] font-bold text-[#D96F0A]">
              {dayLabel}: {formatUGX(currentTotal)} → {formatUGX(newTotal)}
            </span>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full h-[56px] rounded-full bg-[#FF4B4B] border-b-[4px] border-[#D62828] text-white font-extrabold text-[17px] flex items-center justify-center active:translate-y-[2px] transition-transform cursor-pointer"
            >
              {loading ? 'Deleting…' : 'Delete entry'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full h-[56px] rounded-full bg-white border-2 border-[#E8E5E0] text-[#2B2622] font-extrabold text-[17px] flex items-center justify-center active:bg-stone-50 transition-colors cursor-pointer"
            >
              Keep entry
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
