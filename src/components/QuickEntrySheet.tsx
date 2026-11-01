import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthProvider.tsx';
import { listCategories } from '../api/categories.ts';
import { createTransaction, updateTransaction } from '../api/transactions.ts';
import { daily_summary, reward_state, sync_badges, current_streak } from '../api/rpc.ts';
import { todayLocal } from '../lib/date.ts';
import { formatUGX, parseAmount } from '../lib/money.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import { NewCategorySheet, getCategoryIcon } from './NewCategorySheet.tsx';
import { DeleteEntrySheet } from './DeleteEntrySheet.tsx';
import { SuccessSheet } from './SuccessSheets.tsx';
import type { Transaction, Category, TransactionType } from '../types.ts';

export interface QuickEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: TransactionType;
  editingTransaction?: Transaction | null;
  onBadgeEarned?: (badgeName: string) => void;
  onDeleted?: (tx: Transaction) => void;
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export const QuickEntrySheet: React.FC<QuickEntrySheetProps> = ({
  isOpen,
  onClose,
  initialMode = 'expense',
  editingTransaction = null,
  onBadgeEarned,
  onDeleted,
}) => {
  const { profile, isOnline } = useAuth();
  const localToday = todayLocal(profile?.timezone || 'Africa/Kampala');

  const [mode, setMode] = useState<TransactionType>(
    editingTransaction ? editingTransaction.type : initialMode
  );
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [occurredOn, setOccurredOn] = useState<string>(localToday);

  // Validation errors
  const [amountError, setAmountError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [isNewCatOpen, setIsNewCatOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Success sheet state
  const [successData, setSuccessData] = useState<{
    tx: Transaction;
    cat: Category | null;
    xpGained: number;
    isGoalReached: boolean;
    dayTotal: number;
    goalAmount: number | null;
    streakCount: number;
    isToday: boolean;
  } | null>(null);

  const categoriesQuery = useData(() => listCategories({ includeArchived: false }), []);
  const allCategories = categoriesQuery.data || [];

  // Goal & saved total for the chosen date
  const daySummaryQuery = useData(
    () => daily_summary(occurredOn, occurredOn),
    [occurredOn]
  );
  const dayRow = daySummaryQuery.data && daySummaryQuery.data.length > 0
    ? daySummaryQuery.data[0]
    : null;

  // Initialize or reset when sheet opens or editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      setMode(editingTransaction.type);
      setAmountStr(editingTransaction.amount ? editingTransaction.amount.toLocaleString('en-US') : '');
      setSelectedCategoryId(editingTransaction.category_id || '');
      setNote(editingTransaction.note || '');
      setOccurredOn(editingTransaction.occurred_on || localToday);
    } else {
      setMode(initialMode);
      setAmountStr('');
      setSelectedCategoryId('');
      setNote('');
      setOccurredOn(localToday);
    }
    setAmountError(null);
    setCategoryError(false);
    setGeneralError(null);
    setSuccessData(null);
  }, [editingTransaction, initialMode, localToday, isOpen]);

  // Format amount input as user types
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setAmountStr('');
      setAmountError(null);
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    if (parsed > 99999999) {
      return;
    }
    setAmountStr(parsed.toLocaleString('en-US'));
    if (amountError) setAmountError(null);
  };

  const handleQuickAmount = (amt: number) => {
    setAmountStr(amt.toLocaleString('en-US'));
    if (amountError) setAmountError(null);
  };

  const numericAmount = parseAmount(amountStr);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError(null);
    setCategoryError(false);
    setGeneralError(null);

    let hasError = false;

    if (!numericAmount || numericAmount <= 0) {
      setAmountError('Enter an amount');
      hasError = true;
    }

    if (mode === 'expense' && !selectedCategoryId) {
      setCategoryError(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (!navigator.onLine || !isOnline) {
      setGeneralError("You're offline. Connect to save.");
      return;
    }


    setLoading(true);

    try {
      // 1. Read reward state and badges BEFORE the save
      const prevRewards = await reward_state();
      const prevBadges = await sync_badges(localToday);
      const prevGoalMet = dayRow?.goal_met || false;

      let savedTx: Transaction | null = null;

      if (editingTransaction) {
        // Edit mode
        const res = await updateTransaction(editingTransaction.id, {
          type: mode,
          amount: numericAmount,
          category_id: mode === 'expense' ? selectedCategoryId : null,
          note: note.trim() || null,
          occurred_on: occurredOn,
        });

        if (res.error || !res.data) {
          setLoading(false);
          setGeneralError(res.error || 'Failed to update entry');
          return;
        }
        savedTx = res.data;
      } else {
        // Create mode
        const res = await createTransaction({
          type: mode,
          amount: numericAmount,
          categoryId: mode === 'expense' ? selectedCategoryId : null,
          note: note.trim() || null,
          occurredOn: occurredOn,
        });

        if (res.error || !res.data) {
          setLoading(false);
          setGeneralError(res.error || 'Failed to save entry');
          return;
        }
        savedTx = res.data;
      }

      // 2. Read reward state and badges AFTER the save
      const nextRewards = await reward_state();
      const nextBadges = await sync_badges(localToday);
      const nextSummary = await daily_summary(occurredOn, occurredOn);
      const nextStreak = await current_streak(localToday);

      const prevXp = prevRewards.data?.xp ?? 0;
      const nextXp = nextRewards.data?.xp ?? 0;
      const xpGained = Math.max(0, nextXp - prevXp);

      // Check if newly earned badge
      const prevEarnedCodes = new Set(
        (prevBadges.data || []).filter(b => b.earned).map(b => b.code)
      );
      (nextBadges.data || []).forEach(b => {
        if (b.earned && !prevEarnedCodes.has(b.code) && onBadgeEarned) {
          onBadgeEarned(b.name);
        }
      });

      const updatedDayRow = nextSummary.data && nextSummary.data.length > 0 ? nextSummary.data[0] : null;
      const nextGoalMet = updatedDayRow?.goal_met === true;
      const isGoalReached = mode === 'saving' && !prevGoalMet && nextGoalMet;

      const matchedCat = allCategories.find(c => c.id === selectedCategoryId) || null;

      bumpRefresh();
      setLoading(false);

      // Open matching success sheet
      setSuccessData({
        tx: savedTx,
        cat: matchedCat,
        xpGained,
        isGoalReached,
        dayTotal: mode === 'expense' ? (updatedDayRow?.spent ?? numericAmount) : (updatedDayRow?.saved ?? numericAmount),
        goalAmount: updatedDayRow?.goal ?? null,
        streakCount: nextStreak.data ?? 0,
        isToday: occurredOn === localToday,
      });

    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      setGeneralError(msg);
    }
  };

  const handleResetForAnother = () => {
    setSuccessData(null);
    setAmountStr('');
    setNote('');
    setAmountError(null);
    setCategoryError(false);
    setGeneralError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* Dimmed backdrop */}
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
            className="relative w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] px-6 pt-3 pb-8 z-40 max-h-[92vh] overflow-y-auto flex flex-col"
          >
            {/* 1. Drag handle */}
            <div className="w-[40px] h-[5px] rounded-full bg-[#E8E5E0] mx-auto mb-3 shrink-0" />

            {/* 2. Header row */}
            <div className="flex items-center justify-between h-[44px] mb-4 shrink-0">
              <h2 className="text-[24px] font-extrabold text-[#2B2622] tracking-tight">
                {editingTransaction ? 'Edit entry' : 'Quick entry'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-[36px] h-[36px] rounded-full bg-[#F7F4EF] hover:bg-[#EFEBE5] flex items-center justify-center border-none cursor-pointer transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {generalError && (
              <div className="p-3 mb-3 bg-red-50 border-2 border-[#FF4B4B]/30 rounded-xl text-[#FF4B4B] text-xs font-semibold">
                {generalError}
              </div>
            )}

            {/* 3. Mode Switcher (Expense / Saving) */}
            <div className="flex bg-[#F7F4EF] p-1 rounded-2xl mb-4 border border-[#E8E5E0]">
              <button
                type="button"
                onClick={() => {
                  setMode('expense');
                  setCategoryError(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-[14px] font-extrabold flex items-center justify-center gap-2 transition-all ${
                  mode === 'expense'
                    ? 'bg-white text-[#2B2622] shadow-sm'
                    : 'text-[#8A837B] hover:text-[#2B2622]'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${mode === 'expense' ? 'bg-[#FF8A1F]' : 'bg-[#8A837B]'}`} />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('saving');
                  setCategoryError(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-[14px] font-extrabold flex items-center justify-center gap-2 transition-all ${
                  mode === 'saving'
                    ? 'bg-white text-[#2B2622] shadow-sm'
                    : 'text-[#8A837B] hover:text-[#2B2622]'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${mode === 'saving' ? 'bg-[#2DBE6C]' : 'bg-[#8A837B]'}`} />
                <span>Saving</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* 4. Amount Input Card */}
              <div
                className={`w-full rounded-[22px] bg-[#F7F4EF] p-4 border-2 transition-colors flex flex-col justify-between ${
                  amountError ? 'border-[#FF4B4B] bg-red-50/40' : 'border-[#E8E5E0] focus-within:border-[#FF8A1F] focus-within:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#8A837B] uppercase tracking-wider">
                    Amount
                  </span>
                  {amountError && (
                    <span className="text-[12px] font-bold text-[#FF4B4B]">
                      {amountError}
                    </span>
                  )}
                </div>

                <div className="flex items-center mt-1">
                  <span className="text-[24px] font-extrabold text-[#8A837B] mr-2">UGX</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={handleAmountChange}
                    placeholder="0"
                    autoFocus
                    className="w-full bg-transparent text-[36px] font-extrabold text-[#2B2622] tabular outline-none border-none p-0 tracking-tight"
                  />
                </div>
              </div>

              {/* 5. Quick Amount Pills */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map(amt => {
                  const isSelected = numericAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all tabular ${
                        isSelected
                          ? mode === 'expense'
                            ? 'bg-[#FF8A1F] border-[#D96F0A] text-[#2B2622]'
                            : 'bg-[#2DBE6C] border-[#1F9A52] text-white'
                          : 'bg-[#F7F4EF] border-[#E8E5E0] text-[#8A837B] hover:text-[#2B2622]'
                      }`}
                    >
                      {amt.toLocaleString('en-US')}
                    </button>
                  );
                })}
              </div>

              {/* Mode-Specific Section */}
              {mode === 'expense' ? (
                /* Expense: Category Selection Chips */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#2B2622]">Category</span>
                    {categoryError && (
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-[#FF4B4B]">
                        Pick one
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-1">
                    {allCategories.map(cat => {
                      const isSelected = selectedCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setCategoryError(false);
                          }}
                          className={`h-[42px] px-3.5 rounded-full border-2 text-[14px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFF1E4] border-[#FF8A1F] text-[#2B2622] shadow-xs'
                              : 'bg-[#F7F4EF] border-[#E8E5E0] text-[#8A837B] hover:text-[#2B2622]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color || '#FF8A1F' }}
                          />
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}

                    {/* + New Category Button */}
                    <button
                      type="button"
                      onClick={() => setIsNewCatOpen(true)}
                      className="h-[42px] px-3.5 rounded-full border-2 border-dashed border-[#FF8A1F] text-[14px] font-bold text-[#D96F0A] bg-white flex items-center gap-1.5 cursor-pointer hover:bg-[#FFF1E4]"
                    >
                      <span>+ New</span>
                    </button>
                  </div>
                </div>
              ) : !dayRow?.goal || dayRow.goal <= 0 ? (
                /* Saving Mode: No goal set */
                <div className="w-full bg-[#F7F4EF] rounded-[20px] p-3.5 border border-[#E8E5E0] text-[13px] font-medium text-[#8A837B] text-center">
                  Set a daily goal to track your progress
                </div>
              ) : (
                /* Saving Mode: Today's Goal Card with Two-Tone Bar */
                <div className="w-full bg-[#E6F7EE] rounded-[22px] p-4 border-2 border-[#C5EBD6] flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-bold text-[#2B2622]">Today's goal</span>
                    <span className="text-[12px] font-bold tabular text-[#4D6B5C]">
                      Saved {formatUGX(dayRow.saved ?? 0)} of {formatUGX(dayRow.goal)}
                    </span>
                  </div>

                  {/* Two-tone progress bar */}
                  <div className="w-full h-3 rounded-full bg-[#CDEBDA] overflow-hidden flex">
                    {/* Portion already saved */}
                    <div
                      className="h-full bg-[#1F9A52]"
                      style={{
                        width: `${Math.min(100, ((dayRow.saved ?? 0) / dayRow.goal) * 100)}%`,
                      }}
                    />
                    {/* Portion added by this entry */}
                    {numericAmount > 0 && (
                      <div
                        className="h-full bg-[#2DBE6C]"
                        style={{
                          width: `${Math.min(
                            100 - Math.min(100, ((dayRow.saved ?? 0) / dayRow.goal) * 100),
                            (numericAmount / dayRow.goal) * 100
                          )}%`,
                        }}
                      />
                    )}
                  </div>

                  {(dayRow.saved ?? 0) + numericAmount >= dayRow.goal && (
                    <div className="text-[12px] font-bold text-[#1F9A52] flex items-center gap-1 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>This reaches your daily goal</span>
                    </div>
                  )}
                </div>
              )}


              {/* Note input (optional, max 120) */}
              <div className="w-full">
                <label className="text-[13px] font-bold text-[#8A837B] block mb-1">
                  Note <span className="font-normal text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value.slice(0, 120))}
                  placeholder="e.g. Lunch at Java, Airtime MTN"
                  maxLength={120}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F4EF] border-2 border-[#E8E5E0] text-[15px] font-medium text-[#2B2622] outline-none focus:border-[#FF8A1F] focus:bg-white"
                />
              </div>

              {/* Date Row */}
              <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F7F4EF] border border-[#E8E5E0]">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="text-[14px] font-bold text-[#2B2622]">Date</span>
                </div>
                <input
                  type="date"
                  max={localToday}
                  value={occurredOn}
                  onChange={e => e.target.value && setOccurredOn(e.target.value)}
                  className="bg-white px-2 py-1 rounded-lg border border-[#E8E5E0] text-[13px] font-bold text-[#2B2622] outline-none cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-[56px] rounded-full border-b-[4px] font-extrabold text-[17px] flex items-center justify-center transition-all cursor-pointer ${
                    mode === 'expense'
                      ? 'bg-[#FF8A1F] border-[#D96F0A] text-[#2B2622]'
                      : 'bg-[#2DBE6C] border-[#1F9A52] text-white'
                  }`}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving…</span>
                    </span>
                  ) : editingTransaction ? (
                    'Save changes'
                  ) : mode === 'expense' ? (
                    'Save expense'
                  ) : (
                    'Save saving'
                  )}
                </button>

                {editingTransaction && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    className="py-2 text-[14px] font-bold text-[#FF4B4B] hover:underline text-center cursor-pointer"
                  >
                    Delete entry
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* New Category Bottom Sheet */}
      <NewCategorySheet
        isOpen={isNewCatOpen}
        onClose={() => setIsNewCatOpen(false)}
        existingCategories={allCategories}
        onCategoryCreated={newCat => {
          setSelectedCategoryId(newCat.id);
          setCategoryError(false);
          bumpRefresh();
        }}
      />

      {/* Delete Confirmation Sheet */}
      {editingTransaction && (
        <DeleteEntrySheet
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          transaction={editingTransaction}
          category={allCategories.find(c => c.id === editingTransaction.category_id) || null}
          dayTotalSpentOrSaved={editingTransaction.type === 'expense' ? (dayRow?.spent ?? 0) : (dayRow?.saved ?? 0)}
          isToday={editingTransaction.occurred_on === localToday}
          onDeleted={del => {
            if (onDeleted) onDeleted(del);
            onClose();
          }}
        />
      )}

      {/* Success Sheet */}
      {successData && (
        <SuccessSheet
          isOpen={Boolean(successData)}
          onDone={() => {
            setSuccessData(null);
            onClose();
          }}
          onAddAnother={handleResetForAnother}
          transaction={successData.tx}
          category={successData.cat}
          xpGained={successData.xpGained}
          isGoalReached={successData.isGoalReached}
          dayTotalSpentOrSaved={successData.dayTotal}
          goalAmount={successData.goalAmount}
          streakCount={successData.streakCount}
          isToday={successData.isToday}
        />
      )}
    </>
  );
};
