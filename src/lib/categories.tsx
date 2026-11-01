import React from 'react';

export interface CategoryIconDef {
  id: string;
  label: string;
  svg: (size?: number, className?: string) => React.ReactNode;
}

/**
 * CATEGORY_ICONS contains exactly the keys stored in the database:
 * bus, phone, utensils, dots, grid,
 * plus the 18 keys used by NewCategorySheet.
 * Unknown keys fall back to "grid".
 */
export const CATEGORY_ICONS_LIST: CategoryIconDef[] = [
  // Database defaults & common keys
  {
    id: 'bus',
    label: 'Bus / Transport',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <rect x="3" y="3" width="18" height="15" rx="3" />
        <path d="M3 10h18" />
        <circle cx="7" cy="15" r="1" />
        <circle cx="17" cy="15" r="1" />
        <path d="m4 18-2 3" />
        <path d="m20 18 2 3" />
      </svg>
    ),
  },
  {
    id: 'phone',
    label: 'Phone / Airtime',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'utensils',
    label: 'Food / Dining',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M18 2v20" />
        <path d="M18 7a4 4 0 0 1-4-4V2" />
        <path d="M6 2v7a3 3 0 0 0 6 0V2" />
        <path d="M9 12v10" />
      </svg>
    ),
  },
  {
    id: 'dots',
    label: 'Other / Dots',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
        <circle cx="5" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'grid',
    label: 'General / Grid',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  // 18 NewCategorySheet options
  {
    id: 'cart',
    label: 'Groceries / Cart',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: 'fork_knife',
    label: 'Dining / Food',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M18 2v20" />
        <path d="M18 7a4 4 0 0 1-4-4V2" />
        <path d="M6 2v7a3 3 0 0 0 6 0V2" />
        <path d="M9 12v10" />
      </svg>
    ),
  },
  {
    id: 'shopping_bag',
    label: 'Shopping',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    id: 'gift',
    label: 'Gift',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    id: 'book',
    label: 'Education / Book',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: 'car',
    label: 'Transport / Car',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    id: 'coffee',
    label: 'Coffee / Drinks',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    id: 'gamepad',
    label: 'Entertainment / Games',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <rect x="2" y="6" width="20" height="12" rx="6" />
        <path d="M6 12h4m-2-2v4" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
        <circle cx="17" cy="13" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'paw',
    label: 'Pets',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="12" cy="15" r="3.5" />
        <circle cx="7.5" cy="10" r="2" />
        <circle cx="16.5" cy="10" r="2" />
        <circle cx="10" cy="6" r="1.8" />
        <circle cx="14" cy="6" r="1.8" />
      </svg>
    ),
  },
  {
    id: 'plane',
    label: 'Travel',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    id: 'wrench',
    label: 'Repairs / Maintenance',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'music',
    label: 'Music',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: 'shirt',
    label: 'Clothing',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
  {
    id: 'scissors',
    label: 'Grooming',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'bank',
    label: 'Bank / Finance',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <line x1="3" y1="21" x2="21" y2="21" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="12 3 2 10 22 10" />
        <line x1="6" y1="10" x2="6" y2="21" />
        <line x1="10" y1="10" x2="10" y2="21" />
        <line x1="14" y1="10" x2="14" y2="21" />
        <line x1="18" y1="10" x2="18" y2="21" />
      </svg>
    ),
  },
  {
    id: 'tv',
    label: 'Subscriptions / TV',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    ),
  },
  {
    id: 'bike',
    label: 'Boda / Bicycle',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 9l4-3 3 5.5h2.5" />
      </svg>
    ),
  },
  {
    id: 'heart',
    label: 'Health / Medical',
    svg: (size = 22, cls = '') => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
];

export const CATEGORY_ICONS = CATEGORY_ICONS_LIST.map(item => ({
  id: item.id,
  label: item.label,
  svg: item.svg(24),
}));

export const CATEGORY_COLORS = [
  '#FF8A1F',
  '#2DBE6C',
  '#3AA0FF',
  '#FFC93C',
  '#F2542D',
  '#B58CFF',
  '#D9D4CC',
];

export const CATEGORY_ICONS_MAP: Record<string, CategoryIconDef> = CATEGORY_ICONS_LIST.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, CategoryIconDef>
);

/**
 * Returns an SVG element for the given icon key.
 * Unknown keys fall back to "grid".
 */
export function getCategoryIcon(iconKey: string, size = 20, className = ''): React.ReactNode {
  const match = CATEGORY_ICONS_MAP[iconKey] || CATEGORY_ICONS_MAP['grid'];
  return match.svg(size, className);
}


