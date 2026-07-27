"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import type { Scene, Manifest } from "@/types";

// Load map client-side only — Leaflet requires window
const FloodMap = dynamic(() => import("@/components/FloodMap"), { ssr: false });

export default function Home() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading manifest…");
  const [progress, setProgress] = useState(5);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const res = await fetch("/api/manifest");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const manifest: Manifest = await res.json();
        const allScenes = manifest.scenes ?? [];
        setScenes(allScenes);

        const dates = Array.from(new Set(allScenes.map(s => s.date))).sort();
        setAvailableDates(new Set(dates));

        if (dates.length > 0) {
          const latest = dates[dates.length - 1];
          const [y, m] = latest.split("-").map(Number);
          setCalYear(y);
          setCalMonth(m - 1);
          setSelectedDate(latest);
          setStatus(`${allScenes.length} scenes loaded`);
          setProgress(100);
        } else {
          setStatus("No scenes available.");
          setProgress(0);
        }
      } catch (err) {
        console.error(err);
        setStatus("Failed to load manifest.");
        setProgress(0);
      }
    };
    fetchManifest();
  }, []);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setProgress(10);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f5f2]">
      <Sidebar
        availableDates={availableDates}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        status={status}
        progress={progress}
        initialYear={calYear}
        initialMonth={calMonth}
      />
      <main className="flex-1 relative overflow-hidden">
        <FloodMap
          scenes={scenes}
          selectedDate={selectedDate}
          onStatusChange={setStatus}
          onProgressChange={setProgress}
        />
      </main>
    </div>
  );
}
