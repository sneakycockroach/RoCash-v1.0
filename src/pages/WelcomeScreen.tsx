import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.tsx';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen max-w-[430px] mx-auto bg-[#FF8A1F] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Top Orange Area */}
      <div className="pt-16 pb-6 px-6 flex flex-col items-center">
        {/* Wordmark */}
        <h1 className="text-[56px] leading-none font-extrabold tracking-tight text-[#2B2622] mb-8">
          RoCash
        </h1>

        {/* Hero Card */}
        <div className="w-full bg-white rounded-[24px] p-5 flex flex-col justify-between shadow-none border border-black/5 relative">
          {/* Row: Today & streak pill */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-[#8A837B]">Today</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A837B] bg-[#F7F4EF] px-2 py-0.5 rounded-md">
                Example
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFE9E3] rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-[#F2542D] shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.75 7.5a.75.75 0 00-1.28.53 9 9 0 0015.01 6.551.75.75 0 00-.73-1.231 6.746 6.746 0 01-1.636-.576 8.243 8.243 0 00-.756-3.834.75.75 0 00-1.06-.39 6.75 6.75 0 01-3.335.74v-7zM12 11.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"
                  />
                </svg>
                <span className="text-[14px] font-bold text-[#F2542D]">7 day streak</span>
              </div>
            </div>
          </div>

          {/* Amount and Caption */}
          <div className="flex flex-col gap-0.5 mb-3">
            <div className="text-[36px] font-extrabold text-[#2B2622] leading-none tracking-tight tabular">
              UGX 12,000
            </div>
            <div className="text-[14px] font-medium text-[#8A837B]">
              of UGX 20,000 saved today
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-[14px] bg-[#EFEBE5] rounded-full overflow-hidden">
            <div className="h-full bg-[#2DBE6C] rounded-full w-[60%]" />
          </div>
        </div>
      </div>

      {/* Bottom White Sheet */}
      <div className="bg-white rounded-t-[32px] px-6 pt-9 pb-8 flex flex-col justify-between flex-1">
        <div>
          <h2 className="text-[30px] font-extrabold text-[#2B2622] leading-[1.15] tracking-tight">
            Know where your<br />money goes.
          </h2>
          <p className="mt-3 text-[16px] font-medium text-[#8A837B] leading-snug">
            Log your spending in seconds and watch your savings grow.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <Button
            variant="primary"
            onClick={() => navigate('/signup')}
          >
            Get started
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/signin')}
          >
            I already have an account
          </Button>
        </div>
      </div>
    </div>
  );
};
