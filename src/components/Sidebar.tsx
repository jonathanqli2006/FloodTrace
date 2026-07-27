"use client";

import Calendar from "./Calendar";

interface SidebarProps {
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  status: string;
  progress: number;
  initialYear: number;
  initialMonth: number;
}

const CLASSES = [
  { color: "rgba(21,101,192,0.88)", label: "Pre-event Water" },
  { color: "rgba(198,40,40,0.92)", label: "Flood Inundation" },
  { color: "transparent", label: "Scene coverage", border: true },
];

export default function Sidebar({
  availableDates,
  selectedDate,
  onSelectDate,
  status,
  progress,
  initialYear,
  initialMonth,
}: SidebarProps) {
  return (
    <aside className="w-[300px] flex-shrink-0 bg-white border-r border-[#e2ddd8] flex flex-col shadow-[2px_0_12px_rgba(0,0,0,0.04)] relative z-10">
      {/* Progress strip */}
      <div
        className="h-[3px] bg-[#2d7d6f] transition-all duration-500 flex-shrink-0"
        style={{ width: `${progress}%` }}
      />

      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[#e2ddd8]">
          <div className="text-[20px] font-semibold tracking-[-0.4px] text-[#1a1a1a] mb-1">
            FloodTrace
          </div>
          <div className="font-mono text-[10px] text-[#8a8a8a] tracking-[0.04em]">
            Sentinel-1 SAR · Flood Detection
          </div>
        </div>

        {/* Calendar */}
        <div className="px-6 py-5 border-b border-[#ede9e4]">
          <div className="text-[10px] font-semibold text-[#8a8a8a] tracking-[0.08em] uppercase mb-4">
            Acquisition Date
          </div>
          <Calendar
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            initialYear={initialYear}
            initialMonth={initialMonth}
          />
        </div>

        {/* Legend */}
        <div className="px-6 py-5 border-b border-[#ede9e4]">
          <div className="text-[10px] font-semibold text-[#8a8a8a] tracking-[0.08em] uppercase mb-4">
            Classification
          </div>
          <div className="flex flex-col gap-3">
            {CLASSES.map((cls, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-[3px] flex-shrink-0"
                  style={{
                    background: cls.color,
                    border: cls.border ? "1.5px solid rgba(45,125,111,0.4)" : undefined,
                  }}
                />
                <span
                  className="text-[13px]"
                  style={{ color: cls.border ? "#8a8a8a" : "#4a4a4a" }}
                >
                  {cls.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="px-6 py-5 border-b border-[#ede9e4]">
          <div className="text-[10px] font-semibold text-[#8a8a8a] tracking-[0.08em] uppercase mb-3">
            Status
          </div>
          <div className="font-mono text-[11px] text-[#8a8a8a] leading-relaxed">
            {status}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-6 py-4 border-t border-[#ede9e4]">
          <div className="text-[10px] text-[#b8b8b8] leading-relaxed">
            SIENA classification model
          </div>
          <div className="text-[10px] text-[#b8b8b8] leading-relaxed">
            © OpenStreetMap contributors
          </div>
        </div>
      </div>
    </aside>
  );
}
