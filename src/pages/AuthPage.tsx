import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider.tsx';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, isOnline } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isOnline) {
      setErrorMsg("You are currently offline. Check your internet connection.");
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const res = await signIn(email, password);
      if (res.error) {
        setErrorMsg(res.error);
      }
    } else {
      if (password.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        setLoading(false);
        return;
      }
      const res = await signUp(email, password);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Account created! You are now signed in or can check confirmation.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F0ECE4] flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-[24px] p-6 shadow-sm border border-[#E8E5E0]">
        {!isOnline && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold text-center">
            Offline mode detected. Network calls will fail.
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2B2622]">
            RoCash
          </h1>
          <p className="text-sm font-medium text-[#8A837B] mt-1">
            Gamified daily spending & savings tracker
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#F7F4EF] p-1 rounded-xl mb-6 border border-[#E8E5E0]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-[#2B2622] shadow-sm'
                : 'text-[#8A837B] hover:text-[#2B2622]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#2B2622] shadow-sm'
                : 'text-[#8A837B] hover:text-[#2B2622]'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-[#FF4B4B]/30 rounded-xl text-[#FF4B4B] text-xs font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-[#2DBE6C]/30 rounded-xl text-[#2DBE6C] text-xs font-semibold leading-relaxed">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8A837B] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alfred@rocash.ug"
              required
              className="w-full px-4 py-3 bg-[#F7F4EF] border border-[#E8E5E0] rounded-xl text-sm font-semibold text-[#2B2622] placeholder-[#8A837B]/60 focus:outline-none focus:border-[#FF8A1F] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8A837B] mb-1.5">
              Password {mode === 'signup' && <span className="text-xs font-normal lowercase">(min 8 chars)</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-4 py-3 bg-[#F7F4EF] border border-[#E8E5E0] rounded-xl text-sm font-semibold text-[#2B2622] placeholder-[#8A837B]/60 focus:outline-none focus:border-[#FF8A1F] focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 mt-2 rounded-xl text-sm font-extrabold btn-chunky btn-chunky-primary"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create RoCash Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#8A837B]">
            All finances strictly in Uganda Shillings (UGX)
          </p>
        </div>
      </div>
    </div>
  );
};
