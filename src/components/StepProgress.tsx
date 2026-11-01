import React from 'react';

export interface StepProgressProps {
  currentStep: number; // 1, 2, or 3
  totalSteps?: number; // default 3
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps = 3,
  className = '',
}) => {
  return (
    <div
      className={`flex-1 flex items-center gap-2 h-2 ${className}`}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isFilled = stepNum <= currentStep;
        return (
          <div
            key={stepNum}
            className={`flex-1 h-2 rounded-full transition-colors duration-200 ${
              isFilled ? 'bg-[#2B2622]' : 'bg-[#2B2622]/20'
            }`}
          />
        );
      })}
    </div>
  );
};
