import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'green' | 'neutral' | 'danger';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-extrabold text-[17px] rounded-full transition-all duration-75 select-none focus:outline-none cursor-pointer';
  const widthClass = fullWidth ? 'w-full' : '';
  const heightClass = 'h-[56px]';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-[#FF8A1F] text-[#2B2622] border-b-[4px] border-[#D96F0A] active:translate-y-[2px] active:border-b-[2px] disabled:opacity-50 disabled:pointer-events-none';
      break;
    case 'secondary':
      variantClasses =
        'bg-white text-[#2B2622] border-2 border-[#E8E5E0] active:bg-[#FAF9F7] active:border-[#D6D2CB] disabled:opacity-50 disabled:pointer-events-none';
      break;
    case 'green':
      variantClasses =
        'bg-[#2DBE6C] text-white border-b-[4px] border-[#1F9A52] active:translate-y-[2px] active:border-b-[2px] disabled:opacity-50 disabled:pointer-events-none';
      break;
    case 'neutral':
      variantClasses =
        'bg-[#F7F4EF] text-[#2B2622] border-b-[4px] border-[#E8E5E0] active:translate-y-[2px] active:border-b-[2px] disabled:opacity-50 disabled:pointer-events-none';
      break;
    case 'danger':
      variantClasses =
        'bg-[#D9383A] text-white border-b-[4px] border-[#B32628] active:translate-y-[2px] active:border-b-[2px] disabled:opacity-50 disabled:pointer-events-none';
      break;
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${widthClass} ${heightClass} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
