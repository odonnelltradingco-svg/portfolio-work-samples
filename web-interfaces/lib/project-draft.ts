/** Optional, device-local demonstration drafts. Never stores prices or submits data. */
export const PROJECT_DRAFT_KEY = 'scope-studio:temporary-draft:v1';
export const DRAFT_LIFETIME = 7 * 24 * 60 * 60 * 1000;

export type ProjectDraft = {
  kind: 'website' | 'dashboard';
  pages: number;
  features: string[];
  name: string;
  brief: string;
  step: number;
  furthest: number;
  complete: boolean;
};
export type SavedProjectDraft = {
  version: 1;
  savedAt: number;
  draft: ProjectDraft;
};
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type DraftReadResult =
  | { status: 'saved'; saved: SavedProjectDraft }
  | { status: 'empty' | 'invalid' | 'expired' | 'unavailable' };

function normalizeDraft(value: unknown): ProjectDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  if (draft.kind !== 'website' && draft.kind !== 'dashboard') return null;
  if (
    typeof draft.pages !== 'number' ||
    !Number.isInteger(draft.pages) ||
    draft.pages < 1 ||
    draft.pages > 8
  )
    return null;
  if (
    !Array.isArray(draft.features) ||
    draft.features.length > 3 ||
    draft.features.some(
      (feature) =>
        typeof feature !== 'string' ||
        !['forms', 'reporting', 'content'].includes(feature),
    )
  )
    return null;
  if (
    typeof draft.name !== 'string' ||
    draft.name.length > 80 ||
    typeof draft.brief !== 'string' ||
    draft.brief.length > 600
  )
    return null;
  if (
    typeof draft.step !== 'number' ||
    ![1, 2, 3].includes(draft.step) ||
    typeof draft.furthest !== 'number' ||
    ![1, 2, 3].includes(draft.furthest) ||
    draft.furthest < draft.step ||
    typeof draft.complete !== 'boolean'
  )
    return null;
  const ready =
    draft.name.trim().length >= 2 && draft.brief.trim().length >= 15;
  // A stale or edited draft cannot bypass the form's required goal fields.
  return {
    kind: draft.kind,
    pages: draft.pages,
    features: [...new Set(draft.features as string[])],
    name: draft.name,
    brief: draft.brief,
    step: ready ? draft.step : Math.min(draft.step, 2),
    furthest: ready ? draft.furthest : Math.min(draft.furthest, 2),
    complete: ready && draft.complete && draft.step === 3,
  };
}

export function parseProjectDraft(
  raw: string | null,
  now: number,
): DraftReadResult {
  if (raw === null) return { status: 'empty' };
  if (raw.length > 12_000 || !Number.isFinite(now))
    return { status: 'invalid' };
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      value.version !== 1 ||
      !Number.isSafeInteger(value.savedAt) ||
      value.savedAt < 0 ||
      value.savedAt > now
    ) {
      return { status: 'invalid' };
    }
    const draft = normalizeDraft(value.draft);
    if (!draft) return { status: 'invalid' };
    if (now - value.savedAt >= DRAFT_LIFETIME) return { status: 'expired' };
    return {
      status: 'saved',
      saved: { version: 1, savedAt: value.savedAt, draft },
    };
  } catch {
    return { status: 'invalid' };
  }
}

export function readProjectDraft(
  storage: DraftStorage,
  now: number,
): DraftReadResult {
  try {
    return parseProjectDraft(storage.getItem(PROJECT_DRAFT_KEY), now);
  } catch {
    return { status: 'unavailable' };
  }
}

export function saveProjectDraft(
  storage: DraftStorage,
  draft: ProjectDraft,
  now: number,
): SavedProjectDraft | null {
  const normalized = normalizeDraft(draft);
  if (!normalized || !Number.isSafeInteger(now) || now < 0) return null;
  const saved: SavedProjectDraft = {
    version: 1,
    savedAt: now,
    draft: normalized,
  };
  try {
    const encoded = JSON.stringify(saved);
    storage.setItem(PROJECT_DRAFT_KEY, encoded);
    // Do not display success when the browser did not retain the write.
    if (storage.getItem(PROJECT_DRAFT_KEY) !== encoded) return null;
    return saved;
  } catch {
    return null;
  }
}

export function forgetProjectDraft(storage: DraftStorage): boolean {
  try {
    storage.removeItem(PROJECT_DRAFT_KEY);
    return storage.getItem(PROJECT_DRAFT_KEY) === null;
  } catch {
    return false;
  }
}

export function draftMatches(left: ProjectDraft, right: ProjectDraft): boolean {
  const a = normalizeDraft(left),
    b = normalizeDraft(right);
  if (!a || !b) return false;
  return (
    JSON.stringify({ ...a, features: [...a.features].sort() }) ===
    JSON.stringify({ ...b, features: [...b.features].sort() })
  );
}
