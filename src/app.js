import {
  STATUS_LABELS,
  addCompletedDose,
  createDashboardSnapshot,
  formatRelativeDueDate,
  getCurrentAge,
  groupRecordsByStage,
  validateDoseInput
} from "./vaccineDashboard.js";
import { createMockChildren } from "./mockData.js";
import {
  clearAuthSession,
  createDemoAuthSession,
  isClerkConfigured,
  loadAuthSession,
  saveAuthSession,
  validateAuthInput
} from "./auth.js";

const STORAGE_KEY = "arogyatika.parentVaccineDashboard.v1";
const TODAY = new Date("2026-06-28T10:00:00.000Z");
const app = document.querySelector("#app");

const state = {
  authSession: null,
  children: [],
  selectedChildId: "",
  authMode: "sign-in",
  authError: "",
  mode: "dashboard",
  recordDraft: null,
  notice: "",
  formError: "",
  isLoading: true,
  loadError: ""
};

init();

function init() {
  try {
    state.authSession = loadAuthSession();
    state.children = loadChildren();
    state.selectedChildId = state.children[0]?.id || "";
  } catch (error) {
    state.loadError = error.message || "Unable to load vaccination records.";
  }

  state.isLoading = false;
  render();
}

function loadChildren() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = createMockChildren();
    saveChildren(seeded);
    return seeded;
  }

  const parsed = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed : [];
}

function saveChildren(children) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
}

function render() {
  if (state.isLoading) {
    app.innerHTML = renderLoading();
    return;
  }

  if (state.loadError) {
    app.innerHTML = renderError(state.loadError);
    bindEvents();
    return;
  }

  if (!state.authSession) {
    app.innerHTML = renderAuthPage();
    bindAuthEvents();
    return;
  }

  if (state.children.length === 0) {
    app.innerHTML = renderNoChild();
    bindEvents();
    return;
  }

  const child = getSelectedChild();
  const snapshot = createDashboardSnapshot(child, TODAY);

  app.innerHTML = `
    <div class="signed-in-shell">
      ${renderSidebar()}
      <section class="content-page">
        <header class="overview-header">
          <div>
            <h1>Overview</h1>
          </div>
          <div class="overview-controls">
            ${renderChildSwitcher()}
          </div>
        </header>
        <main class="overview-workspace">
          <section class="overview-main">
            ${state.notice ? `<p class="notice" role="status">${escapeHtml(state.notice)}</p>` : ""}
            ${renderStatusCards(snapshot)}
            <section class="timeline-panel">
              <div class="section-heading">
                <h2>Vaccination Timeline</h2>
                <span>Schedule guidance should be verified with a healthcare professional.</span>
              </div>
              ${renderTimeline(snapshot.child.records)}
              <button type="button" class="full-schedule-button" data-action="view-record">View Full Schedule</button>
            </section>
            ${renderRecommendation(snapshot)}
          </section>
          <aside class="record-rail">
            ${renderRecordForm(snapshot.child)}
            ${renderReminder(snapshot)}
            ${renderHistory(snapshot.child)}
          </aside>
        </main>
      </section>
    </div>
  `;

  bindEvents();
}

function renderSidebar() {
  return `
    <aside class="app-sidebar" aria-label="Primary navigation">
      <div class="brand-lockup">
        <span class="brand-mark" aria-hidden="true">+</span>
        <strong>ArogyaTika</strong>
      </div>
      <nav class="sidebar-nav">
        <a class="active" href="#overview">Overview</a>
        <a href="#schedule">Schedule</a>
        <a href="#records">Vaccine Record</a>
        <a href="#reminders">Reminders</a>
        <a href="#documents">Documents</a>
        <a href="#children">Children</a>
        <a href="#settings">Settings</a>
        <a href="#help">Help & Support</a>
      </nav>
      <div class="sidebar-profile">
        <div class="mini-avatar" aria-hidden="true">${escapeHtml(state.authSession.displayName.charAt(0))}</div>
        <div>
          <strong>${escapeHtml(state.authSession.displayName)}</strong>
          <span>Parent</span>
          <button type="button" class="text-button sidebar-sign-out" data-action="sign-out">Sign Out</button>
        </div>
      </div>
    </aside>
  `;
}

