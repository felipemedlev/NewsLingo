"use client";

import { useEffect, useState } from "react";
import type { LearningLevel } from "@/lib/content";

export type SavedWord = { key: string; entryId: number; surface: string; formId: string | null; sentence: string; story: string; meaning: string; headword: string };

function readLocalStorage<T>(key: string, fallback: T, parse: (raw: string) => T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useSavedWords() {
  const [saved, setSaved] = useState<SavedWord[]>([]);
  useEffect(() => setSaved(readLocalStorage("newsl-words-v1", [], (raw) => JSON.parse(raw) as SavedWord[])), []);
  function updateSaved(next: SavedWord[]) {
    setSaved(next);
    try { localStorage.setItem("newsl-words-v1", JSON.stringify(next)); } catch { /* Saved words remain in memory for this session. */ }
  }
  return [saved, updateSaved] as const;
}

export function useReaderLevel() {
  const [level, setLevel] = useState<LearningLevel>("easy");
  useEffect(() => {
    const pref = readLocalStorage<LearningLevel | null>("newsl-level-v1", null, (raw) => (raw === "easy" || raw === "intermediate" ? raw : null));
    if (pref) setLevel(pref);
  }, []);
  function changeLevel(next: LearningLevel) {
    setLevel(next);
    try { localStorage.setItem("newsl-level-v1", next); } catch { /* Preference remains active for this session. */ }
  }
  return [level, changeLevel] as const;
}

export function useTextScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const stored = readLocalStorage<number | null>("newsl-scale-v1", null, (raw) => { const n = Number(raw); return n >= 0.9 && n <= 1.3 ? n : null; });
    if (stored) setScale(stored);
  }, []);
  function cycleScale() {
    const next = scale >= 1.2 ? 1 : +(scale + 0.1).toFixed(1);
    setScale(next);
    try { localStorage.setItem("newsl-scale-v1", String(next)); } catch { /* Display setting stays in memory. */ }
    return next;
  }
  return [scale, cycleScale] as const;
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = readLocalStorage<"light" | "dark" | null>("newsl-theme-v1", null, (raw) => (raw === "dark" ? "dark" : raw === "light" ? "light" : null));
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("newsl-theme-v1", next); } catch { /* Theme stays active for this session. */ }
  }
  return [theme, toggleTheme] as const;
}
