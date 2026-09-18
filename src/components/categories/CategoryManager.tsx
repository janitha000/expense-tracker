"use client";

import React, { useState } from "react";
import { Category } from "@/lib/types";
import { AVAILABLE_ICONS, COLOR_PALETTE } from "@/lib/constants";
import { categorySchema, CategoryFormData } from "@/lib/validators";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Search,
  Check,
  X,
  Palette,
  Tag,
  AlertCircle,
} from "lucide-react";

interface CategoryManagerProps {
  categories: Category[];
  onCreateCategory: (data: CategoryFormData) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function CategoryManager({
  categories,
  onCreateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("ShoppingBag");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [iconSearch, setIconSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawData = {
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
    };

    const validation = categorySchema.safeParse(rawData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateCategory(validation.data);
      setName("");
      setSelectedIcon("ShoppingBag");
      setSelectedColor(COLOR_PALETTE[0]);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom category? Associated expenses will also be removed.")) {
      return;
    }
    try {
      setDeletingId(id);
      await onDeleteCategory(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Add Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-400" />
            Category Management
          </h2>
          <p className="text-xs text-slate-400">
            {categories.length} categories available (seeded defaults & custom)
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md backdrop-blur-sm transition-all hover:border-slate-700"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                style={{ backgroundColor: cat.color }}
              >
                <DynamicIcon name={cat.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{cat.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {cat.isCustom ? (
                    <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-400 border border-purple-500/20">
                      Custom
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                      <Lock className="h-2.5 w-2.5" /> Default
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">{cat.color}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div>
              {cat.isCustom ? (
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="rounded-xl p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <div className="p-2 text-slate-600" title="Default category is locked">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/40">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Create Custom Category
                </h3>
                <p className="text-xs text-slate-400">Add an icon and color badge</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-5 space-y-5">
              {errors.form && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Live Preview Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-all"
                  style={{ backgroundColor: selectedColor }}
                >
                  <DynamicIcon name={selectedIcon} className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Live Preview
                  </span>
                  <div className="text-sm font-bold text-white">
                    {name || "Category Name"}
                  </div>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Subscriptions, Pet Care, Fitness..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>Badge Color</span>
                  <span className="font-mono text-slate-400 text-[11px]">{selectedColor}</span>
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_PALETTE.map((hex) => {
                    const isSelected = selectedColor.toLowerCase() === hex.toLowerCase();
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setSelectedColor(hex)}
                        className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-lg"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Choose Icon
                  </label>
                  <span className="text-[11px] text-slate-400">{selectedIcon}</span>
                </div>

                {/* Search icons */}
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search icons (e.g. coffee, plane, gift)..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Icon Grid */}
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1.5 rounded-xl border border-slate-800/80 bg-slate-950/50">
                  {filteredIcons.map((iconName) => {
                    const isSelected = selectedIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400"
                            : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                        title={iconName}
                      >
                        <DynamicIcon name={iconName} className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-emerald-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
