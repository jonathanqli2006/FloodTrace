"use client";

import React, { useState } from "react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface CalendarProps {
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  initialYear: number;
  initialMonth: number;
}

export default function Calendar({
  availableDates,
  selectedDate,
  onSelectDate,
  initialYear,
  initialMonth,
}: CalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: React.ReactNode[] = [];

  // Day headers
  DAYS.forEach(d => (
    cells.push(
      <div key={`h-${d}`} className="text-center font-mono text-[9px] text-[#b8b8b8] pb-1 pt-0.5">
        {d}
      </div>
    )
  ));

  // Empty cells
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} />);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const hasData = availableDates.has(dateStr);
    const isSelected = dateStr === selectedDate;

    cells.push(
      <button
        key={dateStr}
        disabled={!hasData}
        onClick={() => hasData && onSelectDate(dateStr)}
        className={[
          "aspect-square flex items-center justify-center rounded font-mono text-[11px] transition-all",
          isSelected
            ? "bg-[#2d7d6f] text-white font-semibold"
            : hasData
            ? "bg-[rgba(45,125,111,0.1)] text-[#1a1a1a] font-medium hover:bg-[rgba(45,125,111,0.2)] hover:text-[#2d7d6f] cursor-pointer"
            : "text-[#b8b8b8] cursor-default",
        ].join(" ")}
      >
        {d}
      </button>
    );
  }

  return (
    <div>
      {/* Nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#e2ddd8] text-[#8a8a8a] hover:border-[#2d7d6f] hover:text-[#2d7d6f] hover:bg-[rgba(45,125,111,0.05)] transition-all text-base"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-[#1a1a1a]">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#e2ddd8] text-[#8a8a8a] hover:border-[#2d7d6f] hover:text-[#2d7d6f] hover:bg-[rgba(45,125,111,0.05)] transition-all text-base"
        >
          ›
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>

      {/* Selected label */}
      <div className="mt-3 font-mono text-[11px] text-[#2d7d6f] font-medium text-center min-h-[16px]">
        {selectedDate ?? "Select a date"}
      </div>
    </div>
  );
}