function renderAuthPage() {
  const clerkReady = isClerkConfigured();

  return `
    <main class="auth-page">
      <section class="auth-card" aria-label="Authentication">
        <div class="auth-brand">
          <span class="brand-mark" aria-hidden="true">+</span>
          <strong>ArogyaTika</strong>
        </div>
        <div>
          <p class="eyebrow">${clerkReady ? "Clerk ready" : "Demo mode"}</p>
          <h1>${state.authMode === "sign-up" ? "Create account" : "Welcome back"}</h1>
        </div>

        <div id="clerk-auth-slot" class="clerk-slot" data-clerk-configured="${clerkReady}">
          ${clerkReady ? "Ready for ClerkJS" : "Local demo access"}
        </div>

        <form class="auth-form" data-action="demo-auth">
          ${state.authError ? `<p class="error-text">${escapeHtml(state.authError)}</p>` : ""}
          <label>
            <span>Parent or guardian name</span>
            <input name="displayName" autocomplete="name" placeholder="Demo Parent">
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" placeholder="parent@example.test" required>
          </label>
          <button type="submit">${state.authMode === "sign-up" ? "Create Demo Account" : "Continue with Demo Access"}</button>
        </form>

        <button type="button" class="text-button auth-toggle" data-action="toggle-auth-mode">
          ${state.authMode === "sign-up" ? "Already have access? Sign in" : "Need access? Create an account"}
        </button>
      </section>
    </main>
  `;
}

function renderAccountSummary() {
  return `
    <div class="account-summary">
      <div class="mini-avatar" aria-hidden="true">${escapeHtml(state.authSession.displayName.charAt(0))}</div>
      <strong>${escapeHtml(state.authSession.displayName)}</strong>
    </div>
  `;
}

function renderChildSwitcher() {
  const child = getSelectedChild();

  return `
    <div class="child-switcher">
      <div class="mini-avatar child-mini ${child.avatarTone}" aria-hidden="true">${escapeHtml(child.displayName.charAt(0))}</div>
      <select id="child-select" data-action="select-child">
        ${state.children
          .map(
            (child) =>
              `<option value="${child.id}"${child.id === state.selectedChildId ? " selected" : ""}>${escapeHtml(child.displayName)}</option>`
          )
          .join("")}
      </select>
    </div>
  `;
}

function renderChildHeader(snapshot) {
  const child = snapshot.child;
  const nextDue = snapshot.nextDue;

  return `
    <section class="hero">
      <div class="profile-block">
        <div class="avatar ${child.avatarTone}" aria-hidden="true">${escapeHtml(child.displayName.charAt(0))}</div>
        <div>
          <p class="eyebrow">Selected child</p>
          <h2>${escapeHtml(child.displayName)}</h2>
          <p class="soft-text profile-meta">
            <span>Date of birth: ${formatDate(child.dateOfBirth)}</span>
            <span>Current age: ${getCurrentAge(child.dateOfBirth, TODAY)}</span>
          </p>
        </div>
      </div>
      <div class="progress-block" aria-label="Vaccination progress">
        <div class="progress-ring" style="--progress:${snapshot.progress}">
          <strong>${snapshot.progress}%</strong>
          <span>complete</span>
        </div>
        <p>${snapshot.completedCount} of ${snapshot.totalCount} vaccines completed or recorded.</p>
      </div>
      <div class="next-action">
        <span>Next vaccine due</span>
        <strong>${nextDue ? escapeHtml(nextDue.vaccineName) : "No upcoming dose"}</strong>
        <p>${nextDue ? formatRelativeDueDate(nextDue.recommendedDate, TODAY) : "Keep future boosters in mind."}</p>
        <button type="button" data-action="view-record">View Full Vaccine Record</button>
      </div>
    </section>
  `;
}

function renderStatusCards(snapshot) {
  const next = snapshot.nextDue;
  const dueThisWeek = snapshot.dueThisWeek.length;
  const overdue = snapshot.overdue.length;

  return `
    <section class="status-grid" aria-label="Vaccination status summary">
      ${statusCard("Next Vaccine Due", next?.vaccineName || "None right now", next ? formatRelativeDueDate(next.recommendedDate, TODAY) : "No action today", "calm")}
      ${statusCard("Due This Week", String(dueThisWeek), "Vaccine", "week")}
      ${statusCard("Overdue", String(overdue), `Vaccine${overdue === 1 ? "" : "s"}`, overdue ? "overdue" : "calm")}
      ${statusCard("Completed", `${snapshot.completedCount} / ${snapshot.totalCount}`, "Doses", "done")}
    </section>
  `;
}

