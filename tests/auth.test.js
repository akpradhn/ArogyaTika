import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTH_STORAGE_KEY,
  clearAuthSession,
  createDemoAuthSession,
  isClerkConfigured,
  loadAuthSession,
  saveAuthSession,
  validateAuthInput
} from "../src/auth.js";

test("creates a local demo auth session without secrets", () => {
  const session = createDemoAuthSession(
    {
      displayName: "Demo Parent",
      email: "PARENT@EXAMPLE.TEST"
    },
    new Date("2026-06-29T10:00:00.000Z")
  );

  assert.equal(session.displayName, "Demo Parent");
  assert.equal(session.email, "parent@example.test");
  assert.equal(session.provider, "clerk_ready_demo");
  assert.equal(session.createdAt, "2026-06-29T10:00:00.000Z");
});

test("validates email and optional display name", () => {
  assert.deepEqual(validateAuthInput({ email: "bad", displayName: "A" }), [
    "Enter a valid email address.",
    "Name must be at least 2 characters."
  ]);
});

test("stores and clears auth session through storage adapter", () => {
  const storage = createMemoryStorage();
  const session = createDemoAuthSession({ email: "guardian@example.test" });

  saveAuthSession(session, storage);
  assert.equal(loadAuthSession(storage).email, "guardian@example.test");
  clearAuthSession(storage);
  assert.equal(loadAuthSession(storage), null);
});

test("detects Clerk publishable-key configuration shape", () => {
  assert.equal(isClerkConfigured("pk_test_demo"), true);
  assert.equal(isClerkConfigured("sk_test_secret"), false);
  assert.equal(isClerkConfigured(""), false);
});

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    key() {
      return AUTH_STORAGE_KEY;
    }
  };
}
