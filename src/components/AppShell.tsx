import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QuickEntrySheet } from './QuickEntrySheet.tsx';
import { Toast } from './Toast.tsx';
import { undoDeleteTransaction } from '../api/transactions.ts';
import { bumpRefresh } from '../hooks/useData.tsx';
import {
  NavHomeIcon,
  NavHistoryIcon,
  NavPlusIcon,
  NavReportsIcon,
  NavRewardsIcon,
} from './Icons.tsx';
import type { Transaction, TransactionType } from '../types.ts';

interface AppShellContextValue {
  openQuickEntry: (options?: {
    mode?: TransactionType;
    tx?: Transaction | null;
  }) => void;
  showToast: (
    message: string,
    type?: 'success' | 'error',
    action?: { label: string; onClick: () => void },
    duration?: number
  ) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error('useAppShell must be used within an AppShell');
  }
  return ctx;
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Quick Entry Sheet state
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [quickEntryMode, setQuickEntryMode] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastDuration, setToastDuration] = useState<number>(4000);
  const [toastAction, setToastAction] = useState<{
    label: string;
    onClick: () => void;
  } | undefined>(undefined);

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
    action?: { label: string; onClick: () => void },
    duration = 4000
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastAction(action);
    setToastDuration(duration);
  };

  const openQuickEntry = (options?: {
    mode?: TransactionType;
    tx?: Transaction | null;
  }) => {
    setQuickEntryMode(options?.mode || 'expense');
    setEditingTx(options?.tx || null);
    setQuickEntryOpen(true);
  };

  const handleDeletedEntry = (deletedTx: Transaction) => {
    // Show 6-second toast with Undo action
    showToast(
      'Entry deleted',
      'success',
      {
        label: 'Undo',
        onClick: async () => {
          await undoDeleteTransaction(deletedTx.id);
          bumpRefresh();
          showToast('Entry restored', 'success');
        },
      },
      6000
    );
  };

  const handleBadgeEarned = (badgeName: string) => {
    showToast(`Badge unlocked: ${badgeName}!`, 'success', undefined, 5000);
  };

  const currentPath = location.pathname;
  const isProfile = currentPath.startsWith('/profile');

  return (
    <AppShellContext.Provider value={{ openQuickEntry, showToast }}>
      <div className="min-h-screen max-w-[393px] mx-auto bg-[#FF8A1F] flex flex-col relative select-none">
        {/* Main page content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Global Toast */}
        <Toast
          message={toastMessage}
          type={toastType}
          duration={toastDuration}
          action={toastAction}
          onClose={() => setToastMessage(null)}
        />

        {/* Global Quick Entry Sheet */}
        <QuickEntrySheet
          isOpen={quickEntryOpen}
          onClose={() => {
            setQuickEntryOpen(false);
            setEditingTx(null);
          }}
          initialMode={quickEntryMode}
          editingTransaction={editingTx}
          onBadgeEarned={handleBadgeEarned}
          onDeleted={handleDeletedEntry}
        />

        {/* Bottom Navigation Bar (hidden on /profile) */}
        {!isProfile && (
          <nav
            aria-label="Main Navigation"
            className="fixed bottom-0 left-0 right-0 max-w-[393px] mx-auto h-[84px] bg-white rounded-t-[24px] border-t-2 border-[#E8E5E0] z-50 flex items-center justify-around px-3 pb-2"
          >
            {/* Home */}
            <div
              onClick={() => navigate('/')}
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div
                className={
                  currentPath === '/'
                    ? 'bg-[#FFF1E4] rounded-[16px] px-3 py-[6px] flex flex-col items-center'
                    : 'flex flex-col items-center py-[6px] min-w-[56px]'
                }
              >
                <NavHomeIcon
                  size={22}
                  stroke={currentPath === '/' ? '#2B2622' : '#8A837B'}
                />
                <span
                  className={`text-[13px] mt-[2px] leading-tight ${
                    currentPath === '/'
                      ? 'font-extrabold text-[#2B2622]'
                      : 'font-semibold text-[#8A837B]'
                  }`}
                >
                  Home
                </span>
              </div>
            </div>

            {/* History */}
            <div
              onClick={() => navigate('/history')}
              className="flex flex-col items-center justify-center cursor-pointer min-w-[56px]"
            >
              <div
                className={
                  currentPath.startsWith('/history')
                    ? 'bg-[#FFF1E4] rounded-[16px] px-3 py-[6px] flex flex-col items-center'
                    : 'flex flex-col items-center py-[6px]'
                }
              >
                <NavHistoryIcon
                  size={24}
                  stroke={currentPath.startsWith('/history') ? '#2B2622' : '#8A837B'}
                />
                <span
                  className={`text-[13px] mt-1 leading-tight ${
                    currentPath.startsWith('/history')
                      ? 'font-extrabold text-[#2B2622]'
                      : 'font-semibold text-[#8A837B]'
                  }`}
                >
                  History
                </span>
              </div>
            </div>

            {/* Center [+] Action Button */}
            <div className="flex items-center justify-center cursor-pointer">
              <button
                type="button"
                onClick={() => openQuickEntry({ mode: 'expense' })}
                aria-label="Add entry"
                className="w-[56px] h-[56px] rounded-[18px] bg-[#FF8A1F] border-b-[4px] border-[#D96F0A] flex items-center justify-center active:translate-y-[2px] transition-transform cursor-pointer"
              >
                <NavPlusIcon size={28} />
              </button>
            </div>

            {/* Reports */}
            <div
              onClick={() => navigate('/reports')}
              className="flex flex-col items-center justify-center cursor-pointer min-w-[56px]"
            >
              <div
                className={
                  currentPath.startsWith('/reports')
                    ? 'bg-[#FFF1E4] rounded-[16px] px-3 py-[6px] flex flex-col items-center'
                    : 'flex flex-col items-center py-[6px]'
                }
              >
                <NavReportsIcon
                  size={24}
                  stroke={currentPath.startsWith('/reports') ? '#2B2622' : '#8A837B'}
                />
                <span
                  className={`text-[13px] mt-1 leading-tight ${
                    currentPath.startsWith('/reports')
                      ? 'font-extrabold text-[#2B2622]'
                      : 'font-semibold text-[#8A837B]'
                  }`}
                >
                  Reports
                </span>
              </div>
            </div>

            {/* Rewards */}
            <div
              onClick={() => navigate('/rewards')}
              className="flex flex-col items-center justify-center cursor-pointer min-w-[56px]"
            >
              <div
                className={
                  currentPath.startsWith('/rewards')
                    ? 'bg-[#FFF1E4] rounded-[16px] px-3 py-[6px] flex flex-col items-center'
                    : 'flex flex-col items-center py-[6px]'
                }
              >
                <NavRewardsIcon
                  size={24}
                  stroke={currentPath.startsWith('/rewards') ? '#2B2622' : '#8A837B'}
                />
                <span
                  className={`text-[13px] mt-1 leading-tight ${
                    currentPath.startsWith('/rewards')
                      ? 'font-extrabold text-[#2B2622]'
                      : 'font-semibold text-[#8A837B]'
                  }`}
                >
                  Rewards
                </span>
              </div>
            </div>
          </nav>
        )}
      </div>
    </AppShellContext.Provider>
  );
};