function renderRecommendation(snapshot) {
  return `
    <section class="recommendation">
      <strong>Recommended action</strong>
      <p>${escapeHtml(snapshot.recommendedAction)} This dashboard does not provide medical diagnosis or medical advice.</p>
    </section>
  `;
}

function statusCard(title, value, detail, tone) {
  return `
    <article class="status-card ${tone}">
      <span>${title}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
    </article>
  `;
}

function renderTimeline(records) {
  if (records.length === 0) {
    return `
      <div class="empty-state">
        <strong>No vaccination records yet</strong>
        <p>Add a completed dose from a vaccination card or ask your clinic for help.</p>
      </div>
    `;
  }

  return `
    <ol class="timeline">
      ${getTimelinePreview(records).map(renderDose).join("")}
    </ol>
  `;
}

function renderDose(record) {
  const completed = record.status === "completed";
  const selfReported = record.source === "self_reported";
  const actionLabel = completed || record.status === "overdue" ? "View Details" : "Set Reminder";
  const statusText =
    record.status === "overdue"
      ? formatRelativeDueDate(record.recommendedDate, TODAY)
      : STATUS_LABELS[record.status];

  return `
    <li class="dose ${record.status}">
      <span class="timeline-dot ${record.status}" aria-hidden="true"></span>
      <div class="dose-name">
        <div class="dose-title">
          <strong>${escapeHtml(record.vaccineName)}</strong>
          <span>Dose ${escapeHtml(record.doseNumber)}</span>
        </div>
        ${selfReported ? `<em class="self-reported">Self-reported by parent or guardian</em>` : ""}
      </div>
      <div class="dose-meta">
        <small>${formatDateShort(record.actualDate || record.recommendedDate)}</small>
        <span class="status-pill ${record.status}">${escapeHtml(statusText)}</span>
        <button type="button" class="outline-button" data-action="${completed ? "add-note" : "complete-dose"}" data-vaccine="${escapeAttribute(record.vaccineName)}" data-dose="${escapeAttribute(record.doseNumber)}">${actionLabel}</button>
      </div>
    </li>
  `;
}

function renderReminder(snapshot) {
  const reminder = snapshot.upcomingReminder;

  return `
    <section class="panel reminder-panel">
      <div class="section-heading">
        <h2>Reminder</h2>
        <button type="button" class="text-button" data-action="edit-reminder">Edit</button>
      </div>
      ${
        reminder
          ? `<strong>${escapeHtml(reminder.vaccineName)}</strong><p>${formatDate(reminder.date)} - ${escapeHtml(reminder.channel)} - ${escapeHtml(reminder.status)}</p>`
          : `<p>No reminder is set. You can add one for the next vaccine.</p>`
      }
      <button type="button" data-action="edit-reminder">Enable Reminder Preferences</button>
    </section>
  `;
}

function renderActions(snapshot) {
  return `
    <section class="panel action-panel">
      <h2>Parent Actions</h2>
      <div class="action-grid">
        <button type="button" data-action="open-record-form">Add / Update Record</button>
        <button type="button" data-action="upload-card">Upload Card Photo</button>
        <button type="button" data-action="edit-reminder">Add Reminder</button>
        <button type="button" data-action="download-summary">Share / Download Summary</button>
        <button type="button" data-action="ask-clinic">Ask Clinic for Help</button>
      </div>
      <p class="helper-text">Parent-entered updates are marked as self-reported until a clinic verifies them.</p>
    </section>
  `;
}

