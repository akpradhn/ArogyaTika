import {
  AGENT_STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  createAgentRequest,
  filterAgentRequests,
  updateAgentRequest,
  validateAgentRequestInput
} from "./agentRequests.js";
import { createSeedRequests } from "./seedData.js";

const STORAGE_KEY = "arogyatika.agentRequests.v1";
const app = document.querySelector("#app");

const state = {
  requests: [],
  selectedId: "",
  filters: {
    status: "all",
    from: "",
    to: ""
  },
  formError: "",
  detailError: "",
  isLoading: true
};

init();

function init() {
  try {
    state.requests = loadRequests();
    state.selectedId = state.requests[0]?.id || "";
  } catch (error) {
    renderError(error);
    return;
  }

  state.isLoading = false;
  render();
}

function loadRequests() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = createSeedRequests();
    saveRequests(seeded);
    return seeded;
  }

  const parsed = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed : [];
}

function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function render() {
  const filtered = filterAgentRequests(state.requests, state.filters);
  const selected =
    state.requests.find((request) => request.id === state.selectedId) || filtered[0] || null;

  if (selected && selected.id !== state.selectedId) {
    state.selectedId = selected.id;
  }

  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Internal admin</p>
        <h1>Agent Requests</h1>
      </div>
      <div class="privacy-strip" aria-label="Privacy and control summary">
        <span>No patient data</span>
        <span>Manual issue / PR fields</span>
        <span>Manual merge and deploy</span>
      </div>
    </header>

    <main class="workspace">
      <section class="left-pane" aria-label="Request list">
        ${renderNewRequestForm()}
        ${renderFilters()}
        ${renderRequestList(filtered)}
      </section>
      <section class="detail-pane" aria-label="Request detail">
        ${selected ? renderDetail(selected) : renderEmptyDetail()}
      </section>
    </main>
  `;

  bindEvents();
}

function renderNewRequestForm() {
  return `
    <form class="new-request" data-action="create-request">
      <div class="section-heading">
        <h2>New Request</h2>
        <span class="compact-note">Local draft only</span>
      </div>
      ${state.formError ? `<p class="error-text">${escapeHtml(state.formError)}</p>` : ""}
      <div class="form-grid">
        <label>
          <span>Title</span>
          <input name="title" placeholder="Optional short title">
        </label>
        <label>
          <span>Module</span>
          <input name="module" placeholder="Patient workspace">
        </label>
        <label>
          <span>Priority</span>
          <select name="priority">
            ${PRIORITIES.map((priority) => `<option value="${priority}">${titleCase(priority)}</option>`).join("")}
          </select>
        </label>
        <label class="file-field">
          <span>Screenshot</span>
          <input name="screenshot" type="file" accept="image/png,image/jpeg,image/webp">
        </label>
      </div>
      <label>
        <span>Rough Request</span>
        <textarea name="original_request" required rows="4" placeholder="Describe the product request without patient identifiers."></textarea>
      </label>
      <div class="form-actions">
        <button type="submit">Create Request</button>
      </div>
    </form>
  `;
}

function renderFilters() {
  return `
    <form class="filters" data-action="filter">
      <label>
        <span>Status</span>
        <select name="status">
          <option value="all"${state.filters.status === "all" ? " selected" : ""}>All</option>
          ${AGENT_STATUSES.map(
            (status) =>
              `<option value="${status}"${state.filters.status === status ? " selected" : ""}>${STATUS_LABELS[status]}</option>`
          ).join("")}
        </select>
      </label>
      <label>
        <span>From</span>
        <input name="from" type="date" value="${state.filters.from}">
      </label>
      <label>
        <span>To</span>
        <input name="to" type="date" value="${state.filters.to}">
      </label>
    </form>
  `;
}

function renderRequestList(requests) {
  if (state.isLoading) {
    return `<div class="empty-state">Loading requests...</div>`;
  }

  if (requests.length === 0) {
    return `
      <div class="empty-state">
        <strong>No matching requests</strong>
        <span>Adjust filters or create a new anonymized request.</span>
      </div>
    `;
  }

  return `
    <div class="request-list" role="list">
      ${requests
        .map(
          (request) => `
            <button class="request-row${request.id === state.selectedId ? " active" : ""}" data-select-id="${request.id}" role="listitem">
              <span class="row-main">
                <strong>${escapeHtml(request.title)}</strong>
                <small>${escapeHtml(request.module || "Unassigned module")} - ${formatDate(request.updated_at)}</small>
              </span>
              <span class="status-pill ${request.status}">${STATUS_LABELS[request.status]}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDetail(request) {
  return `
    <div class="detail-header">
      <div>
        <p class="eyebrow">${escapeHtml(request.module || "Unassigned module")}</p>
        <h2>${escapeHtml(request.title)}</h2>
      </div>
      <span class="status-pill ${request.status}">${STATUS_LABELS[request.status]}</span>
    </div>

    ${renderTimeline(request.status)}

    <div class="detail-grid">
      <section class="summary-panel">
        <h3>Request</h3>
        <p>${escapeHtml(request.original_request)}</p>
        <dl class="meta-grid">
          <div><dt>Priority</dt><dd>${titleCase(request.priority)}</dd></div>
          <div><dt>Created</dt><dd>${formatDateTime(request.created_at)}</dd></div>
          <div><dt>Updated</dt><dd>${formatDateTime(request.updated_at)}</dd></div>
          <div><dt>Created by</dt><dd>${escapeHtml(request.created_by)}</dd></div>
        </dl>
        ${
          request.screenshot
            ? `<figure class="screenshot-preview"><img src="${request.screenshot.dataUrl}" alt="Attached request screenshot"><figcaption>${escapeHtml(request.screenshot.name)}</figcaption></figure>`
            : `<div class="empty-inline">No screenshot attached.</div>`
        }
      </section>

      <form class="manual-fields" data-action="update-request" data-request-id="${request.id}">
        <div class="section-heading">
          <h3>Manual Tracking</h3>
          <span class="compact-note">Automation-ready placeholders</span>
        </div>
        ${state.detailError ? `<p class="error-text">${escapeHtml(state.detailError)}</p>` : ""}
        <label for="tracking-status-${request.id}">
          <span>Status</span>
          <select id="tracking-status-${request.id}" name="status">
            ${AGENT_STATUSES.map(
              (status) =>
                `<option value="${status}"${request.status === status ? " selected" : ""}>${STATUS_LABELS[status]}</option>`
            ).join("")}
          </select>
        </label>
        <div class="form-grid">
          ${manualInput("github_issue_url", "GitHub Issue URL", request.github_issue_url)}
          ${manualInput("github_issue_number", "Issue Number", request.github_issue_number)}
          ${manualInput("branch_name", "Branch Name", request.branch_name)}
          ${manualInput("pr_url", "PR URL", request.pr_url)}
        </div>
        <label>
          <span>Agent Summary</span>
          <textarea name="agent_summary" rows="4">${escapeHtml(request.agent_summary)}</textarea>
        </label>
        <label>
          <span>Test / Build Result</span>
          <textarea name="test_result" rows="3">${escapeHtml(request.test_result)}</textarea>
        </label>
        <label>
          <span>Failure Reason</span>
          <textarea name="failure_reason" rows="3">${escapeHtml(request.failure_reason)}</textarea>
        </label>
        <div class="form-actions">
          <button type="submit">Save Tracking</button>
        </div>
      </form>
    </div>

    <section class="audit-panel">
      <h3>Audit Trail</h3>
      <ol>
        ${(request.audit_events || [])
          .slice()
          .reverse()
          .map(
            (event) =>
              `<li><span>${formatDateTime(event.at)}</span><strong>${escapeHtml(event.action)}</strong><em>${escapeHtml(event.actor)}</em></li>`
          )
          .join("")}
      </ol>
    </section>
  `;
}

function renderTimeline(currentStatus) {
  const activeIndex = AGENT_STATUSES.indexOf(currentStatus);
  return `
    <ol class="timeline" aria-label="Request status timeline">
      ${AGENT_STATUSES.map((status, index) => {
        const stateClass =
          currentStatus === "failed" && status === "failed"
            ? "failed active"
            : index < activeIndex
              ? "complete"
              : index === activeIndex
                ? "active"
                : "";
        return `<li class="${stateClass}"><span></span>${STATUS_LABELS[status]}</li>`;
      }).join("")}
    </ol>
  `;
}

function renderEmptyDetail() {
  return `
    <div class="empty-state detail-empty">
      <strong>No request selected</strong>
      <span>Create a request to begin manual product-to-PR tracking.</span>
    </div>
  `;
}

function manualInput(name, label, value) {
  const type = name.includes("url") ? "url" : "text";
  return `
    <label>
      <span>${label}</span>
      <input name="${name}" type="${type}" value="${escapeAttribute(value)}">
    </label>
  `;
}

function bindEvents() {
  app.querySelector("[data-action='create-request']")?.addEventListener("submit", handleCreate);
  app.querySelector("[data-action='filter']")?.addEventListener("input", handleFilter);
  app.querySelector("[data-action='update-request']")?.addEventListener("submit", handleUpdate);

  app.querySelectorAll("[data-select-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.selectId;
      state.detailError = "";
      render();
    });
  });
}

async function handleCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const file = form.elements.screenshot.files[0];

  const errors = validateAgentRequestInput(data);
  if (errors.length > 0) {
    state.formError = errors[0];
    render();
    return;
  }

  try {
    const screenshot = file ? await readScreenshot(file) : null;
    const request = createAgentRequest({ ...data, screenshot }, new Date(), "admin@arogyatika.internal");
    state.requests = [request, ...state.requests];
    state.selectedId = request.id;
    state.formError = "";
    saveRequests(state.requests);
    render();
  } catch (error) {
    state.formError = error.details?.[0] || error.message || "Unable to create request.";
    render();
  }
}

function handleFilter(event) {
  const form = event.currentTarget;
  state.filters = Object.fromEntries(new FormData(form).entries());
  state.detailError = "";
  render();
}

function handleUpdate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.dataset.requestId;
  const existing = state.requests.find((request) => request.id === id);
  if (!existing) return;

  try {
    const updates = Object.fromEntries(new FormData(form).entries());
    const updated = updateAgentRequest(existing, updates, new Date(), "admin@arogyatika.internal");
    state.requests = state.requests.map((request) => (request.id === id ? updated : request));
    state.detailError = "";
    saveRequests(state.requests);
    render();
  } catch (error) {
    state.detailError = error.details?.[0] || error.message || "Unable to update request.";
    render();
  }
}

function readScreenshot(file) {
  const maxBytes = 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Screenshot must be smaller than 1 MB for local-only storage.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result
      });
    });
    reader.addEventListener("error", () => reject(new Error("Unable to read screenshot.")));
    reader.readAsDataURL(file);
  });
}

function renderError(error) {
  app.innerHTML = `
    <main class="fatal-error">
      <h1>Agent Requests could not load</h1>
      <p>${escapeHtml(error.message || "Unknown local storage error.")}</p>
    </main>
  `;
}

function titleCase(value) {
  return (value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
