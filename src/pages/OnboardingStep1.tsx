import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';
import { updateProfile } from '../api/profile.ts';
import { OrangeSheetLayout } from '../components/OrangeSheetLayout.tsx';
import { StepProgress } from '../components/StepProgress.tsx';
import { Button } from '../components/Button.tsx';
import { TextField } from '../components/TextField.tsx';
import { AVATAR_SEEDS, getAvatarSvg } from '../lib/avatar.ts';

function getLocalGreeting(tz: string = 'Africa/Kampala'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  } catch {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }
}

export const OnboardingStep1: React.FC = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  const [name, setName] = useState(profile?.display_name || '');
  const [selectedSeed, setSelectedSeed] = useState(profile?.avatar_seed || 'sunrise');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const greeting = getLocalGreeting(profile?.timezone);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setLoading(true);
    const res = await updateProfile({
      display_name: trimmed,
      avatar_seed: selectedSeed,
    });
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    await refreshProfile();
    navigate('/onboarding/step-2');
  };

  return (
    <OrangeSheetLayout
      onBack={() => navigate('/onboarding/intro')}
      topSlot={<StepProgress currentStep={1} />}
      title="What should we call you?"
      footer={
        <div className="flex flex-col items-center">
          <Button
            variant="primary"
            onClick={handleContinue}
            loading={loading}
            disabled={name.trim().length === 0}
          >
            Continue
          </Button>
          <p className="mt-3 text-center text-[14px] font-medium text-[#8A837B]">
            You can change this later in Profile.
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Name Input */}
        <div>
          <TextField
            label="Your name"
            id="onboarding-name"
            value={name}
            onChange={e => {
              setName(e.target.value.slice(0, 20));
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="e.g. Amina"
            maxLength={20}
            error={errorMsg}
            autoFocus
          />
        </div>

        {/* Live Greeting Card */}
        <div>
          <div className="text-[14px] font-medium text-[#8A837B] mb-2">
            How we'll greet you
          </div>
          <div className="w-full rounded-[24px] bg-[#FFF1E4] p-4 flex items-center gap-4 border border-[#FF8A1F]/20">
            {/* 64px live avatar preview */}
            <div
              className="w-[64px] h-[64px] rounded-full overflow-hidden bg-white shrink-0 border-2 border-[#FF8A1F]"
              dangerouslySetInnerHTML={{ __html: getAvatarSvg(selectedSeed) }}
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[14px] font-medium text-[#8A837B] leading-snug">
                {greeting}
              </span>
              <span className="text-[26px] font-extrabold text-[#2B2622] leading-tight tracking-tight truncate">
                {name.trim() || '…'}
              </span>
            </div>
          </div>
        </div>

        {/* Avatar Picker */}
        <div>
          <div className="text-[15px] font-bold text-[#2B2622] mb-3">
            Pick your Avatar
          </div>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_SEEDS.map(seed => {
              const isSelected = selectedSeed === seed;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setSelectedSeed(seed)}
                  aria-label={`Select avatar ${seed}`}
                  className={`w-[60px] h-[60px] rounded-full overflow-hidden bg-[#F7F4EF] p-1 transition-all mx-auto ${
                    isSelected
                      ? 'ring-[3px] ring-[#2B2622] ring-offset-[2px] ring-offset-white bg-[#FFF1E4]'
                      : 'border-2 border-[#E8E5E0] hover:border-[#FF8A1F]'
                  }`}
                >
                  <div
                    className="w-full h-full rounded-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: getAvatarSvg(seed) }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </OrangeSheetLayout>
  );
};
