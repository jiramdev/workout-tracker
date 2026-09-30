"use client";

import { useSyncExternalStore } from "react";

export const WORKOUT_PREFIX = "repiq:";

const LEGACY_TARGET = "active_workout_rest_target";
const LEGACY_EXERCISE = "active_workout_rest_exercise";
const LEGACY_TOKEN = "active_workout_rest_token";
const LEGACY_START = "active_workout_started_at";
const LEGACY_SETS = "active_workout_sets_data_v2";
const LEGACY_SETS_OLD = "active_workout_sets_data";

const snapshots = new Map<string, { raw: string; value: unknown }>();

export function draftKey(userId: string, name: string) {
  return `${WORKOUT_PREFIX}${userId}:${name}`;
}

export function setsDraftKey(userId: string, planId?: string | null) {
  return draftKey(userId, `sets:${planId ?? "none"}`);
}

function subscribeDraft(onChange: () => void) {
  window.addEventListener("repiq-draft", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("repiq-draft", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readSnapshot<T>(key: string, parse: (raw: string | null) => T): T {
  const raw = localStorage.getItem(key) ?? "";
  const hit = snapshots.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = parse(raw ? raw : null);
  snapshots.set(key, { raw, value });
  return value;
}

export function writeDraft(key: string, value: string | null) {
  if (value == null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
  snapshots.delete(key);
  window.dispatchEvent(new Event("repiq-draft"));
}

export function useDraftValue<T>(key: string, parse: (raw: string | null) => T, serverValue: T) {
  return useSyncExternalStore(
    subscribeDraft,
    () => readSnapshot(key, parse),
    () => serverValue
  );
}

function copyLegacy(nextKey: string, legacyKey: string) {
  if (localStorage.getItem(nextKey) != null) {
    localStorage.removeItem(legacyKey);
    return;
  }
  const legacy = localStorage.getItem(legacyKey);
  if (legacy == null) return;
  localStorage.setItem(nextKey, legacy);
  localStorage.removeItem(legacyKey);
  snapshots.delete(nextKey);
}

export function migrateLegacyDraft(userId: string, planId?: string | null) {
  copyLegacy(draftKey(userId, "rest_target"), LEGACY_TARGET);
  copyLegacy(draftKey(userId, "rest_exercise"), LEGACY_EXERCISE);
  copyLegacy(draftKey(userId, "rest_token"), LEGACY_TOKEN);
  copyLegacy(draftKey(userId, "started_at"), LEGACY_START);
  copyLegacy(setsDraftKey(userId, planId), `${LEGACY_SETS}:${planId ?? "none"}`);
  localStorage.removeItem(LEGACY_SETS_OLD);
  window.dispatchEvent(new Event("repiq-draft"));
}

export async function clearWorkoutDraft() {
  const tokens: string[] = [];
  const remove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    const owned =
      key.startsWith(WORKOUT_PREFIX) ||
      key.startsWith("active_workout_") ||
      key === LEGACY_SETS_OLD;
    if (!owned) continue;
    if (key.endsWith(":rest_token") || key === LEGACY_TOKEN) {
      const token = localStorage.getItem(key);
      if (token) tokens.push(token);
    }
    remove.push(key);
  }

  await Promise.all(
    tokens.map((token) =>
      fetch("/api/rest-timer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => undefined)
    )
  );

  for (const key of remove) {
    localStorage.removeItem(key);
    snapshots.delete(key);
  }
  window.dispatchEvent(new Event("repiq-draft"));
}
