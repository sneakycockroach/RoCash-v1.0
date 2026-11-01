import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet.tsx';
import { Button } from './Button.tsx';
import { TextField } from './TextField.tsx';
import { createCategory, updateCategory } from '../api/categories.ts';
import type { Category } from '../types.ts';
import { bumpRefresh } from '../hooks/useData.tsx';

export interface NewCategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategories: Category[];
  initialCategory?: Category | null;
  onCategoryCreated?: (newCategory: Category) => void;
  onCategoryUpdated?: (updatedCategory: Category) => void;
}

import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  getCategoryIcon,
} from '../lib/categories.tsx';

export { CATEGORY_ICONS, CATEGORY_COLORS, getCategoryIcon };

export const NewCategorySheet: React.FC<NewCategorySheetProps> = ({
  isOpen,
  onClose,
  existingCategories,
  initialCategory,
  onCategoryCreated,
  onCategoryUpdated,
}) => {
  const isEditing = Boolean(initialCategory);

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('cart');
  const [selectedColor, setSelectedColor] = useState('#3AA0FF');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name || '');
      setSelectedIcon(initialCategory.icon || 'cart');
      setSelectedColor(initialCategory.color || '#3AA0FF');
    } else {
      setName('');
      setSelectedIcon('cart');
      setSelectedColor('#3AA0FF');
    }
    setError(null);
  }, [initialCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
      setError('Category name must be between 1 and 20 characters.');
      return;
    }

    if (!isEditing && existingCategories.length >= 30) {
      setError('Maximum limit of 30 categories reached.');
      return;
    }

    // Unique name check (case-insensitive among active categories, excluding self)
    const exists = existingCategories.some(
      c =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        !c.archived_at &&
        (!isEditing || c.id !== initialCategory?.id)
    );
    if (exists) {
      setError('A category with this name already exists.');
      return;
    }

    setLoading(true);

    if (isEditing && initialCategory) {
      const res = await updateCategory(initialCategory.id, {
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
      });

      setLoading(false);
      if (res.error || !res.data) {
        setError(res.error || 'Failed to update category.');
        return;
      }

      bumpRefresh();
      if (onCategoryUpdated) {
        onCategoryUpdated(res.data);
      }
      onClose();
    } else {
      const res = await createCategory({
        name: trimmed,
        icon: selectedIcon,
        color: selectedColor,
      });

      setLoading(false);
      if (res.error || !res.data) {
        setError(res.error || 'Failed to create category.');
        return;
      }

      bumpRefresh();
      if (onCategoryCreated) {
        onCategoryCreated(res.data);
      }
      setName('');
      setSelectedIcon('cart');
      setSelectedColor('#3AA0FF');
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit category' : 'New category'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
        {/* Name Input */}
        <div>
          <TextField
            label="Name"
            id="cat-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Groceries"
            maxLength={20}
            error={error}
            autoFocus
          />
        </div>

        {/* Icon Selection */}
        <div>
          <label className="text-[14px] font-bold text-[#2B2622] block mb-2">
            Icon
          </label>
          <div className="grid grid-cols-6 gap-2 max-h-[160px] overflow-y-auto p-1 bg-[#F7F4EF] rounded-[20px] border border-[#E8E5E0]">
            {CATEGORY_ICONS.map(item => {
              const isSelected = selectedIcon === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  aria-label={item.label}
                  className={`h-[48px] rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-white shadow-sm ring-2 ring-[#FF8A1F] text-[#2B2622]'
                      : 'text-[#8A837B] hover:text-[#2B2622] hover:bg-white/50'
                  }`}
                >
                  {item.svg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="text-[14px] font-bold text-[#2B2622] block mb-2">
            Color <span className="font-normal text-[#8A837B] text-xs">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            {CATEGORY_COLORS.map(color => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select color ${color}`}
                  style={{ backgroundColor: color }}
                  className={`w-[36px] h-[36px] rounded-full transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'ring-[3px] ring-[#2B2622] ring-offset-[3px] ring-offset-white'
                      : 'border border-black/10'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-[12px] text-[#8A837B] mt-2">
            Colors help you spot categories in charts.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={name.trim().length === 0}
          >
            {isEditing ? 'Save changes' : 'Save category'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
