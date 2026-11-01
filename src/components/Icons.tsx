import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const CloudCheckIcon: React.FC<IconProps> = ({ size = 22, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.3"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    <polyline points="10 13 12 15 16 11" />
  </svg>
);

export const UserOutlineIcon: React.FC<IconProps> = ({ size = 22, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.3"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const WalletIcon: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.3"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <rect height="14" rx="3" width="20" x="2" y="5" />
    <path d="M16 12h.01" />
    <path d="M2 10h20" />
  </svg>
);

export const CoinTargetIcon: React.FC<IconProps> = ({ size = 16, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M16 11c0-.55-.45-1-1-1h-1.5a1.5 1.5 0 0 1 0-3H15" />
    <path d="M8 12h8" />
    <path d="M10 16h4" />
  </svg>
);

export const FlameFilledIcon: React.FC<IconProps & { fill?: string }> = ({
  size = 20,
  fill = '#F2542D',
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    className={className}
    {...props}
  >
    <path d="M12 23c-4.97 0-9-3.92-9-8.75 0-3.69 2.49-7.38 5.4-9.82.59-.5 1.47-.07 1.47.71 0 1.95 1.05 3.36 2.13 3.36.98 0 1.54-.85 1.25-2.07-.46-1.92.51-4.14 2.25-5.32.61-.41 1.43.08 1.34.81-.39 3.09 1.13 5.4 2.76 7.08 2.06 2.12 3.4 4.8 3.4 7.5 0 4.83-4.03 8.75-9 8.75z" />
  </svg>
);

export const FlameOutlineIcon: React.FC<IconProps & { stroke?: string }> = ({
  size = 22,
  stroke = '#CFC9C0',
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 22c-4.42 0-8-3.47-8-7.75 0-3.27 2.21-6.54 4.8-8.71.52-.44 1.3-.06 1.3.63 0 1.73.93 2.98 1.9 2.98.87 0 1.37-.75 1.11-1.84-.41-1.7.45-3.67 2-4.71.54-.36 1.27.07 1.19.72-.35 2.74 1 4.79 2.45 6.28 1.83 1.88 3.02 4.25 3.02 6.65 0 4.28-3.58 7.75-8 7.75z" />
  </svg>
);

export const ReceiptBillIcon: React.FC<IconProps> = ({ size = 30, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <line x1="8" x2="16" y1="8" y2="8" />
    <line x1="8" x2="16" y1="12" y2="12" />
    <line x1="8" x2="13" y1="16" y2="16" />
  </svg>
);

export const ButtonPlusDarkIcon: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);

export const ButtonPlusGreenIcon: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2DBE6C"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);

export const CloudSlashOfflineIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2B2622"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0-4 7h1.4a5 5 0 0 0 8.6 3" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export const CloudExclamationErrorIcon: React.FC<IconProps> = ({
  size = 24,
  className = '',
  ...props
}) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    <line x1="12" x2="12" y1="11" y2="14" />
    <line strokeWidth="3" x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

export const HeroErrorCloudIcon: React.FC<IconProps> = ({
  size = 44,
  className = '',
  ...props
}) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    <line x1="12" x2="12" y1="10" y2="13.5" />
    <line strokeWidth="3" x1="12" x2="12.01" y1="16.5" y2="16.5" />
  </svg>
);

export const TryAgainRefreshIcon: React.FC<IconProps> = ({
  size = 20,
  className = '',
  ...props
}) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

export const ClockPendingIcon: React.FC<IconProps> = ({ size = 14, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8A837B"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const NavHomeIcon: React.FC<IconProps> = ({ size = 22, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const NavHistoryIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#8A837B"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const NavPlusIcon: React.FC<IconProps> = ({ size = 28, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#2B2622"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="3.2"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);

export const NavReportsIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#8A837B"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <line x1="18" x2="18" y1="20" y2="10" />
    <line x1="12" x2="12" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="14" />
  </svg>
);

export const NavRewardsIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    fill="none"
    height={size}
    width={size}
    stroke="#8A837B"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

// Backward compatibility aliases
export const FlameIcon = FlameFilledIcon;
export const SyncIcon = CloudCheckIcon;
