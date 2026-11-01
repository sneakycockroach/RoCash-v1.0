import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCategories, archiveCategory, updateCategory } from '../api/categories.ts';
import { useData, bumpRefresh } from '../hooks/useData.tsx';
import { OrangeSheetLayout } from '../components/OrangeSheetLayout.tsx';
import { StepProgress } from '../components/StepProgress.tsx';
import { Button } from '../components/Button.tsx';
import { NewCategorySheet, CATEGORY_ICONS } from '../components/NewCategorySheet.tsx';
import type { Category } from '../types.ts';

export const OnboardingStep3: React.FC = () => {
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categoriesQuery = useData(() => listCategories({ includeArchived: true }), []);
  const allCategories = categoriesQuery.data || [];

  const activeCategories = allCategories.filter(c => !c.archived_at);
  const selectedCount = activeCategories.length;

  const handleToggleCategory = async (cat: Category) => {
    setErrorMsg(null);
    const isCurrentlyActive = !cat.archived_at;

    // Rule: at least one must stay selected (otherwise Continue is disabled)
    if (isCurrentlyActive && selectedCount <= 1) {
      setErrorMsg('At least one category must stay selected.');
      return;
    }

    setActionLoading(true);
    if (isCurrentlyActive) {
      // Archive it
      await archiveCategory(cat.id);
    } else {
      // Reselect: clear archived_at
      await updateCategory(cat.id, { archived_at: null });
    }
    bumpRefresh();
    setActionLoading(false);
  };

  const getCategoryIconSvg = (iconName: string) => {
    const matched = CATEGORY_ICONS.find(i => i.id === iconName);
    if (matched) return matched.svg;

    // Fallback icon based on common names
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    );
  };

  return (
    <OrangeSheetLayout
      onBack={() => navigate('/onboarding/step-2')}
      topSlot={<StepProgress currentStep={3} />}
      title="Your daily spending"
      subtitle="These are the things you spend on most days. Keep what you use, and add your own."
      footer={
        <div className="flex flex-col items-center">
          <Button
            variant="primary"
            onClick={() => navigate('/onboarding/all-set')}
            disabled={selectedCount < 1 || actionLoading}
          >
            Continue
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-[#FF4B4B]/30 rounded-xl text-[#FF4B4B] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Selected Counter & Add Category trigger */}
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-[#8A837B]">
            <span className="text-[#2B2622]">{selectedCount}</span> selected
          </span>

          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#D96F0A] hover:underline cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add your own</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
          {allCategories.map(cat => {
            const isSelected = !cat.archived_at;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat)}
                className={`p-4 rounded-[20px] border-2 transition-all text-left flex flex-col justify-between h-[105px] cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF1E4] border-[#FF8A1F] shadow-xs'
                    : 'bg-[#F7F4EF] border-[#E8E5E0] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color || '#FF8A1F', color: '#2B2622' }}
                  >
                    {getCategoryIconSvg(cat.icon)}
                  </div>

                  {/* Selection Checkmark Indicator */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isSelected
                        ? 'bg-[#FF8A1F] border-[#D96F0A] text-[#2B2622]'
                        : 'bg-white border-[#E8E5E0]'
                    }`}
                  >
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B2622" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>

                <div className="text-[15px] font-extrabold text-[#2B2622] truncate">
                  {cat.name}
                </div>
              </button>
            );
          })}
        </div>

        {allCategories.length === 0 && !categoriesQuery.loading && (
          <div className="p-6 text-center text-sm font-medium text-[#8A837B] bg-[#F7F4EF] rounded-2xl border border-[#E8E5E0]">
            No categories found. Click "Add your own" to create one.
          </div>
        )}
      </div>

      {/* Reusable Bottom Sheet for New Category */}
      <NewCategorySheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        existingCategories={allCategories}
        onCategoryCreated={() => {
          bumpRefresh();
        }}
      />
    </OrangeSheetLayout>
  );
};
