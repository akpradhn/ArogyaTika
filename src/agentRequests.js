export const AGENT_STATUSES = [
  "draft",
  "planning",
  "issue_created",
  "coding",
  "testing",
  "pr_ready",
  "failed"
];

export const STATUS_LABELS = {
  draft: "Draft",
  planning: "Planning",
  issue_created: "Issue Created",
  coding: "Coding",
  testing: "Testing",
  pr_ready: "PR Ready",
  failed: "Failed"
};

export const PRIORITIES = ["low", "normal", "high", "urgent"];

export function createAgentRequest(input, now = new Date(), createdBy = "admin") {
  const normalized = normalizeInput(input);
  const errors = validateAgentRequestInput(normalized);

  if (errors.length > 0) {
    const error = new Error("Agent request is invalid.");
    error.details = errors;
    throw error;
  }

  const timestamp = now.toISOString();
  const title = normalized.title || deriveTitle(normalized.original_request);

  return {
    id: normalized.id || createId(now),
    title,
    original_request: normalized.original_request,
    module: normalized.module,
    priority: normalized.priority || "normal",
    status: normalized.status || "draft",
    github_issue_url: normalized.github_issue_url,
    github_issue_number: normalized.github_issue_number,
    branch_name: normalized.branch_name,
    pr_url: normalized.pr_url,
    agent_summary: normalized.agent_summary,
    test_result: normalized.test_result,
    failure_reason: normalized.failure_reason,
    screenshot: normalized.screenshot || null,
    audit_events: normalized.audit_events || [
      {
        at: timestamp,
        actor: createdBy,
        action: "created request"
      }
    ],
    created_at: normalized.created_at || timestamp,
    updated_at: normalized.updated_at || timestamp,
    created_by: normalized.created_by || createdBy
  };
}

export function updateAgentRequest(existing, updates, now = new Date(), actor = "admin") {
  const next = {
    ...existing,
    ...normalizePartialInput(updates),
    updated_at: now.toISOString()
  };

  const errors = validateAgentRequestRecord(next);
  if (errors.length > 0) {
    const error = new Error("Agent request update is invalid.");
    error.details = errors;
    throw error;
  }

  return {
    ...next,
    audit_events: [
      ...(existing.audit_events || []),
      {
        at: next.updated_at,
        actor,
        action: describeUpdate(existing, next)
      }
    ]
  };
}

export function filterAgentRequests(requests, filters = {}) {
  const status = filters.status || "all";
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

  return requests
    .filter((request) => status === "all" || request.status === status)
    .filter((request) => {
      const created = new Date(request.created_at);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

export function validateAgentRequestInput(input) {
  const errors = [];

  if (!input.original_request || input.original_request.trim().length < 8) {
    errors.push("Rough request is required and must be at least 8 characters.");
  }

  if (input.status && !AGENT_STATUSES.includes(input.status)) {
    errors.push("Status is not supported.");
  }

  if (input.priority && !PRIORITIES.includes(input.priority)) {
    errors.push("Priority is not supported.");
  }

  if (input.github_issue_url && !isSafeUrl(input.github_issue_url)) {
    errors.push("GitHub Issue URL must be a valid http(s) URL.");
  }

  if (input.pr_url && !isSafeUrl(input.pr_url)) {
    errors.push("PR URL must be a valid http(s) URL.");
  }

  return errors;
}

export function validateAgentRequestRecord(record) {
  const errors = validateAgentRequestInput(record);

  if (!record.id) errors.push("Request id is required.");
  if (!record.title) errors.push("Title is required.");
  if (!record.created_at) errors.push("Created timestamp is required.");
  if (!record.updated_at) errors.push("Updated timestamp is required.");
  if (!record.created_by) errors.push("Creator is required.");

  return errors;
}

export function deriveTitle(originalRequest) {
  const clean = (originalRequest || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Untitled agent request";
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

function normalizeInput(input = {}) {
  return {
    id: clean(input.id),
    title: clean(input.title),
    original_request: clean(input.original_request),
    module: clean(input.module),
    priority: clean(input.priority),
    status: clean(input.status),
    github_issue_url: clean(input.github_issue_url),
    github_issue_number: clean(input.github_issue_number),
    branch_name: clean(input.branch_name),
    pr_url: clean(input.pr_url),
    agent_summary: clean(input.agent_summary),
    test_result: clean(input.test_result),
    failure_reason: clean(input.failure_reason),
    screenshot: input.screenshot || null,
    audit_events: input.audit_events,
    created_at: input.created_at,
    updated_at: input.updated_at,
    created_by: clean(input.created_by)
  };
}

function normalizePartialInput(input = {}) {
  return Object.fromEntries(
    Object.entries(normalizeInput(input)).filter(
      ([key]) => Object.prototype.hasOwnProperty.call(input, key)
    )
  );
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createId(now) {
  const entropy =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
  return `ar-${entropy}`;
}

function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function describeUpdate(previous, next) {
  const changed = [
    "status",
    "github_issue_url",
    "github_issue_number",
    "branch_name",
    "pr_url",
    "agent_summary",
    "test_result",
    "failure_reason"
  ].filter((key) => previous[key] !== next[key]);

  return changed.length > 0 ? `updated ${changed.join(", ")}` : "updated request";
}
