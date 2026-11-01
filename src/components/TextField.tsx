import React, { useState } from 'react';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
  hint?: string | null;
  isPassword?: boolean;
  rightSlot?: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled,
  isPassword = false,
  rightSlot,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <label htmlFor={id} className="text-[14px] font-bold text-[#2B2622] mb-2 select-none">
        {label}
      </label>

      <div
        className={`h-[56px] rounded-[16px] px-4 flex items-center justify-between transition-colors ${
          disabled ? 'bg-[#EFEBE5] opacity-70 cursor-not-allowed' : 'bg-[#F7F4EF]'
        } border-2 ${
          error
            ? 'border-[#FF4B4B] bg-red-50/40'
            : 'border-[#E8E5E0] focus-within:border-[#FF8A1F] focus-within:bg-white'
        }`}
      >
        <input
          id={id}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-[16px] font-medium text-[#2B2622] placeholder-[#8A837B] outline-none border-none p-0"
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
            className="text-[#8A837B] hover:text-[#2B2622] transition-colors p-1 flex items-center justify-center focus:outline-none"
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        )}

        {rightSlot && !isPassword && rightSlot}
      </div>

      {error ? (
        <span className="text-[13px] font-bold text-[#FF4B4B] mt-1.5 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </span>
      ) : hint ? (
        <span className="text-[13px] font-medium text-[#8A837B] mt-1.5">{hint}</span>
      ) : null}
    </div>
  );
};
