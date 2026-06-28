import { createAgentRequest } from "./agentRequests.js";

const CREATED_BY = "admin@arogyatika.internal";

export function createSeedRequests() {
  const base = [
    {
      title: "Replace queue entry with patient finder",
      original_request:
        "Remove queue UI but keep a way to find/select a patient and open workspace.",
      module: "Patient workspace",
      priority: "high",
      status: "planning",
      github_issue_url: "https://github.com/example/arogyatika/issues/128",
      github_issue_number: "128",
      branch_name: "feat/patient-finder-workspace",
      agent_summary:
        "Draft plan converts queue-first navigation into a search-and-select workflow using anonymized patient references.",
      test_result: "Not started"
    },
    {
      title: "Add vaccine lot audit notes",
      original_request:
        "Let admins add a non-clinical note to vaccine lot edits for internal audit review.",
      module: "Inventory",
      priority: "normal",
      status: "issue_created",
      github_issue_url: "https://github.com/example/arogyatika/issues/132",
      github_issue_number: "132",
      branch_name: "feat/vaccine-lot-audit-notes",
      agent_summary:
        "Issue created with acceptance criteria for immutable edit notes and no patient identifiers.",
      test_result: "Pending implementation"
    },
    {
      title: "Harden appointment import error state",
      original_request:
        "When appointment CSV import fails, show a short safe message and keep detailed errors in admin logs.",
      module: "Appointments",
      priority: "urgent",
      status: "failed",
      github_issue_url: "https://github.com/example/arogyatika/issues/119",
      github_issue_number: "119",
      branch_name: "fix/import-error-state",
      agent_summary:
        "Implementation stopped during manual review because the import parser contract was unclear.",
      test_result: "Build not run",
      failure_reason: "Needs owner decision on whether row-level errors are considered sensitive."
    }
  ];

  return base.map((request, index) => {
    const created = new Date(Date.UTC(2026, 5, 20 + index, 9, 15));
    const updated = new Date(Date.UTC(2026, 5, 22 + index, 14, 30));
    return {
      ...createAgentRequest(request, created, CREATED_BY),
      status: request.status,
      updated_at: updated.toISOString(),
      audit_events: [
        {
          at: created.toISOString(),
          actor: CREATED_BY,
          action: "created anonymized demo request"
        },
        {
          at: updated.toISOString(),
          actor: CREATED_BY,
          action: `set status to ${request.status}`
        }
      ]
    };
  });
}
