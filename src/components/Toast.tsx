import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastProps {
  message: string | null;
  type?: 'error' | 'success';
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  onClose,
  duration = 4000,
  action,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 left-4 right-4 max-w-[400px] mx-auto z-50 pointer-events-auto"
        >
          <div
            className={`p-3.5 rounded-[18px] border shadow-md flex items-center justify-between gap-3 ${
              type === 'error'
                ? 'bg-red-50 border-[#FF4B4B]/30 text-[#FF4B4B]'
                : 'bg-green-50 border-[#2DBE6C]/30 text-[#2DBE6C]'
            }`}
          >
            <div className="flex items-center gap-2 text-[14px] font-bold flex-1 min-w-0">
              {type === 'error' ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
              <span className="truncate">{message}</span>
            </div>
            {action && (
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-xs font-extrabold uppercase tracking-wide text-[#2B2622] border border-black/10 shrink-0 cursor-pointer transition-colors"
              >
                {action.label}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-current opacity-70 hover:opacity-100 p-1 shrink-0 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
