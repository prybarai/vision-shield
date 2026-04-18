"use client";

import { useCallback, useEffect, useState } from "react";

export type ProjectStatus = "exploring" | "planning" | "ready";

export interface SavedProject {
 id: string;
 createdAt: number;
 updatedAt: number;
 photoUrl: string | null;
 conceptUrl?: string | null;
 description: string;
 moods: string[]; // e.g. ["Warm Modern", "Spa Calm"]
 projectType: string; // e.g. "Bathroom Refresh"
 verdict: "diy" | "pro";
 difficultyScore: number; // 1-10
 costLow: number;
 costHigh: number;
 timelineWeeks: string; // e.g. "2-4 weeks"
 verifiedScopeFlags: Record<string, string>; // answers from ClarificationModal
 status: ProjectStatus;
}

const STORAGE_KEY = "naili.vision-board.v1";

function readAll(): SavedProject[] {
 if (typeof window === "undefined") return [];
 try {
 const raw = localStorage.getItem(STORAGE_KEY);
 if (!raw) return [];
 return JSON.parse(raw) as SavedProject[];
 } catch {
 return [];
 }
}

function writeAll(projects: SavedProject[]) {
 if (typeof window === "undefined") return;
 localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
 // Custom event so other hooks in the same tab stay in sync.
 window.dispatchEvent(new Event("naili:vision-board-update"));
}

export function useProjectStorage() {
 const [projects, setProjects] = useState<SavedProject[]>([]);

 useEffect(() => {
 setProjects(readAll());
 const onUpdate = () => setProjects(readAll());
 window.addEventListener("naili:vision-board-update", onUpdate);
 window.addEventListener("storage", onUpdate);
 return () => {
 window.removeEventListener("naili:vision-board-update", onUpdate);
 window.removeEventListener("storage", onUpdate);
 };
 }, []);

 const saveProject = useCallback(
 (input: Omit<SavedProject, "id" | "createdAt" | "updatedAt" | "status"> & {
 status?: ProjectStatus;
 }) => {
 const now = Date.now();
 const project: SavedProject = {
 id: `proj_${now}_${Math.random().toString(36).slice(2, 7)}`,
 createdAt: now,
 updatedAt: now,
 status: input.status ?? "exploring",
 ...input,
 };
 const next = [project, ...readAll()];
 writeAll(next);
 return project;
 },
 []
 );

 const updateProject = useCallback(
 (id: string, patch: Partial<SavedProject>) => {
 const all = readAll();
 const next = all.map((p) =>
 p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
 );
 writeAll(next);
 },
 []
 );

 const removeProject = useCallback((id: string) => {
 writeAll(readAll().filter((p) => p.id !== id));
 }, []);

 const clearAll = useCallback(() => {
 writeAll([]);
 }, []);

 return { projects, saveProject, updateProject, removeProject, clearAll };
}
