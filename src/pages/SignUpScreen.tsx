import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { OrangeSheetLayout } from '../components/OrangeSheetLayout.tsx';
import { Button } from '../components/Button.tsx';
import { TextField } from '../components/TextField.tsx';

export const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isOnline } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConfirmMsg(null);

    if (!isOnline) {
      setErrorMsg("You're offline. Check your connection, then try again.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter your email.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Use 8 or more characters for your password.');
      return;
    }

    setLoading(true);
    const res = await signUp(email.trim(), password);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    if (res.data?.session) {
      // Session returned -> proceed straight to Intro
      navigate('/onboarding/intro', { replace: true });
    } else {
      // If email confirmation is required, notify user
      setConfirmMsg('Check your email to confirm your account, then sign in.');
    }
  };

  return (
    <OrangeSheetLayout
      onBack={() => navigate('/welcome')}
      title="Create your account"
      subtitle="It takes less than a minute."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {confirmMsg ? (
          <div className="p-4 bg-green-50 border-2 border-[#2DBE6C]/30 rounded-[18px] text-[#2DBE6C] text-sm font-semibold leading-relaxed">
            {confirmMsg}
          </div>
        ) : null}

        <TextField
          label="Email"
          id="signup-email"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="name@email.com"
          disabled={loading}
          required
        />

        <TextField
          label="Password"
          id="signup-password"
          isPassword
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="At least 8 characters"
          hint="Use 8 or more characters."
          error={errorMsg}
          disabled={loading}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!email || password.length < 8}
          >
            Create account
          </Button>
        </div>

        {/* Footer Links */}
        <div className="mt-4 text-center">
          <p className="text-[15px] font-medium text-[#2B2622]">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="font-bold text-[#D96F0A] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-2 text-center">
          <p className="text-[12px] font-medium text-[#8A837B] leading-relaxed">
            By continuing you agree to the Terms and Privacy Policy.
          </p>
        </div>
      </form>
    </OrangeSheetLayout>
  );
};
