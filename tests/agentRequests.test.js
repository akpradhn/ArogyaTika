import test from "node:test";
import assert from "node:assert/strict";

import {
  createAgentRequest,
  filterAgentRequests,
  updateAgentRequest,
  validateAgentRequestInput
} from "../src/agentRequests.js";

test("creates a structured AgentRequest with required fields", () => {
  const now = new Date("2026-06-28T10:00:00.000Z");
  const request = createAgentRequest(
    {
      original_request: "Replace queue UI with patient finder.",
      module: "Patient workspace",
      priority: "high"
    },
    now,
    "admin@example.test"
  );

  assert.equal(request.title, "Replace queue UI with patient finder.");
  assert.equal(request.original_request, "Replace queue UI with patient finder.");
  assert.equal(request.module, "Patient workspace");
  assert.equal(request.priority, "high");
  assert.equal(request.status, "draft");
  assert.equal(request.created_at, "2026-06-28T10:00:00.000Z");
  assert.equal(request.created_by, "admin@example.test");
  assert.equal(request.audit_events.length, 1);
});

test("rejects missing request text and unsafe URLs", () => {
  const errors = validateAgentRequestInput({
    original_request: "",
    github_issue_url: "javascript:alert(1)",
    pr_url: "ftp://example.test/pr"
  });

  assert.match(errors.join(" "), /Rough request is required/);
  assert.match(errors.join(" "), /GitHub Issue URL/);
  assert.match(errors.join(" "), /PR URL/);
});

test("updates manual tracking fields and appends audit event", () => {
  const createdAt = new Date("2026-06-28T10:00:00.000Z");
  const updatedAt = new Date("2026-06-28T11:00:00.000Z");
  const request = createAgentRequest(
    {
      original_request: "Add a safe admin note to inventory updates."
    },
    createdAt
  );

  const updated = updateAgentRequest(
    request,
    {
      status: "issue_created",
      github_issue_url: "https://github.com/example/arogyatika/issues/11",
      github_issue_number: "11",
      branch_name: "feat/inventory-admin-note"
    },
    updatedAt,
    "reviewer@example.test"
  );

  assert.equal(updated.status, "issue_created");
  assert.equal(updated.github_issue_number, "11");
  assert.equal(updated.branch_name, "feat/inventory-admin-note");
  assert.equal(updated.updated_at, "2026-06-28T11:00:00.000Z");
  assert.equal(updated.audit_events.length, 2);
  assert.match(updated.audit_events[1].action, /updated status/);
});

test("filters by status and date range", () => {
  const requests = [
    createAgentRequest(
      { original_request: "First request for admin dashboard.", status: "draft" },
      new Date("2026-06-20T10:00:00.000Z")
    ),
    createAgentRequest(
      { original_request: "Second request for admin dashboard.", status: "testing" },
      new Date("2026-06-25T10:00:00.000Z")
    ),
    createAgentRequest(
      { original_request: "Third request for admin dashboard.", status: "testing" },
      new Date("2026-06-28T10:00:00.000Z")
    )
  ];

  const filtered = filterAgentRequests(requests, {
    status: "testing",
    from: "2026-06-24",
    to: "2026-06-26"
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].original_request, "Second request for admin dashboard.");
});
