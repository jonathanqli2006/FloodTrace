"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Scene } from "@/types";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parseGeoraster: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GeoRasterLayer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

interface MapProps {
  scenes: Scene[];
  selectedDate: string | null;
  onStatusChange: (status: string) => void;
  onProgressChange: (pct: number) => void;
}

const ZOOM_THRESHOLD = 7;

function parseSceneTime(filename: string) {
  const m = filename.match(/(\d{8}T\d{6})_(\d{8}T\d{6})/);
  if (!m) return null;
  const fmt = (ts: string) =>
    `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(9, 11)}:${ts.slice(11, 13)} UTC`;
  return { start: fmt(m[1]), end: fmt(m[2]) };
}

function popupHtml(scene: Scene, downloadUrl: string) {
  const t = parseSceneTime(scene.filename);
  return `
    <div class="popup-label">SAR Scene</div>
    <div class="popup-row"><b>Date</b>${scene.date}</div>
    ${t ? `<div class="popup-row"><b>Pass start</b>${t.start}</div><div class="popup-row"><b>Pass end</b>${t.end}</div>` : ""}
    <div class="popup-filename">${scene.filename}</div>
    <a class="popup-download" href="${downloadUrl}" target="_blank" rel="noopener">↓ Download COG</a>
  `;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function boundsToLatLng(L: any, bounds: [number, number, number, number]) {
  return L.latLngBounds([bounds[1], bounds[0]], [bounds[3], bounds[2]]);
}

export default function FloodMap({ scenes, selectedDate, onStatusChange, onProgressChange }: MapProps) {
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const outlineLayers = useRef<Map<string, any>>(new Map());
  const dataLayers = useRef<Map<string, any>>(new Map());
  const georasterCache = useRef<Map<string, any>>(new Map());
  const outlineGroup = useRef<any>(null);
  const dataGroup = useRef<any>(null);
  const scaleLineRef = useRef<HTMLDivElement>(null);
  const scaleLabelRef = useRef<HTMLDivElement>(null);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapReadyRef = useRef(false);
  // Keep latest scenes/selectedDate accessible in callbacks without re-creating them
  const scenesRef = useRef<Scene[]>(scenes);
  const selectedDateRef = useRef<string | null>(selectedDate);

  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  const getPresignedUrl = useCallback(async (scene: Scene): Promise<string> => {
    const url = new URL(scene.url);
    const key = url.pathname.slice(1);
    const res = await fetch(`/api/presign?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    return data.url as string;
  }, []);

  const updateScaleBar = useCallback(() => {
    const map = mapRef.current;
    if (!map || !scaleLineRef.current || !scaleLabelRef.current) return;
    const lat = map.getCenter().lat;
    const zoom = map.getZoom();
    const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
    const maxM = mpp * 120;
    const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    let dist = steps[0];
    for (const s of steps) { if (s <= maxM) dist = s; else break; }
    scaleLineRef.current.style.width = `${Math.round(dist / mpp)}px`;
    scaleLabelRef.current.textContent = dist >= 1000 ? `${dist / 1000} km` : `${dist} m`;
  }, []);

  const addOutline = useCallback((scene: Scene) => {
    const L = window.L;
    if (!L || outlineLayers.current.has(scene.filename)) return;
    const rect = L.rectangle(boundsToLatLng(L, scene.bounds), {
      color: "#2D7D6F", weight: 2,
      fillColor: "rgba(45,125,111,0.04)", fillOpacity: 1, dashArray: "5 4",
    });
    const t = parseSceneTime(scene.filename);
    const popupId = `popup-${scene.filename.replace(/[^a-z0-9]/gi, "")}`;

    rect.bindPopup(`
      <div class="popup-label">SAR Scene</div>
      <div class="popup-row"><b>Date</b>${scene.date}</div>
      ${t ? `<div class="popup-row"><b>Pass start</b>${t.start}</div><div class="popup-row"><b>Pass end</b>${t.end}</div>` : ""}
      <div class="popup-filename">${scene.filename}</div>
      <div id="${popupId}">
        <a class="popup-download" href="#" onclick="return false;" style="opacity:0.5;cursor:default;">Loading link…</a>
      </div>
    `);

    // When popup opens, fetch a real presigned URL and update the link
    rect.on("popupopen", async () => {
      try {
        const url = new URL(scene.url);
        const key = url.pathname.slice(1);
        const res = await fetch(`/api/presign?key=${encodeURIComponent(key)}`);
        const data = await res.json();
        const el = document.getElementById(popupId);
        if (el) {
          el.innerHTML = `<a class="popup-download" href="${data.url}" target="_blank" rel="noopener">↓ Download COG</a>`;
        }
      } catch {
        const el = document.getElementById(popupId);
        if (el) el.innerHTML = `<p style="font-size:10px;color:#c62828;">Download unavailable</p>`;
      }
    });

    outlineLayers.current.set(scene.filename, rect);
  }, []);

  const addData = useCallback(async (scene: Scene) => {
    if (dataLayers.current.has(scene.filename)) return;
    dataLayers.current.set(scene.filename, "loading");
    try {
      // Get presigned URL once — use it for both fetching and the download button
      const presignedUrl = await getPresignedUrl(scene);

      let gr = georasterCache.current.get(scene.filename);
      if (!gr) {
        const buf = await (await fetch(presignedUrl)).arrayBuffer();
        gr = await window.parseGeoraster(buf);
        georasterCache.current.set(scene.filename, gr);
      }
      const layer = new window.GeoRasterLayer({
        georaster: gr, opacity: 0.92,
        pixelValuesToColorFn: (v: number[]) => {
          if (v[0] === 1) return "rgba(21,101,192,0.88)";
          if (v[0] === 3) return "rgba(198,40,40,0.92)";
          return null;
        },
        resolution: 128,
      });
      layer.bindPopup(popupHtml(scene, presignedUrl));
      dataLayers.current.set(scene.filename, layer);
      const map = mapRef.current;
      if (map && map.getZoom() >= ZOOM_THRESHOLD) {
        dataGroup.current?.addLayer(layer);
      }
    } catch (e) {
      console.error(`Failed: ${scene.filename}`, e);
      dataLayers.current.delete(scene.filename);
    }
  }, [getPresignedUrl]);

  const removeData = useCallback((filename: string) => {
    const layer = dataLayers.current.get(filename);
    if (layer && layer !== "loading") dataGroup.current?.removeLayer(layer);
    dataLayers.current.delete(filename);
  }, []);

  // Core render function — reads from refs so it's always current
  const renderLayers = useCallback(async () => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !mapReadyRef.current) return;

    const zoom = map.getZoom();
    const mb = map.getBounds();
    const currentDate = selectedDateRef.current;
    const currentScenes = scenesRef.current;

    const visible = currentScenes.filter(s => {
      if (currentDate && s.date !== currentDate) return false;
      return mb.intersects(boundsToLatLng(L, s.bounds));
    });
    const visSet = new Set(visible.map(s => s.filename));

    if (zoom < ZOOM_THRESHOLD) {
      // ── Outline mode ──────────────────────────────────────────────────────
      // Clear data layers from map (keep cache)
      dataGroup.current.clearLayers();
      // Remove any data layers that are no longer relevant
      for (const fn of Array.from(dataLayers.current.keys())) {
        if (!visSet.has(fn)) removeData(fn);
      }

      // Show outlines for visible scenes
      outlineGroup.current.clearLayers();
      visible.forEach(scene => {
        if (!outlineLayers.current.has(scene.filename)) addOutline(scene);
        const r = outlineLayers.current.get(scene.filename);
        if (r) outlineGroup.current.addLayer(r);
      });

      onStatusChange(`${visible.length} scene${visible.length !== 1 ? "s" : ""} in view — zoom in to load`);
      onProgressChange(30);
    } else {
      // ── Data mode ─────────────────────────────────────────────────────────
      outlineGroup.current.clearLayers();

      // Remove layers no longer in view
      for (const fn of Array.from(dataLayers.current.keys())) {
        if (!visSet.has(fn)) removeData(fn);
      }

      const toLoad = visible.filter(s => !dataLayers.current.has(s.filename));
      if (toLoad.length > 0) {
        onStatusChange(`Loading ${toLoad.length} scene${toLoad.length !== 1 ? "s" : ""}…`);
        onProgressChange(50);
      }
      await Promise.all(toLoad.map(addData));

      // Make sure all loaded layers are on the map
      for (const [, layer] of dataLayers.current) {
        if (layer && layer !== "loading" && !dataGroup.current.hasLayer(layer)) {
          dataGroup.current.addLayer(layer);
        }
      }

      onStatusChange(`${dataLayers.current.size} scene${dataLayers.current.size !== 1 ? "s" : ""} loaded`);
      onProgressChange(100);
    }
  }, [addOutline, addData, removeData, onStatusChange, onProgressChange]);

  const scheduleUpdate = useCallback(() => {
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(renderLayers, 300);
  }, [renderLayers]);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    // Guard against React strict mode double-invoke
    if ((mapDivRef.current as any)._leaflet_id) return;

    const loadScripts = async () => {
      const loadScript = (src: string) =>
        new Promise<void>(res => {
          if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
          const s = document.createElement("script");
          s.src = src; s.onload = () => res();
          document.head.appendChild(s);
        });

      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      await loadScript("https://unpkg.com/georaster@1.6.0/dist/georaster.browser.bundle.min.js");
      await loadScript("https://unpkg.com/georaster-layer-for-leaflet@3.10.0/dist/georaster-layer-for-leaflet.min.js");

      // Double-check after async script loads
      if (mapRef.current || (mapDivRef.current as any)?._leaflet_id) return;

      const L = window.L;
      const map = L.map(mapDivRef.current, {
        zoomControl: true, minZoom: 3, maxBoundsViscosity: 1.0,
      }).setView([45, -100], 4);

      map.setMaxBounds([[-90, -180], [90, 180]]);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, noWrap: true,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      outlineGroup.current = L.layerGroup().addTo(map);
      dataGroup.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      mapReadyRef.current = true;

      map.on("moveend zoomend", () => { updateScaleBar(); scheduleUpdate(); });
      updateScaleBar();
    };

    loadScripts();
  }, [updateScaleBar, scheduleUpdate]);

  // React to scene/date changes
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !mapReadyRef.current || scenes.length === 0) return;

    // Clear everything
    outlineGroup.current?.clearLayers();
    dataGroup.current?.clearLayers();
    outlineLayers.current.clear();
    dataLayers.current.clear();
    onProgressChange(10);

    const filtered = selectedDate ? scenes.filter(s => s.date === selectedDate) : scenes;
    if (filtered.length === 0) { onStatusChange("No scenes for this date."); return; }

    // Fit bounds then render — wait for moveend to fire renderLayers via scheduleUpdate
    let combined = boundsToLatLng(L, filtered[0].bounds);
    filtered.forEach(s => (combined = combined.extend(boundsToLatLng(L, s.bounds))));

    // Use once() so we render after fitBounds completes
    map.once("moveend", () => { renderLayers(); });
    map.fitBounds(combined, { padding: [20, 20] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, selectedDate]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapDivRef} className="w-full h-full" />
      <div className="absolute bottom-5 right-5 z-[800] flex flex-col items-end gap-1 pointer-events-none">
        <div
          ref={scaleLineRef}
          className="h-[4px] border border-t-0 border-[#2d7d6f] rounded-b opacity-70 min-w-[60px] transition-all duration-300"
        />
        <div ref={scaleLabelRef} className="font-mono text-[10px] text-[#2d7d6f] opacity-70 tracking-wide" />
      </div>
    </div>
  );
}
