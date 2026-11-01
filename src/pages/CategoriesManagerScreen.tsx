import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import {
  listCategories,
  reorderCategories,
  archiveCategory,
  updateCategory,
} from '../api/categories.ts';
import { category_breakdown } from '../api/rpc.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import { todayLocal, parts, daysInMonth } from '../lib/date.ts';
import { useAuth } from '../auth/AuthProvider.tsx';
import { getCategoryIcon } from '../lib/categories.tsx';
import { NewCategorySheet } from '../components/NewCategorySheet.tsx';
import { BottomSheet } from '../components/BottomSheet.tsx';
import { useAppShell } from '../components/AppShell.tsx';
import type { Category } from '../types.ts';

export const CategoriesManagerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useAppShell();

  const userTimezone = profile?.timezone || 'Africa/Kampala';
  const todayStr = todayLocal(userTimezone);
  const { year, month } = parts(todayStr);

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = daysInMonth(year, month);
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Queries
  const categoriesQuery = useData(
    () => listCategories({ includeArchived: true }),
    []
  );
  const allCategories = categoriesQuery.data || [];

  const breakdownQuery = useData(
    () => category_breakdown(monthStart, monthEnd),
    [monthStart, monthEnd]
  );
  const breakdownRows = breakdownQuery.data || [];

  const entriesMap = useMemo(() => {
    const map = new Map<string, number>();
    breakdownRows.forEach(r => {
      map.set(r.category_id, r.entries || 0);
    });
    return map;
  }, [breakdownRows]);

  // Split into active and archived
  const activeCategories = useMemo(
    () => allCategories.filter(c => !c.archived_at),
    [allCategories]
  );

  const archivedCategories = useMemo(
    () => allCategories.filter(c => Boolean(c.archived_at)),
    [allCategories]
  );

  // Local state for reordering
  const [items, setItems] = useState<Category[]>([]);
  React.useEffect(() => {
    setItems(activeCategories);
  }, [activeCategories]);

  // Sheets state
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isArchivedSheetOpen, setIsArchivedSheetOpen] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState<Category | null>(null);

  // Handle reorder
  const handleReorder = async (newOrder: Category[]) => {
    setItems(newOrder);
    const ids = newOrder.map(c => c.id);
    const res = await reorderCategories(ids);
    if (res.error) {
      showToast('Could not save category order', 'error');
    }
  };

  // Archive category
  const handleArchive = async (cat: Category) => {
    setActiveMenuCategory(null);
    if (activeCategories.length <= 1) {
      showToast('You must keep at least one active category', 'error');
      return;
    }

    const res = await archiveCategory(cat.id);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      bumpRefresh();
      showToast(`Archived "${cat.name}"`, 'success');
    }
  };

  // Restore category
  const handleRestore = async (cat: Category) => {
    if (activeCategories.length >= 30) {
      showToast('Cannot restore: 30 categories limit reached', 'error');
      return;
    }

    const res = await updateCategory(cat.id, { archived_at: null });
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      bumpRefresh();
      showToast(`Restored "${cat.name}"`, 'success');
    }
  };

  const isLoading = categoriesQuery.loading;

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-12">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-[#E8E5E0] bg-white sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Back to profile"
            className="w-9 h-9 rounded-full bg-[#F7F4EF] border border-[#E8E5E0] flex items-center justify-center text-[#2B2622] hover:bg-[#FFF1E4] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[24px] font-extrabold text-[#2B2622] tracking-tight leading-tight">
              Categories
            </h1>
            <p className="text-[12px] font-medium text-[#8A837B]">
              Drag to reorder · {activeCategories.length} of 30
            </p>
          </div>
        </div>

        {/* Top + Button */}
        <button
          type="button"
          onClick={() => {
            if (activeCategories.length >= 30) {
              showToast('Maximum of 30 categories reached', 'error');
            } else {
              setIsAddSheetOpen(true);
            }
          }}
          disabled={activeCategories.length >= 30}
          aria-label="Add category"
          className="w-9 h-9 rounded-full bg-[#FF8A1F] border-b-[3px] border-[#D96F0A] flex items-center justify-center text-[#2B2622] disabled:opacity-40 cursor-pointer shadow-xs active:translate-y-0.5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="px-5 py-5 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-[22px] bg-[#F7F4EF] border border-[#E8E5E0]" />
            ))}
          </div>
        ) : (
          <>
            {/* Reorderable List */}
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={handleReorder}
              className="flex flex-col gap-2.5"
            >
              {items.map(cat => {
                const count = entriesMap.get(cat.id) ?? 0;
                const countText =
                  count > 0 ? `${count} ${count === 1 ? 'entry' : 'entries'} this month` : 'No entries this month';

                return (
                  <Reorder.Item
                    key={cat.id}
                    value={cat}
                    className="w-full rounded-[22px] bg-white border-2 border-[#E8E5E0] p-3.5 flex items-center justify-between shadow-2xs hover:border-[#D9D4CC] transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing text-[#8A837B] p-1 -ml-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="9" cy="6" r="2" />
                          <circle cx="15" cy="6" r="2" />
                          <circle cx="9" cy="12" r="2" />
                          <circle cx="15" cy="12" r="2" />
                          <circle cx="9" cy="18" r="2" />
                          <circle cx="15" cy="18" r="2" />
                        </svg>
                      </div>

                      {/* Category Icon */}
                      <div
                        style={{
                          backgroundColor: `${cat.color || '#FF8A1F'}20`,
                          color: cat.color || '#FF8A1F',
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-black/5"
                      >
                        {getCategoryIcon(cat.icon, 20)}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-extrabold text-[#2B2622] truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] font-medium text-[#8A837B]">
                          {countText}
                        </span>
                      </div>
                    </div>

                    {/* 3-Dot Menu Button */}
                    <button
                      type="button"
                      onClick={() => setActiveMenuCategory(cat)}
                      aria-label="Category actions"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A837B] hover:text-[#2B2622] hover:bg-[#F7F4EF] cursor-pointer transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {/* Add Category Button */}
            <button
              type="button"
              onClick={() => {
                if (activeCategories.length >= 30) {
                  showToast('Maximum of 30 categories reached', 'error');
                } else {
                  setIsAddSheetOpen(true);
                }
              }}
              disabled={activeCategories.length >= 30}
              className="w-full h-[52px] rounded-full bg-[#F7F4EF] border-2 border-dashed border-[#D9D4CC] flex items-center justify-center gap-2 text-[14px] font-extrabold text-[#2B2622] hover:bg-[#FFF1E4] hover:border-[#FF8A1F] transition-all cursor-pointer mt-1"
            >
              <span className="text-[#FF8A1F] text-[18px] font-bold">+</span>
              <span>Add category</span>
            </button>

            {/* Archived Categories Row (if any) */}
            {archivedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setIsArchivedSheetOpen(true)}
                className="w-full p-4 rounded-[22px] bg-[#F7F4EF] border border-[#E8E5E0] flex items-center justify-between text-left hover:bg-[#FFF1E4] transition-colors cursor-pointer mt-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[16px]">📦</span>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-extrabold text-[#2B2622]">
                      Archived categories
                    </span>
                    <span className="text-[11px] font-medium text-[#8A837B]">
                      {archivedCategories.length} {archivedCategories.length === 1 ? 'category' : 'categories'}
                    </span>
                  </div>
                </div>
                <span className="text-[#8A837B] text-[14px] font-bold">›</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* 3-Dot Actions Sheet */}
      <BottomSheet
        isOpen={activeMenuCategory !== null}
        onClose={() => setActiveMenuCategory(null)}
        title={activeMenuCategory?.name || 'Category Options'}
      >
        {activeMenuCategory && (
          <div className="flex flex-col gap-2 pt-1 pb-3">
            <button
              type="button"
              onClick={() => {
                setEditingCategory(activeMenuCategory);
                setActiveMenuCategory(null);
              }}
              className="w-full p-3.5 rounded-xl flex items-center gap-3 text-left font-bold text-[14px] text-[#2B2622] hover:bg-[#F7F4EF] transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              <span>Edit name, icon & color</span>
            </button>

            <button
              type="button"
              onClick={() => handleArchive(activeMenuCategory)}
              disabled={activeCategories.length <= 1}
              className="w-full p-3.5 rounded-xl flex items-center gap-3 text-left font-bold text-[14px] text-[#D9383A] hover:bg-[#FFF1E4] disabled:opacity-40 cursor-pointer transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 8h10" />
                <path d="M10 12h4" />
              </svg>
              <span>Archive category</span>
            </button>
          </div>
        )}
      </BottomSheet>

      {/* New Category Sheet */}
      <NewCategorySheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        existingCategories={activeCategories}
        onCategoryCreated={newCat => {
          showToast(`Created category "${newCat.name}"`, 'success');
        }}
      />

      {/* Edit Category Sheet */}
      <NewCategorySheet
        isOpen={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        existingCategories={activeCategories}
        initialCategory={editingCategory}
        onCategoryUpdated={updatedCat => {
          showToast(`Updated "${updatedCat.name}"`, 'success');
        }}
      />

      {/* Archived Categories Sheet */}
      <BottomSheet
        isOpen={isArchivedSheetOpen}
        onClose={() => setIsArchivedSheetOpen(false)}
        title="Archived Categories"
      >
        <div className="flex flex-col gap-2.5 pt-1 pb-4 max-h-[380px] overflow-y-auto">
          {archivedCategories.map(cat => (
            <div
              key={cat.id}
              className="p-3 rounded-2xl bg-[#F7F4EF] border border-[#E8E5E0] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    backgroundColor: `${cat.color || '#FF8A1F'}20`,
                    color: cat.color || '#FF8A1F',
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                >
                  {getCategoryIcon(cat.icon, 18)}
                </div>
                <span className="text-[14px] font-bold text-[#2B2622]">
                  {cat.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleRestore(cat)}
                className="px-3 py-1.5 rounded-full bg-white border border-[#E8E5E0] text-[12px] font-extrabold text-[#2DBE6C] hover:bg-[#E6F7EE] transition-colors cursor-pointer"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
