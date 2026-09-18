"use client";

import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  getDay,
  parseISO,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface InlineDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateString: string) => void;
  label?: string;
}

export function InlineDatePicker({ value, onChange }: InlineDatePickerProps) {
  const selectedDate = value ? parseISO(value) : new Date();
  const validSelectedDate = isNaN(selectedDate.getTime()) ? new Date() : selectedDate;
  const [viewMonth, setViewMonth] = useState<Date>(validSelectedDate);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    onChange(formatted);
  };

  const handlePrevMonth = () => setViewMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setViewMonth((prev) => addMonths(prev, 1));

  const setShortcut = (type: "today" | "yesterday") => {
    const d = type === "today" ? new Date() : subDays(new Date(), 1);
    setViewMonth(d);
    onChange(format(d, "yyyy-MM-dd"));
  };

  const weekDayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 space-y-2.5 transition-colors">
      {/* Top Controls: Shortcuts & Month Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShortcut("today")}
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setShortcut("yesterday")}
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            Yesterday
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 dark:text-white min-w-[85px] text-center">
            {format(viewMonth, "MMM yyyy")}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDayLabels.map((wd, i) => (
          <span key={i} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            {wd}
          </span>
        ))}
      </div>

      {/* Days Grid - Instant 1-touch Selection (No OK button needed) */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for leading days */}
        {Array.from({ length: startDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-8" />
        ))}

        {daysInMonth.map((day) => {
          const isSelected = isSameDay(day, validSelectedDate);
          const isCurrentToday = isToday(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleSelectDay(day)}
              className={`h-8 w-full rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                isSelected
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30"
                  : isCurrentToday
                  ? "border border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 border border-transparent"
              }`}
            >
              <span>{format(day, "d")}</span>
              {isCurrentToday && !isSelected && (
                <span className="h-1 w-1 rounded-full bg-blue-500 absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary Pill */}
      <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800/80 pt-2 text-[11px]">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <CalendarIcon className="h-3 w-3 text-blue-500" />
          <span>Selected:</span>
        </span>
        <span className="font-bold text-blue-600 dark:text-blue-400">
          {format(validSelectedDate, "EEE, MMM d, yyyy")}
        </span>
      </div>
    </div>
  );
}
