import React from 'react';
import { motion } from 'framer-motion';

export interface OrangeSheetLayoutProps {
  onBack?: () => void;
  topSlot?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerChildren?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  sheetClassName?: string;
}

export const OrangeSheetLayout: React.FC<OrangeSheetLayoutProps> = ({
  onBack,
  topSlot,
  title,
  subtitle,
  headerChildren,
  children,
  footer,
  className = '',
  sheetClassName = '',
}) => {
  return (
    <div
      className={`min-h-screen max-w-[430px] mx-auto bg-[#FF8A1F] relative flex flex-col justify-between overflow-x-hidden ${className}`}
    >
      {/* Orange Header Area */}
      <header className="w-full px-6 pt-12 pb-6 z-10 flex flex-col select-none">
        {/* Top Nav Row */}
        {(onBack || topSlot) && (
          <div className="flex items-center gap-3 w-full mb-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center shrink-0 border-none cursor-pointer active:scale-95 transition-transform shadow-none"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2B2622"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
            {topSlot && <div className="flex-1 flex items-center">{topSlot}</div>}
          </div>
        )}

        {/* Title & Subtitle or Custom Header Content */}
        {headerChildren ? (
          headerChildren
        ) : (
          <div className="flex flex-col">
            {title && (
              <h1 className="text-[36px] font-extrabold leading-[1.08] text-[#2B2622] tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-[16px] font-medium text-[#2B2622]/80 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </header>

      {/* White Sheet running to bottom edge */}
      <motion.main
        initial={{ y: 20, opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`w-full bg-white rounded-t-[32px] px-6 pt-7 pb-8 flex-1 flex flex-col justify-between z-20 ${sheetClassName}`}
      >
        <div className="flex-1 flex flex-col">{children}</div>
        {footer && <div className="mt-6 w-full flex flex-col">{footer}</div>}
      </motion.main>
    </div>
  );
};
