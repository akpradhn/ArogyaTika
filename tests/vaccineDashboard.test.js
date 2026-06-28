import test from "node:test";
import assert from "node:assert/strict";

import {
  addCompletedDose,
  createDashboardSnapshot,
  formatRelativeDueDate,
  getCurrentAge,
  groupRecordsByStage,
  validateDoseInput
} from "../src/vaccineDashboard.js";
import { createMockChildren } from "../src/mockData.js";

test("creates a parent dashboard snapshot with progress and next action", () => {
  const child = createMockChildren()[0];
  const snapshot = createDashboardSnapshot(child, new Date("2026-06-28T10:00:00.000Z"));

  assert.equal(snapshot.child.displayName, "Mira");
  assert.equal(snapshot.progress > 0, true);
  assert.equal(snapshot.nextDue.vaccineName, "Japanese Encephalitis");
  assert.equal(snapshot.overdue.some((record) => record.vaccineName === "MR"), true);
  assert.match(snapshot.recommendedAction, /Book or confirm/);
});

test("formats age and friendly due dates", () => {
  const today = new Date("2026-06-28T10:00:00.000Z");

  assert.equal(getCurrentAge("2025-09-14", today), "9 months");
  assert.equal(formatRelativeDueDate("2026-07-03", today), "Due in 5 days");
  assert.equal(formatRelativeDueDate("2026-06-16", today), "Overdue by 12 days");
});

test("adds a self-reported completed dose without overwriting completed history", () => {
  const child = createMockChildren()[0];
  const before = child.records.find((record) => record.id === "mira-bcg");
  const updated = addCompletedDose(
    child,
    {
      vaccineName: "BCG",
      doseNumber: "1",
      dateGiven: "2025-09-16",
      clinic: "Family clinic",
      notes: "Parent found a card photo.",
      cardUploadName: "card-photo.png"
    },
    new Date("2026-06-28T11:00:00.000Z")
  );
  const after = updated.records.find((record) => record.id === "mira-bcg");

  assert.equal(after.actualDate, before.actualDate);
  assert.equal(updated.recordUpdateEvents.length, 1);
  assert.match(updated.lastNotice, /without replacing/);
});

test("marks a scheduled dose completed as self-reported", () => {
  const child = createMockChildren()[0];
  const updated = addCompletedDose(
    child,
    {
      vaccineName: "IPV",
      doseNumber: "1",
      dateGiven: "2026-06-25",
      clinic: "",
      notes: "Updated from a mock card."
    },
    new Date("2026-06-28T11:00:00.000Z")
  );
  const record = updated.records.find((item) => item.id === "mira-ipv");

  assert.equal(record.actualDate, "2026-06-25");
  assert.equal(record.source, "self_reported");
  assert.equal(updated.recordUpdateEvents.length, 1);
});

test("validates parent-entered dose updates and groups records by stage", () => {
  const errors = validateDoseInput({ vaccineName: "", doseNumber: "", dateGiven: "" });
  const groups = groupRecordsByStage(createMockChildren()[1].records);

  assert.equal(errors.length, 3);
  assert.equal(groups[0].stage, "Birth");
  assert.equal(groups.some((group) => group.stage === "18 Months"), true);
});
