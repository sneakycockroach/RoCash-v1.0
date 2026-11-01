import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { useData, useRefresh, bumpRefresh } from '../hooks/useData.tsx';
import { todayLocal, startOfMonth, endOfMonth } from '../lib/date.ts';
import { formatUGX, formatCompact, parseAmount } from '../lib/money.ts';
import {
  getProfile,
  updateProfile,
  listCategories,
  createCategory,
  createTransaction,
  listTransactions,
  softDeleteTransaction,
  undoDeleteTransaction,
  setDailyGoal,
  daily_summary,
  period_totals,
  category_breakdown,
  current_streak,
  reward_state,
  sync_badges,
} from '../api/index.ts';
import type { MutationStatus, Transaction } from '../types.ts';

export const Debug: React.FC = () => {
  const { user, profile, isOnline, signOut, refreshProfile } = useAuth();
  const { bumpRefresh: triggerRefresh } = useRefresh();

  // 2. Simulated today date input defaulting to the real local today
  const defaultLocalToday = todayLocal(profile?.timezone || 'Africa/Kampala');
  const [simDate, setSimDate] = useState<string>(defaultLocalToday);

  // Month bounds based on simDate
  const simMonthStart = startOfMonth(simDate);
  const simMonthEnd = endOfMonth(simDate);

  // Data fetching hooks wired to simDate and global refresh
  const profileQuery = useData(() => getProfile(), []);
  const categoriesQuery = useData(() => listCategories({ includeArchived: true }), []);
  const daySummaryQuery = useData(() => daily_summary(simDate, simDate), [simDate]);
  const streakQuery = useData(() => current_streak(simDate), [simDate]);
  const monthTotalsQuery = useData(() => period_totals(simMonthStart, simMonthEnd), [simMonthStart, simMonthEnd]);
  const breakdownQuery = useData(() => category_breakdown(simMonthStart, simMonthEnd), [simMonthStart, simMonthEnd]);
  const rewardsQuery = useData(() => reward_state(), []);
  const badgesQuery = useData(() => sync_badges(simDate), [simDate]);
  const recentTransactionsQuery = useData(() => listTransactions(), []);

  // Action states
  const [expenseAmountText, setExpenseAmountText] = useState('2000');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [lastActionStatus, setLastActionStatus] = useState<MutationStatus | null>(null);
  const [lastActionMsg, setLastActionMsg] = useState<string>('');
  const [lastDeletedTxId, setLastDeletedTxId] = useState<string | null>(null);

  // Auto-select first active category if available
  useEffect(() => {
    if (categoriesQuery.data && categoriesQuery.data.length > 0 && !selectedCatId) {
      const active = categoriesQuery.data.find(c => !c.archived_at);
      if (active) setSelectedCatId(active.id);
    }
  }, [categoriesQuery.data, selectedCatId]);

  const executeAction = async (name: string, fn: () => Promise<{ error: string | null }>) => {
    setLastActionStatus('pending');
    setLastActionMsg(`Running: ${name}...`);

    if (!isOnline) {
      setLastActionStatus('failed');
      setLastActionMsg(`Failed: Network is offline.`);
      return;
    }

    try {
      const res = await fn();
      if (res.error) {
        setLastActionStatus('failed');
        setLastActionMsg(`Failed (${name}): ${res.error}`);
      } else {
        setLastActionStatus('synced');
        setLastActionMsg(`Success: ${name} synced to server.`);
        bumpRefresh();
        triggerRefresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastActionStatus('failed');
      setLastActionMsg(`Error (${name}): ${msg}`);
    }
  };

  const handleAddExpense = async () => {
    const catId = selectedCatId;
    if (!catId) {
      setLastActionStatus('failed');
      setLastActionMsg('No active category available. Please create or select a category first.');
      return;
    }

    const amount = parseAmount(expenseAmountText) || 2000;
    await executeAction('Add test expense', async () => {
      const res = await createTransaction({
        type: 'expense',
        amount,
        categoryId: catId,
        note: 'Test expense from Debug',
        occurredOn: simDate,
      });
      return { error: res.error };
    });
  };

  const handleAddSaving = async () => {
    await executeAction('Add test saving', async () => {
      const res = await createTransaction({
        type: 'saving',
        amount: 2000,
        note: 'Test saving from Debug',
        occurredOn: simDate,
      });
      return { error: res.error };
    });
  };

  const handleDeleteLast = async () => {
    // Find latest active transaction
    const latestList = await listTransactions();
    if (latestList.error) {
      setLastActionStatus('failed');
      setLastActionMsg(`Failed finding transactions: ${latestList.error}`);
      return;
    }
    const items = latestList.data || [];
    if (items.length === 0) {
      setLastActionStatus('failed');
      setLastActionMsg('No active transaction found to delete.');
      return;
    }
    const target = items[0];
    await executeAction(`Delete last entry (${target.type} ${formatUGX(target.amount)})`, async () => {
      const res = await softDeleteTransaction(target.id);
      if (!res.error) {
        setLastDeletedTxId(target.id);
      }
      return { error: res.error };
    });
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedTxId) {
      setLastActionStatus('failed');
      setLastActionMsg('No recently deleted transaction ID stored to undo.');
      return;
    }
    await executeAction(`Undo delete (${lastDeletedTxId.slice(0, 8)})`, async () => {
      const res = await undoDeleteTransaction(lastDeletedTxId);
      if (!res.error) {
        setLastDeletedTxId(null);
      }
      return { error: res.error };
    });
  };

  const handleSetDailyGoal = async () => {
    await executeAction('Set daily goal to 5000', async () => {
      const res = await setDailyGoal(5000, simDate);
      return { error: res.error };
    });
  };

  const handleMarkOnboardingDone = async () => {
    await executeAction('Mark onboarding done', async () => {
      const res = await updateProfile({ onboarded_at: new Date().toISOString() });
      if (!res.error) {
        await refreshProfile();
      }
      return { error: res.error };
    });
  };

  // 8. Self-checks for formatCompact:
  // 12000 -> "12,000", 99999 -> "99,999", 100000 -> "100K", 186400 -> "186K",
  // 1400000 -> "1.4M", 1450000 -> "1.5M", 999600 -> "1M"
  const selfCheckTests = [
    { input: 12000, expected: '12,000' },
    { input: 99999, expected: '99,999' },
    { input: 100000, expected: '100K' },
    { input: 186400, expected: '186K' },
    { input: 1400000, expected: '1.4M' },
    { input: 1450000, expected: '1.5M' },
    { input: 999600, expected: '1M' },
  ];

  const daySummaryRow = daySummaryQuery.data && daySummaryQuery.data.length > 0
    ? daySummaryQuery.data[0]
    : null;

  return (
    <div className="min-h-screen bg-[#F0ECE4] text-[#2B2622] py-4 px-2">
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-[24px] border border-[#E8E5E0] shadow-sm p-4 space-y-6">
        
        {/* Navigation Bar / Header */}
        <div className="flex items-center justify-between border-b border-[#E8E5E0] pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-[#2B2622]">RoCash Debug</h1>
            <p className="text-xs text-[#8A837B]">Block 1: Foundation Inspection</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F7F4EF] border border-[#E8E5E0] text-[#2B2622]"
            >
              Back Home
            </Link>
            <button
              onClick={() => signOut()}
              className="text-xs font-bold px-2 py-1 text-[#FF4B4B]"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* 1. Session */}
        <section className="bg-[#F7F4EF] p-3.5 rounded-2xl border border-[#E8E5E0]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8A837B]">
              1. Session
            </h2>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                isOnline ? 'bg-[#E6F7EE] text-[#2DBE6C]' : 'bg-red-100 text-[#FF4B4B]'
              }`}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div>
              <span className="font-semibold text-[#8A837B]">Email: </span>
              <span className="font-mono text-[#2B2622]">{user?.email || 'None'}</span>
            </div>
            <div>
              <span className="font-semibold text-[#8A837B]">User ID: </span>
              <span className="font-mono text-[11px] text-[#2B2622] break-all">{user?.id || 'None'}</span>
            </div>
          </div>
        </section>

        {/* 2. Simulated Today Date Input */}
        <section className="bg-[#FFF1E4] p-3.5 rounded-2xl border border-[#FF8A1F]/30">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#D96F0A] mb-2">
            2. Simulated Today (Overrides todayLocal)
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={simDate}
              onChange={e => e.target.value && setSimDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-white rounded-xl text-xs font-bold border border-[#E8E5E0] text-[#2B2622]"
            />
            <button
              type="button"
              onClick={() => setSimDate(defaultLocalToday)}
              className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-white border border-[#E8E5E0] text-[#2B2622] hover:bg-stone-50"
            >
              Reset
            </button>
          </div>
          <p className="text-[10px] text-[#8A837B] mt-1.5">
            Default Kampala today: <span className="font-mono font-semibold">{defaultLocalToday}</span>
          </p>
        </section>

        {/* 3. Profile & Categories */}
        <section className="bg-[#F7F4EF] p-3.5 rounded-2xl border border-[#E8E5E0]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8A837B] mb-2">
            3. Profile & Categories
          </h2>

          {/* Profile details or error */}
          {profileQuery.error ? (
            <div className="p-2 mb-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error fetching profile: {profileQuery.error}
            </div>
          ) : profileQuery.data ? (
            <div className="text-xs space-y-1 mb-3 bg-white p-2.5 rounded-xl border border-[#E8E5E0]">
              <div><span className="text-[#8A837B]">Display Name:</span> {profileQuery.data.display_name || '(none)'}</div>
              <div><span className="text-[#8A837B]">Timezone:</span> {profileQuery.data.timezone}</div>
              <div><span className="text-[#8A837B]">Currency:</span> {profileQuery.data.currency}</div>
              <div>
                <span className="text-[#8A837B]">Onboarded:</span>{' '}
                {profileQuery.data.onboarded_at ? (
                  <span className="text-[#2DBE6C] font-bold">Yes ({profileQuery.data.onboarded_at.slice(0, 10)})</span>
                ) : (
                  <span className="text-amber-600 font-bold">No</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#8A837B] mb-2">No profile found or loading...</p>
          )}

          {/* Categories list or error */}
          <div className="text-xs font-bold text-[#8A837B] mb-1">Categories (incl. archived):</div>
          {categoriesQuery.error ? (
            <div className="p-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error categories: {categoriesQuery.error}
            </div>
          ) : categoriesQuery.data && categoriesQuery.data.length > 0 ? (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {categoriesQuery.data.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#E8E5E0] text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-bold">{cat.name}</span>
                    <span className="text-[10px] text-[#8A837B]">({cat.icon})</span>
                  </div>
                  <div>
                    {cat.archived_at ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-600 font-bold">Archived</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E6F7EE] text-[#2DBE6C] font-bold">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8A837B] italic">No categories created yet.</p>
          )}
        </section>

        {/* 4. Day Summary & Current Streak */}
        <section className="bg-[#F7F4EF] p-3.5 rounded-2xl border border-[#E8E5E0]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8A837B] mb-2">
            4. Day ({simDate}) & Streak
          </h2>

          {daySummaryQuery.error && (
            <div className="p-2 mb-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error daily_summary: {daySummaryQuery.error}
            </div>
          )}

          {streakQuery.error && (
            <div className="p-2 mb-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error current_streak: {streakQuery.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-[#E8E5E0]">
              <div className="text-[10px] uppercase font-bold text-[#8A837B]">Spent</div>
              <div className="text-sm font-extrabold text-[#2B2622] tabular">
                {formatUGX(daySummaryRow?.spent ?? 0)}
              </div>
              <div className="text-[10px] text-[#8A837B]">{daySummaryRow?.expense_count ?? 0} expense(s)</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E8E5E0]">
              <div className="text-[10px] uppercase font-bold text-[#8A837B]">Saved</div>
              <div className="text-sm font-extrabold text-[#2DBE6C] tabular">
                {formatUGX(daySummaryRow?.saved ?? 0)}
              </div>
              <div className="text-[10px] text-[#8A837B]">{daySummaryRow?.saving_count ?? 0} saving(s)</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E8E5E0]">
              <div className="text-[10px] uppercase font-bold text-[#8A837B]">Goal & Status</div>
              <div className="text-xs font-bold text-[#2B2622] tabular">
                {daySummaryRow?.goal ? formatUGX(daySummaryRow.goal) : 'No goal set'}
              </div>
              <div className="text-[10px] font-bold">
                Goal Met:{' '}
                {daySummaryRow?.goal_met ? (
                  <span className="text-[#2DBE6C]">YES</span>
                ) : (
                  <span className="text-[#8A837B]">NO</span>
                )}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#E8E5E0]">
              <div className="text-[10px] uppercase font-bold text-[#8A837B]">Current Streak</div>
              <div className="text-sm font-extrabold text-[#F2542D] tabular">
                {streakQuery.data ?? 0} Days
              </div>
            </div>
          </div>
        </section>

        {/* 5. Month Totals & Category Breakdown */}
        <section className="bg-[#F7F4EF] p-3.5 rounded-2xl border border-[#E8E5E0]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8A837B] mb-2">
            5. Month ({simMonthStart} to {simMonthEnd})
          </h2>

          {monthTotalsQuery.error && (
            <div className="p-2 mb-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error period_totals: {monthTotalsQuery.error}
            </div>
          )}

          {monthTotalsQuery.data && (
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-white p-2 rounded-xl border border-[#E8E5E0]">
                <div className="text-[10px] font-bold text-[#8A837B]">Month Spent</div>
                <div className="text-xs font-extrabold text-[#2B2622] tabular">
                  {formatUGX(monthTotalsQuery.data.spent)}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E8E5E0]">
                <div className="text-[10px] font-bold text-[#8A837B]">Month Saved</div>
                <div className="text-xs font-extrabold text-[#2DBE6C] tabular">
                  {formatUGX(monthTotalsQuery.data.saved)}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs font-bold text-[#8A837B] mb-1">Category Breakdown:</div>
          {breakdownQuery.error ? (
            <div className="p-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error category_breakdown: {breakdownQuery.error}
            </div>
          ) : breakdownQuery.data && breakdownQuery.data.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {breakdownQuery.data.map(item => (
                <div
                  key={item.category_id}
                  className="bg-white p-2 rounded-xl border border-[#E8E5E0] text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-extrabold tabular">{formatUGX(item.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8A837B]">
                    <span>{item.entries} entries</span>
                    <span className="font-bold">{(item.share * 100).toFixed(1)}% share</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8A837B] italic">No category expenses in this period.</p>
          )}
        </section>

        {/* 6. Rewards State & Badges */}
        <section className="bg-[#F7F4EF] p-3.5 rounded-2xl border border-[#E8E5E0]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8A837B] mb-2">
            6. Rewards (reward_state & sync_badges)
          </h2>

          {rewardsQuery.error && (
            <div className="p-2 mb-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error reward_state: {rewardsQuery.error}
            </div>
          )}

          {rewardsQuery.data && (
            <div className="bg-white p-2.5 rounded-xl border border-[#E8E5E0] mb-3 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#8A837B]">Level {rewardsQuery.data.level}:</span>
                <span className="font-extrabold text-[#2B2622]">{rewardsQuery.data.level_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#8A837B]">Total XP:</span>
                <span className="font-extrabold text-[#FFC93C] text-sm tabular">
                  {rewardsQuery.data.xp} XP
                </span>
              </div>
              <div className="text-[10px] text-[#8A837B] pt-1 border-t border-[#E8E5E0] flex justify-between">
                <span>Floor: {rewardsQuery.data.level_floor} XP</span>
                <span>Next: {rewardsQuery.data.next_name} ({rewardsQuery.data.next_floor} XP)</span>
              </div>
            </div>
          )}

          <div className="text-xs font-bold text-[#8A837B] mb-1">Sync Badges:</div>
          {badgesQuery.error ? (
            <div className="p-2 bg-red-50 text-[#FF4B4B] text-xs font-mono rounded-lg border border-red-200">
              Error sync_badges: {badgesQuery.error}
            </div>
          ) : badgesQuery.data && badgesQuery.data.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {badgesQuery.data.map(b => (
                <div
                  key={b.code}
                  className={`p-2 rounded-xl border text-xs ${
                    b.earned ? 'bg-[#E6F7EE] border-[#2DBE6C]/30' : 'bg-white border-[#E8E5E0]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{b.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded ${
                        b.earned ? 'bg-[#2DBE6C] text-white' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {b.earned ? 'EARNED' : `${b.progress}/${b.target}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8A837B] mt-0.5">{b.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8A837B] italic">No badges loaded.</p>
          )}
        </section>

        {/* 7. Mutation Actions */}
        <section className="bg-[#F7F4EF] p-3.5 rounded-2xl border border-[#E8E5E0] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8A837B]">
              7. Actions (State mutations)
            </h2>
            {lastActionStatus && (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                  lastActionStatus === 'synced'
                    ? 'bg-[#E6F7EE] text-[#2DBE6C]'
                    : lastActionStatus === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-[#FF4B4B]'
                }`}
              >
                {lastActionStatus}
              </span>
            )}
          </div>

          {lastActionMsg && (
            <div
              className={`p-2 rounded-xl text-xs font-medium ${
                lastActionStatus === 'synced'
                  ? 'bg-green-50 text-[#2DBE6C] border border-[#2DBE6C]/30'
                  : lastActionStatus === 'failed'
                  ? 'bg-red-50 text-[#FF4B4B] border border-[#FF4B4B]/30'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {lastActionMsg}
            </div>
          )}

          {/* Add test expense */}
          <div className="bg-white p-2.5 rounded-xl border border-[#E8E5E0] space-y-2">
            <div className="text-xs font-bold text-[#2B2622]">Add Test Expense</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#8A837B] uppercase block mb-1">
                  Amount (UGX)
                </label>
                <input
                  type="text"
                  value={expenseAmountText}
                  onChange={e => setExpenseAmountText(e.target.value)}
                  placeholder="2000"
                  className="w-full px-2.5 py-1.5 bg-[#F7F4EF] border border-[#E8E5E0] rounded-lg text-xs font-bold tabular"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#8A837B] uppercase block mb-1">
                  Category
                </label>
                <select
                  value={selectedCatId}
                  onChange={e => setSelectedCatId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#F7F4EF] border border-[#E8E5E0] rounded-lg text-xs font-bold"
                >
                  {(categoriesQuery.data || [])
                    .filter(c => !c.archived_at)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  {(!categoriesQuery.data || categoriesQuery.data.length === 0) && (
                    <option value="">(No categories found)</option>
                  )}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddExpense}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold btn-chunky btn-chunky-primary"
            >
              Add test expense
            </button>
          </div>

          {/* Quick buttons */}
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleAddSaving}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold btn-chunky btn-chunky-green"
            >
              Add test saving (2000)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDeleteLast}
                className="py-2.5 px-2 rounded-xl text-xs font-extrabold btn-chunky btn-chunky-danger"
              >
                Delete last entry
              </button>
              <button
                type="button"
                onClick={handleUndoDelete}
                className="py-2.5 px-2 rounded-xl text-xs font-extrabold btn-chunky btn-chunky-neutral"
              >
                Undo delete
              </button>
            </div>

            <button
              type="button"
              onClick={handleSetDailyGoal}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold btn-chunky btn-chunky-blue"
            >
              Set daily goal to 5000 from today
            </button>

            <button
              type="button"
              onClick={handleMarkOnboardingDone}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold btn-chunky btn-chunky-neutral"
            >
              Mark onboarding done
            </button>
          </div>
        </section>

        {/* 8. Self-Checks for formatCompact */}
        <section className="bg-[#F7F4EF] p-3.5 rounded-2xl border border-[#E8E5E0]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8A837B] mb-2">
            8. Self-Checks (formatCompact)
          </h2>
          <div className="space-y-1.5">
            {selfCheckTests.map((t, idx) => {
              const actual = formatCompact(t.input);
              const pass = actual === t.expected;
              return (
                <div
                  key={idx}
                  className="bg-white p-2 rounded-xl border border-[#E8E5E0] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#8A837B]">{t.input}</span>
                    <span className="text-[#8A837B]">→</span>
                    <span className="font-bold tabular">{actual}</span>
                  </div>
                  <div>
                    {pass ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E6F7EE] text-[#2DBE6C]">
                        PASS
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-100 text-[#FF4B4B]">
                        FAIL (exp {t.expected})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