function renderRecordForm(child) {
  const draft = state.recordDraft;
  const openRecord =
    (draft &&
      child.records.find(
        (record) =>
          record.vaccineName === draft.vaccineName &&
          String(record.doseNumber) === String(draft.doseNumber)
      )) ||
    child.records
      .filter((record) => record.status !== "completed" && new Date(`${record.recommendedDate}T00:00:00`) >= TODAY)
      .sort((a, b) => new Date(a.recommendedDate) - new Date(b.recommendedDate))[0] ||
    child.records.find((record) => record.status !== "completed") ||
    child.records[0];

  return `
    <form class="panel record-form" data-action="save-record">
      <div class="section-heading">
        <h2><span aria-hidden="true">←</span> Add / Update Vaccine Record</h2>
        <button type="button" class="text-button" data-action="close-form">Reset</button>
      </div>
      ${state.formError ? `<p class="error-text">${escapeHtml(state.formError)}</p>` : ""}
      <label>
        <span>Vaccine</span>
        <select name="vaccineName" required>
          ${child.records
            .map(
              (record) =>
                `<option value="${escapeAttribute(record.vaccineName)}"${record.id === openRecord?.id ? " selected" : ""}>${escapeHtml(record.vaccineName)} - Dose ${escapeHtml(record.doseNumber)}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Dose number</span>
        <input name="doseNumber" value="${escapeAttribute(openRecord?.doseNumber || "")}" required>
      </label>
      <label>
        <span>Date given</span>
        <input name="dateGiven" type="date" required>
      </label>
      <label>
        <span>Clinic or hospital (optional)</span>
        <input name="clinic" placeholder="Clinic name">
      </label>
      <label>
        <span>Vaccination card upload (optional)</span>
        <input name="cardUpload" type="file" accept="image/png,image/jpeg,image/webp,application/pdf">
      </label>
      <label>
        <span>Notes (optional)</span>
        <textarea name="notes" rows="3" placeholder="Add anything helpful for your family or clinic."></textarea>
      </label>
      <label class="confirm-row">
        <input name="selfReported" type="checkbox" checked>
        <span>I confirm this is a self-reported record</span>
      </label>
      <button type="submit">Save Record</button>
      <p class="helper-text">Self-reported records are labeled and do not overwrite clinic records.</p>
    </form>
  `;
}

function getTimelinePreview(records) {
  const completed = records.filter((record) => record.status === "completed").slice(0, 3);
  const upcoming = records
    .filter((record) => record.status !== "completed" && record.status !== "overdue")
    .sort((a, b) => new Date(a.recommendedDate) - new Date(b.recommendedDate))
    .slice(0, 1);
  const overdue = records
    .filter((record) => record.status === "overdue")
    .sort((a, b) => new Date(b.recommendedDate) - new Date(a.recommendedDate))
    .slice(0, 2);
  return [...completed, ...upcoming, ...overdue];
}

function renderHistory(child) {
  const events = child.recordUpdateEvents || [];

  return `
    <section class="panel history-panel">
      <h2>Recent Updates</h2>
      ${
        events.length === 0
          ? `<p>No parent-entered updates yet.</p>`
          : `<ol>${events
              .slice()
              .reverse()
              .map(
                (event) =>
                  `<li><strong>${escapeHtml(event.vaccineName)} dose ${escapeHtml(event.doseNumber)}</strong><span>${formatDate(event.dateGiven)} - Self-reported</span></li>`
              )
              .join("")}</ol>`
      }
    </section>
  `;
}

function renderLoading() {
  return `
    <main class="center-state">
      <strong>Loading vaccination dashboard...</strong>
      <p>Preparing a private family view.</p>
    </main>
  `;
}

function renderError(message) {
  return `
    <main class="center-state">
      <strong>We could not load records</strong>
      <p>${escapeHtml(message)}</p>
      <button type="button" data-action="reset-demo">Reset Demo Data</button>
    </main>
  `;
}

function renderNoChild() {
  return `
    <main class="center-state">
      <strong>No child profile yet</strong>
      <p>Add a child profile to start tracking vaccines. Use only your own family records.</p>
      <button type="button" data-action="add-child">Add Child</button>
    </main>
  `;
}

function bindEvents() {
  app.querySelector("[data-action='sign-out']")?.addEventListener("click", () => {
    clearAuthSession();
    state.authSession = null;
    state.notice = "";
    state.authError = "";
    render();
  });

  app.querySelector("[data-action='select-child']")?.addEventListener("change", (event) => {
    state.selectedChildId = event.target.value;
    state.mode = "dashboard";
    state.notice = "";
    render();
  });

  app.querySelectorAll("[data-action='add-child']").forEach((button) => {
    button.addEventListener("click", addMockChild);
  });

  app.querySelectorAll("[data-action='open-record-form'], [data-action='upload-card']").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = "record-form";
      state.formError = "";
      state.notice = "";
      render();
    });
  });

  app.querySelectorAll("[data-action='complete-dose'], [data-action='add-note']").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = "record-form";
      state.recordDraft = {
        vaccineName: button.dataset.vaccine,
        doseNumber: button.dataset.dose
      };
      state.formError = "";
      state.notice = `Preparing a self-reported update for ${button.dataset.vaccine} dose ${button.dataset.dose}.`;
      render();
    });
  });

  app.querySelector("[data-action='save-record']")?.addEventListener("submit", handleSaveRecord);
  app.querySelector("[data-action='close-form']")?.addEventListener("click", () => {
    state.mode = "dashboard";
    state.recordDraft = null;
    state.formError = "";
    render();
  });

  app.querySelectorAll("[data-action='edit-reminder']").forEach((button) => {
    button.addEventListener("click", () => {
      state.notice = "Reminder preferences are a placeholder in this prototype. No message was sent.";
      render();
    });
  });

  app.querySelector("[data-action='download-summary']")?.addEventListener("click", downloadSummary);
  app.querySelector("[data-action='ask-clinic']")?.addEventListener("click", () => {
    state.notice = "Clinic help is a placeholder. Please contact your healthcare professional directly for medical questions.";
    render();
  });
  app.querySelector("[data-action='view-record']")?.addEventListener("click", () => {
    document.querySelector(".timeline-panel")?.scrollIntoView({ behavior: "smooth" });
  });
  app.querySelector("[data-action='reset-demo']")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state.loadError = "";
    init();
  });
}

function bindAuthEvents() {
  app.querySelector("[data-action='demo-auth']")?.addEventListener("submit", handleDemoAuth);
  app.querySelector("[data-action='toggle-auth-mode']")?.addEventListener("click", () => {
    state.authMode = state.authMode === "sign-in" ? "sign-up" : "sign-in";
    state.authError = "";
    render();
  });
}

function handleDemoAuth(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const errors = validateAuthInput(data);

  if (errors.length > 0) {
    state.authError = errors[0];
    render();
    return;
  }

  try {
    const session = createDemoAuthSession(data, new Date());
    saveAuthSession(session);
    state.authSession = session;
    state.authError = "";
    state.notice = "Signed in with local demo access. Connect Clerk before using real records.";
    render();
  } catch (error) {
    state.authError = error.details?.[0] || error.message || "Could not start demo access.";
    render();
  }
}

function handleSaveRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  data.cardUploadName = form.elements.cardUpload.files[0]?.name || "";

  const errors = validateDoseInput(data);
  if (errors.length > 0) {
    state.formError = errors[0];
    render();
    return;
  }

  try {
    const child = getSelectedChild();
    const updated = addCompletedDose(child, data, new Date());
    state.children = state.children.map((item) => (item.id === child.id ? updated : item));
    state.notice = updated.lastNotice;
    state.mode = "dashboard";
    state.recordDraft = null;
    state.formError = "";
    saveChildren(state.children);
    render();
  } catch (error) {
    state.formError = error.details?.[0] || error.message || "Could not save record.";
    render();
  }
}

function addMockChild() {
  const nextNumber = state.children.length + 1;
  const child = {
    id: `child-demo-${Date.now()}`,
    displayName: `Demo Child ${nextNumber}`,
    dateOfBirth: "2026-01-10",
    avatarTone: "gold",
    updatedAt: new Date().toISOString(),
    records: [],
    reminders: [],
    recordUpdateEvents: []
  };

  state.children = [...state.children, child];
  state.selectedChildId = child.id;
  state.notice = "New empty child profile added with no records.";
  saveChildren(state.children);
  render();
}

function downloadSummary() {
  const snapshot = createDashboardSnapshot(getSelectedChild(), TODAY);
  const lines = [
    `Vaccination summary for ${snapshot.child.displayName}`,
    `Progress: ${snapshot.progress}%`,
    `Recommended action: ${snapshot.recommendedAction}`,
    "This summary uses mock/local records and should be verified with a healthcare professional."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${snapshot.child.displayName.toLowerCase()}-vaccine-summary.txt`;
  link.click();
  URL.revokeObjectURL(url);
  state.notice = "Summary downloaded locally. No data was sent anywhere.";
  render();
}

function getSelectedChild() {
  return state.children.find((child) => child.id === state.selectedChildId) || state.children[0];
}

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateShort(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
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
