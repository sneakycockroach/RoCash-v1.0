import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OrangeSheetLayout } from '../components/OrangeSheetLayout.tsx';
import { Button } from '../components/Button.tsx';

export const IntroScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <OrangeSheetLayout
      headerChildren={
        <div className="flex flex-col">
          <div className="inline-flex items-center justify-center h-[36px] px-4 bg-white rounded-full text-[15px] font-bold text-[#2B2622] self-start mb-4">
            About a minute
          </div>
          <h1 className="text-[40px] font-extrabold leading-[1.08] text-[#2B2622] tracking-tight">
            Let's make<br />RoCash yours
          </h1>
        </div>
      }
      footer={
        <div className="flex flex-col items-center">
          <Button
            variant="primary"
            onClick={() => navigate('/onboarding/step-1')}
          >
            Let's go
          </Button>
          <p className="mt-3 text-center text-[14px] font-medium text-[#8A837B]">
            You can change everything later.
          </p>
        </div>
      }
    >
      <div className="relative flex flex-col py-2">
        {/* Dotted connector lines */}
        <div className="absolute top-[52px] left-[30px] w-[3px] h-[64px] border-l-2 border-dashed border-[#E8E5E0] z-0" />
        <div className="absolute top-[152px] left-[30px] w-[3px] h-[64px] border-l-2 border-dashed border-[#E8E5E0] z-0" />

        {/* Step 1 */}
        <div className="relative z-10 h-[88px] flex items-center">
          <div className="w-[60px] h-[60px] rounded-full bg-[#FF8A1F] flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <div className="text-[19px] font-bold text-[#2B2622] leading-tight">Your name</div>
            <div className="text-[14px] font-medium text-[#8A837B] mt-1">So we can say hello</div>
          </div>
          <div className="h-[28px] px-3 bg-[#FFF1E4] rounded-full inline-flex items-center justify-center text-[13px] font-bold text-[#D96F0A] whitespace-nowrap">
            Start here
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative z-10 h-[88px] flex items-center mt-3">
          <div className="w-[60px] h-[60px] rounded-full bg-[#2DBE6C] flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <div className="text-[19px] font-bold text-[#2B2622] leading-tight">Your daily goal</div>
            <div className="text-[14px] font-medium text-[#8A837B] mt-1">One small amount to aim for</div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative z-10 h-[88px] flex items-center mt-3">
          <div className="w-[60px] h-[60px] rounded-full bg-[#3AA0FF] flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <div className="text-[19px] font-bold text-[#2B2622] leading-tight">Your categories</div>
            <div className="text-[14px] font-medium text-[#8A837B] mt-1">Transport, food, data and more</div>
          </div>
        </div>
      </div>
    </OrangeSheetLayout>
  );
};
