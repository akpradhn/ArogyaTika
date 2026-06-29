export const AUTH_STORAGE_KEY = "arogyatika.authSession.v1";

export function createDemoAuthSession(input, now = new Date()) {
  const normalized = normalizeAuthInput(input);
  const errors = validateAuthInput(normalized);

  if (errors.length > 0) {
    const error = new Error("Authentication details are invalid.");
    error.details = errors;
    throw error;
  }

  return {
    id: createId(now),
    displayName: normalized.displayName || "Demo Parent",
    email: normalized.email,
    provider: "clerk_ready_demo",
    createdAt: now.toISOString(),
    lastActiveAt: now.toISOString()
  };
}

export function validateAuthInput(input) {
  const errors = [];

  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push("Enter a valid email address.");
  }

  if (input.displayName && input.displayName.length < 2) {
    errors.push("Name must be at least 2 characters.");
  }

  return errors;
}

export function loadAuthSession(storage = localStorage) {
  const stored = storage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  const parsed = JSON.parse(stored);
  if (!parsed || !parsed.email || !parsed.id) return null;
  return parsed;
}

export function saveAuthSession(session, storage = localStorage) {
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(storage = localStorage) {
  storage.removeItem(AUTH_STORAGE_KEY);
}

export function isClerkConfigured(globalValue = globalThis.AROGYATIKA_CLERK_PUBLISHABLE_KEY) {
  return typeof globalValue === "string" && globalValue.startsWith("pk_");
}

function normalizeAuthInput(input = {}) {
  return {
    displayName: clean(input.displayName),
    email: clean(input.email).toLowerCase()
  };
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createId(now) {
  const entropy =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${now.getTime()}-${Math.random().toString(36).slice(2, 9)}`;
  return `auth-${entropy}`;
}
