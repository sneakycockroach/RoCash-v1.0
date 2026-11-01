import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { supabase } from '../lib/supabase.ts';
import { getProfile } from '../api/profile.ts';
import { getBootDestination } from '../routes/boot.ts';
import { OrangeSheetLayout } from '../components/OrangeSheetLayout.tsx';
import { Button } from '../components/Button.tsx';
import { TextField } from '../components/TextField.tsx';

export const SignInScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isOnline } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password sub-view state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSentMsg, setResetSentMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isOnline) {
      return;
    }

    if (!email || !password) {
      setErrorMsg("That email or password doesn't look right. Try again.");
      return;
    }

    setLoading(true);
    const res = await signIn(email.trim(), password);
    if (res.error) {
      setLoading(false);
      setErrorMsg("That email or password doesn't look right. Try again.");
      return;
    }

    // Auth succeeded -> fetch profile and boot route
    const profRes = await getProfile();
    setLoading(false);
    const destination = getBootDestination(res.data, profRes.data);
    navigate(destination, { replace: true });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetSentMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setResetLoading(true);
    // Note: resetPasswordForEmail requires custom SMTP provider and site URL configured in Supabase Auth settings.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setResetLoading(false);
    setResetSentMsg("If that email has an account, we've sent a link.");
  };

  const handleCheckConnection = () => {
    // Re-check offline state
    if (navigator.onLine) {
      window.dispatchEvent(new Event('online'));
    }
  };

  if (showForgotPassword) {
    return (
      <OrangeSheetLayout
        onBack={() => {
          setShowForgotPassword(false);
          setErrorMsg(null);
          setResetSentMsg(null);
        }}
        title="Reset password"
        subtitle="We will email you a secure link to reset your password."
      >
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          {resetSentMsg && (
            <div className="p-4 bg-green-50 border-2 border-[#2DBE6C]/30 rounded-[18px] text-[#2DBE6C] text-sm font-semibold leading-relaxed">
              {resetSentMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border-2 border-[#FF4B4B]/30 rounded-[18px] text-[#FF4B4B] text-sm font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          <TextField
            label="Email"
            id="reset-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@email.com"
            disabled={resetLoading}
            required
            autoFocus
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={resetLoading}
              disabled={!email.trim()}
            >
              Send reset link
            </Button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-[14px] font-bold text-[#8A837B] hover:text-[#2B2622]"
            >
              Back to sign in
            </button>
          </div>
        </form>
      </OrangeSheetLayout>
    );
  }

  return (
    <OrangeSheetLayout
      onBack={() => navigate('/welcome')}
      title="Welcome back"
      subtitle="Pick up where you left off."
    >
      <div className="flex flex-col gap-4">
        {/* Variant: Offline state banner */}
        {!isOnline && (
          <div className="p-[14px] rounded-[16px] bg-[#F1EEE8] border-2 border-[#E8E5E0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                fill="none"
                height="24"
                stroke="#2B2622"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
              >
                <line x1="1" x2="23" y1="1" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" x2="12.01" y1="20" y2="20"></line>
              </svg>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#2B2622] leading-tight">
                  You're offline
                </span>
                <span className="text-[13px] font-medium text-[#8A837B] leading-tight mt-0.5">
                  Check your connection, then try again.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckConnection}
              className="h-[36px] px-4 rounded-full bg-white border-2 border-[#E8E5E0] text-[14px] font-bold text-[#2B2622] flex items-center justify-center cursor-pointer hover:bg-stone-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Variant: Error state banner */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border-2 border-[#FF4B4B]/30 rounded-[16px] flex items-center gap-2.5 text-[#FF4B4B]">
            <div className="w-5 h-5 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center text-xs font-black shrink-0">
              !
            </div>
            <span className="text-[14px] font-bold leading-snug">
              {errorMsg}
            </span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <TextField
            label="Email"
            id="signin-email"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="name@email.com"
            disabled={loading || !isOnline}
            required
          />

          <div>
            <TextField
              label="Password"
              id="signin-password"
              isPassword
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Your password"
              disabled={loading || !isOnline}
              required
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[14px] font-bold text-[#D96F0A] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || !isOnline || !email || !password}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-[15px] font-medium text-[#2B2622]">
              New here?{' '}
              <Link
                to="/signup"
                className="font-bold text-[#D96F0A] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </OrangeSheetLayout>
  );
};
