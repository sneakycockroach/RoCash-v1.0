import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2B2622]/55"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative w-full max-w-[430px] mx-auto bg-white rounded-t-[32px] px-6 pt-3 pb-8 z-50 max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl"
          >
            {/* 1. Drag handle */}
            <div className="w-[40px] h-[5px] rounded-full bg-[#E8E5E0] mx-auto mb-3 shrink-0" />

            {/* 2. Sheet header row */}
            <div className="flex items-center justify-between h-[44px] mb-4 shrink-0">
              <h2 className="text-[24px] font-extrabold text-[#2B2622] tracking-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-[36px] h-[36px] rounded-full bg-[#F7F4EF] hover:bg-[#EFEBE5] flex items-center justify-center border-none cursor-pointer transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2B2622"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
