import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { getBootDestination } from '../routes/boot.ts';

export interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [minTimerDone, setMinTimerDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimerDone(true);
    }, 600); // at least 600ms to avoid flash
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimerDone && !loading) {
      const target = getBootDestination(session, profile);
      navigate(target, { replace: true });
      if (onFinish) {
        onFinish();
      }
    }
  }, [minTimerDone, loading, session, profile, navigate, onFinish]);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto bg-[#FF8A1F] flex items-center justify-center select-none">
      <h1 className="text-[56px] font-extrabold tracking-tight text-[#2B2622] leading-none">
        RoCash
      </h1>
    </div>
  );
};
