import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { updateProfile } from '../api/profile.ts';
import { getCurrentGoal } from '../api/goals.ts';
import { listCategories } from '../api/categories.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import { supabase } from '../lib/supabase.ts';
import { todayLocal } from '../lib/date.ts';
import { formatCompact } from '../lib/money.ts';
import { AVATAR_SEEDS, getAvatarDataUri } from '../lib/avatar.ts';
import { SUPPORT_WHATSAPP, SUPPORT_EMAIL, APP_VERSION } from '../config.ts';
import { BottomSheet } from '../components/BottomSheet.tsx';
import { Button } from '../components/Button.tsx';
import { TextField } from '../components/TextField.tsx';
import { useAppShell } from '../components/AppShell.tsx';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { showToast } = useAppShell();

  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const todayStr = todayLocal(userTimezone);

  // Queries for status in groups
  const goalQuery = useData(() => getCurrentGoal(todayStr), [todayStr]);
  const categoriesQuery = useData(() => listCategories(), []);

  const activeCategoriesCount = (categoriesQuery.data || []).filter(c => !c.archived_at).length;
  const currentGoalAmount = goalQuery.data?.daily_amount ?? null;

  // Sheets state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isIPhoneSheetOpen, setIsIPhoneSheetOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);

  // Edit Profile form state
  const [editName, setEditName] = useState(profile?.display_name || '');
  const [editAvatarSeed, setEditAvatarSeed] = useState(profile?.avatar_seed || 'sunrise');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Delete account form state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // PWA Install State
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if running as standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Sync edit profile values when opened
  useEffect(() => {
    if (isEditProfileOpen) {
      setEditName(profile?.display_name || '');
      setEditAvatarSeed(profile?.avatar_seed || 'sunrise');
      setEditError(null);
    }
  }, [isEditProfileOpen, profile]);

  // Handle Edit Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const trimmed = editName.trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
      setEditError('Display name must be between 1 and 20 characters.');
      return;
    }

    setIsSavingProfile(true);
    const res = await updateProfile({
      display_name: trimmed,
      avatar_seed: editAvatarSeed,
    });
    setIsSavingProfile(false);

    if (res.error) {
      setEditError(res.error);
    } else {
      await refreshProfile();
      bumpRefresh();
      setIsEditProfileOpen(false);
      showToast('Profile updated', 'success');
    }
  };

  // Welcome-back screen toggle
  const handleToggleWelcomeBack = async () => {
    const nextVal = !profile?.welcome_back_enabled;
    const res = await updateProfile({ welcome_back_enabled: nextVal });
    if (!res.error) {
      await refreshProfile();
      bumpRefresh();
      showToast(nextVal ? 'Welcome back screen enabled' : 'Welcome back screen disabled', 'success');
    } else {
      showToast(res.error, 'error');
    }
  };

  // Export Data to CSV
  const handleExportData = async () => {
    try {
      showToast('Preparing your export…', 'success');

      // Fetch all non-deleted transactions
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .is('deleted_at', null)
        .order('occurred_on', { ascending: true });

      if (txError) {
        showToast('Failed to export transactions: ' + txError.message, 'error');
        return;
      }

      // Fetch categories for name mapping
      const { data: cats } = await supabase.from('categories').select('id, name');
      const catMap = new Map<string, string>();
      (cats || []).forEach(c => catMap.set(c.id, c.name));

      // CSV Header
      const headers = ['date', 'time', 'type', 'amount', 'category', 'note'];
      const rows = (txs || []).map(tx => {
        let timeStr = '';
        if (tx.occurred_at) {
          try {
            timeStr = new Date(tx.occurred_at).toLocaleTimeString('en-GB', {
              timeZone: userTimezone,
              hour12: false,
            });
          } catch {
            timeStr = '';
          }
        }
        const catName = tx.category_id ? catMap.get(tx.category_id) || '' : '';
        const cleanNote = (tx.note || '').replace(/"/g, '""');
        return [
          tx.occurred_on,
          timeStr,
          tx.type,
          tx.amount,
          `"${catName}"`,
          `"${cleanNote}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rocash-export-${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Export downloaded successfully', 'success');
    } catch (err: unknown) {
      showToast('Error generating export file', 'error');
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;

    setIsDeletingAccount(true);
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      setIsDeletingAccount(false);
      showToast('Error deleting account: ' + error.message, 'error');
      return;
    }

    sessionStorage.clear();
    await signOut();
    navigate('/welcome');
  };

  // PWA Install click
  const handleInstallClick = () => {
    const isIos =
      /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
      !(window as any).MSStream;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    } else if (isIos) {
      setIsIPhoneSheetOpen(true);
    } else {
      showToast('Use your browser menu to install RoCash', 'success');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-12">
      {/* Header with Back Arrow to Home */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-[#E8E5E0] bg-white sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to home"
            className="w-9 h-9 rounded-full bg-[#F7F4EF] border border-[#E8E5E0] flex items-center justify-center text-[#2B2622] hover:bg-[#FFF1E4] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[24px] font-extrabold text-[#2B2622] tracking-tight leading-tight">
            Profile & Settings
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-5 py-5 flex flex-col gap-6">
        {/* 1. IDENTITY ROW */}
        <section
          aria-label="User identity"
          className="w-full rounded-[26px] bg-[#F7F4EF] border-2 border-[#E8E5E0] p-4 flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-white border-2 border-[#FF8A1F] overflow-hidden shrink-0 shadow-2xs">
              <img
                src={getAvatarDataUri(profile?.avatar_seed || 'sunrise')}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h2 className="text-[17px] font-extrabold text-[#2B2622] truncate leading-tight">
                {profile?.display_name || 'RoCash User'}
              </h2>
              <span className="text-[12px] font-medium text-[#8A837B] truncate">
                {user?.email || ''}
              </span>
            </div>
          </div>

          {/* Edit Profile Pill */}
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3 py-1.5 rounded-full bg-white border border-[#E8E5E0] text-[12px] font-extrabold text-[#2B2622] hover:bg-[#FFF1E4] hover:border-[#FF8A1F] transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            <span>Edit</span>
          </button>
        </section>

        {/* 2. INSTALL CARD (Hidden in standalone display mode) */}
        {!isStandalone && (
          <section
            aria-label="Install app"
            className="w-full rounded-[24px] bg-gradient-to-r from-[#FFF8F2] to-[#FFF1E4] border-2 border-[#FF8A1F]/30 p-4 flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF8A1F] border-b-[3px] border-[#D96F0A] flex items-center justify-center text-[#2B2622] text-[18px] font-black shrink-0">
                📲
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-extrabold text-[#2B2622]">
                  Install RoCash
                </span>
                <span className="text-[11px] font-medium text-[#8A837B]">
                  Add to home screen for faster access
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 rounded-full bg-[#FF8A1F] border-b-[3px] border-[#D96F0A] text-[#2B2622] text-[12px] font-extrabold cursor-pointer shadow-xs active:translate-y-0.5"
            >
              Install
            </button>
          </section>
        )}

        {/* 3. MONEY GROUP */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider px-1">
            Money & Targets
          </span>

          <div className="rounded-[24px] bg-white border-2 border-[#E8E5E0] divide-y divide-[#E8E5E0]/70 overflow-hidden shadow-2xs">
            {/* Daily Goal */}
            <button
              type="button"
              onClick={() => navigate('/profile/goal')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F4EF]/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E6F7EE] text-[#2DBE6C] flex items-center justify-center">
                  🎯
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-[#2B2622] group-hover:text-[#FF8A1F] transition-colors">
                    Daily savings goal
                  </span>
                  <span className="text-[11px] font-medium text-[#8A837B]">
                    {currentGoalAmount ? `UGX ${formatCompact(currentGoalAmount)} per day` : 'Set a daily goal'}
                  </span>
                </div>
              </div>
              <span className="text-[#8A837B] text-[14px] font-bold group-hover:translate-x-0.5 transition-transform">
                ›
              </span>
            </button>

            {/* Categories */}
            <button
              type="button"
              onClick={() => navigate('/profile/categories')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F4EF]/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF1E4] text-[#FF8A1F] flex items-center justify-center">
                  📁
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-[#2B2622] group-hover:text-[#FF8A1F] transition-colors">
                    Categories
                  </span>
                  <span className="text-[11px] font-medium text-[#8A837B]">
                    {activeCategoriesCount} active
                  </span>
                </div>
              </div>
              <span className="text-[#8A837B] text-[14px] font-bold group-hover:translate-x-0.5 transition-transform">
                ›
              </span>
            </button>

            {/* Currency (UGX, no chevron) */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F7F4EF] text-[#8A837B] flex items-center justify-center font-black text-[12px]">
                  UGX
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-[#2B2622]">
                    Currency
                  </span>
                  <span className="text-[11px] font-medium text-[#8A837B]">
                    Ugandan Shilling
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F7F4EF] border border-[#E8E5E0] text-[12px] font-black text-[#2B2622] tabular">
                UGX
              </span>
            </div>
          </div>
        </div>

        {/* 4. APP GROUP (ONLY Welcome-back screen toggle) */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider px-1">
            Preferences
          </span>

          <div className="rounded-[24px] bg-white border-2 border-[#E8E5E0] p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFF1E4] text-[#D96F0A] flex items-center justify-center text-[16px]">
                👋
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-extrabold text-[#2B2622]">
                  Welcome-back screen
                </span>
                <span className="text-[11px] font-medium text-[#8A837B]">
                  Show streak & weekly recap on first daily open
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={profile?.welcome_back_enabled}
              onClick={handleToggleWelcomeBack}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors cursor-pointer ${
                profile?.welcome_back_enabled ? 'bg-[#2DBE6C]' : 'bg-[#E8E5E0]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  profile?.welcome_back_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. DATA & PRIVACY */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider px-1">
            Data & Privacy
          </span>

          <div className="rounded-[24px] bg-white border-2 border-[#E8E5E0] divide-y divide-[#E8E5E0]/70 overflow-hidden shadow-2xs">
            {/* Export my data */}
            <button
              type="button"
              onClick={handleExportData}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F4EF]/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F7F4EF] text-[#2B2622] flex items-center justify-center">
                  📊
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-[#2B2622] group-hover:text-[#FF8A1F] transition-colors">
                    Export my data
                  </span>
                  <span className="text-[11px] font-medium text-[#8A837B]">
                    Download all your entries as CSV
                  </span>
                </div>
              </div>
              <span className="text-[#8A837B] text-[13px] font-bold">⬇</span>
            </button>

            {/* Delete account */}
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText('');
                setIsDeleteSheetOpen(true);
              }}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FFF1E4]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF1E4] text-[#D9383A] flex items-center justify-center">
                  ⚠️
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-[#D9383A]">
                    Delete account
                  </span>
                  <span className="text-[11px] font-medium text-[#8A837B]">
                    Permanently delete all your records
                  </span>
                </div>
              </div>
              <span className="text-[#D9383A] text-[14px] font-bold">›</span>
            </button>
          </div>
        </div>

        {/* 6. SUPPORT GROUP (Conditional on non-empty config) */}
        {(SUPPORT_WHATSAPP || SUPPORT_EMAIL) && (
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-extrabold text-[#8A837B] uppercase tracking-wider px-1">
              Support
            </span>

            <div className="rounded-[24px] bg-[#F7F4EF] border-2 border-[#E8E5E0] p-4 flex flex-col gap-3 shadow-2xs">
              <span className="text-[14px] font-extrabold text-[#2B2622]">
                Need help or have feedback?
              </span>
              <div className="flex items-center gap-3">
                {Boolean(SUPPORT_WHATSAPP) && (
                  <a
                    href={`https://wa.me/${String(SUPPORT_WHATSAPP).replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-full bg-[#2DBE6C] text-white text-[13px] font-extrabold text-center shadow-xs"
                  >
                    WhatsApp
                  </a>
                )}
                {SUPPORT_EMAIL && (
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=RoCash%20Support`}
                    className="flex-1 py-2.5 px-3 rounded-full bg-white border border-[#E8E5E0] text-[#2B2622] text-[13px] font-extrabold text-center hover:bg-[#FFF1E4] transition-colors"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. SIGN OUT BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/welcome');
            }}
            className="w-full h-[50px] rounded-full bg-white border-2 border-[#E8E5E0] text-[14px] font-extrabold text-[#D9383A] hover:bg-[#FFF1E4] active:translate-y-0.5 transition-all cursor-pointer shadow-xs"
          >
            Sign out
          </button>
        </div>

        {/* 8. VERSION FOOTER */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[12px] font-medium text-[#8A837B]">
            RoCash version {APP_VERSION}
          </p>
        </div>
      </div>

      {/* EDIT PROFILE BOTTOM SHEET */}
      <BottomSheet
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit profile"
      >
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 pt-1 pb-3">
          {/* Avatar Selector */}
          <div>
            <label className="text-[14px] font-bold text-[#2B2622] block mb-2">
              Choose avatar
            </label>
            <div className="grid grid-cols-4 gap-3 p-2 bg-[#F7F4EF] rounded-[22px] border border-[#E8E5E0]">
              {AVATAR_SEEDS.map(seed => {
                const isSelected = editAvatarSeed === seed;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setEditAvatarSeed(seed)}
                    className={`aspect-square rounded-full p-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-3 ring-[#FF8A1F] scale-105 bg-white shadow-xs'
                        : 'hover:scale-95'
                    }`}
                  >
                    <img
                      src={getAvatarDataUri(seed)}
                      alt={seed}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <TextField
              label="Display name"
              id="edit-display-name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              maxLength={20}
              placeholder="Your name"
              error={editError}
              autoFocus
            />
          </div>

          {/* Read-only Email with Lock */}
          <div>
            <label className="text-[14px] font-bold text-[#2B2622] block mb-2">
              Email address
            </label>
            <div className="w-full h-[52px] rounded-2xl bg-[#F7F4EF] border border-[#E8E5E0] px-4 flex items-center justify-between text-[14px] text-[#8A837B] select-none">
              <span className="truncate">{user?.email || ''}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSavingProfile}
              disabled={editName.trim().length === 0}
            >
              Save changes
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* INSTALL ON IPHONE BOTTOM SHEET */}
      <BottomSheet
        isOpen={isIPhoneSheetOpen}
        onClose={() => setIsIPhoneSheetOpen(false)}
        title="Install on iPhone"
      >
        <div className="flex flex-col gap-5 pt-2 pb-4 text-[#2B2622]">
          <p className="text-[13px] font-medium text-[#8A837B]">
            Install RoCash on your home screen for full-screen offline access:
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F7F4EF] border border-[#E8E5E0]">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#FF8A1F] text-[18px] shrink-0 shadow-2xs">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-extrabold">1. Tap Share</span>
                <span className="text-[12px] text-[#8A837B]">
                  In Safari's toolbar at the bottom of the screen
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F7F4EF] border border-[#E8E5E0]">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#2DBE6C] text-[18px] shrink-0 shadow-2xs">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-extrabold">2. Tap 'Add to Home Screen'</span>
                <span className="text-[12px] text-[#8A837B]">
                  Scroll down the share options and select Add to Home Screen
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsIPhoneSheetOpen(false)}
            className="w-full h-[46px] rounded-full bg-[#FF8A1F] border-b-[3px] border-[#D96F0A] text-[#2B2622] font-extrabold text-[14px] cursor-pointer mt-2"
          >
            Got it
          </button>
        </div>
      </BottomSheet>

      {/* DELETE ACCOUNT CONFIRMATION BOTTOM SHEET */}
      <BottomSheet
        isOpen={isDeleteSheetOpen}
        onClose={() => setIsDeleteSheetOpen(false)}
        title="Delete account"
      >
        <div className="flex flex-col gap-4 pt-1 pb-4">
          <div className="p-4 rounded-2xl bg-[#FFF1E4] border border-[#D9383A]/30 text-[#D9383A] text-[13px] font-semibold">
            Warning: This action is permanent and cannot be undone. All your expenses, savings records, badges, and custom categories will be completely erased.
          </div>

          <button
            type="button"
            onClick={handleExportData}
            className="text-[13px] font-extrabold text-[#FF8A1F] hover:underline text-left cursor-pointer"
          >
            ⬇ Export my data first
          </button>

          <div className="flex flex-col gap-2 pt-2">
            <label className="text-[13px] font-bold text-[#2B2622]">
              Type <span className="text-[#D9383A] font-extrabold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full h-[48px] px-4 rounded-xl border-2 border-[#E8E5E0] focus:border-[#D9383A] text-[15px] font-bold text-[#2B2622] outline-none"
            />
          </div>

          <div className="pt-2">
            <Button
              variant="danger"
              disabled={deleteConfirmText.trim() !== 'DELETE'}
              loading={isDeletingAccount}
              onClick={handleDeleteAccount}
            >
              Permanently delete my account
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
