export const VACCINE_STATUSES = [
  "completed",
  "due_soon",
  "due_today",
  "overdue",
  "scheduled",
  "deferred",
  "not_applicable"
];

export const STATUS_LABELS = {
  completed: "Completed",
  due_soon: "Due Soon",
  due_today: "Due Today",
  overdue: "Overdue",
  scheduled: "Scheduled",
  deferred: "Deferred",
  not_applicable: "Not Applicable"
};

export const STAGES = [
  "Birth",
  "6 Weeks",
  "10 Weeks",
  "14 Weeks",
  "6 Months",
  "9 Months",
  "12 Months",
  "18 Months",
  "2 Years",
  "Later Boosters"
];

export function createDashboardSnapshot(child, today = new Date()) {
  const records = child.records.map((record) => ({
    ...record,
    status: resolveRecordStatus(record, today)
  }));
  const actionableRecords = records.filter((record) => record.status !== "not_applicable");
  const completed = actionableRecords.filter((record) => record.status === "completed");
  const overdue = actionableRecords.filter((record) => record.status === "overdue");
  const dueThisWeek = actionableRecords.filter((record) =>
    ["due_soon", "due_today"].includes(record.status)
  );
  const upcoming = actionableRecords
    .filter((record) => !["completed", "overdue"].includes(record.status))
    .sort((a, b) => new Date(a.recommendedDate) - new Date(b.recommendedDate));
  const nextDue =
    upcoming[0] ||
    actionableRecords
      .filter((record) => record.status === "overdue")
      .sort((a, b) => new Date(a.recommendedDate) - new Date(b.recommendedDate))[0];

  return {
    child: {
      ...child,
      records
    },
    progress: Math.round((completed.length / Math.max(actionableRecords.length, 1)) * 100),
    completedCount: completed.length,
    totalCount: actionableRecords.length,
    overdue,
    dueThisWeek,
    nextDue,
    upcomingReminder: getUpcomingReminder(child.reminders, today),
    recommendedAction: buildRecommendedAction(nextDue, overdue, today)
  };
}

export function addCompletedDose(child, input, now = new Date()) {
  const normalized = normalizeDoseInput(input);
  const errors = validateDoseInput(normalized);
  if (errors.length > 0) {
    const error = new Error("Vaccination record is invalid.");
    error.details = errors;
    throw error;
  }

  const existing = child.records.find(
    (record) =>
      record.vaccineName === normalized.vaccineName &&
      String(record.doseNumber) === String(normalized.doseNumber)
  );

  const updateEvent = {
    id: createId(now),
    at: now.toISOString(),
    vaccineName: normalized.vaccineName,
    doseNumber: normalized.doseNumber,
    dateGiven: normalized.dateGiven,
    clinic: normalized.clinic,
    notes: normalized.notes,
    cardUploadName: normalized.cardUploadName,
    source: "self_reported"
  };

  if (existing?.actualDate) {
    return {
      ...child,
      recordUpdateEvents: [...(child.recordUpdateEvents || []), updateEvent],
      updatedAt: now.toISOString(),
      lastNotice:
        "A completed dose already exists. Your new details were saved as a self-reported note without replacing the original record."
    };
  }

  const records = existing
    ? child.records.map((record) =>
        record.id === existing.id
          ? {
              ...record,
              actualDate: normalized.dateGiven,
              status: "completed",
              clinic: normalized.clinic,
              notes: normalized.notes,
              source: "self_reported"
            }
          : record
      )
    : [
        ...child.records,
        {
          id: createId(now),
          stage: "Later Boosters",
          vaccineName: normalized.vaccineName,
          doseNumber: normalized.doseNumber,
          recommendedDate: normalized.dateGiven,
          actualDate: normalized.dateGiven,
          status: "completed",
          explanation: "Added by parent or guardian. Please verify with your clinic if needed.",
          clinic: normalized.clinic,
          notes: normalized.notes,
          source: "self_reported"
        }
      ];

  return {
    ...child,
    records,
    recordUpdateEvents: [...(child.recordUpdateEvents || []), updateEvent],
    updatedAt: now.toISOString(),
    lastNotice: "Self-reported vaccination record saved."
  };
}

export function validateDoseInput(input) {
  const errors = [];

  if (!input.vaccineName || input.vaccineName.length < 2) {
    errors.push("Vaccine name is required.");
  }

  if (!input.doseNumber) {
    errors.push("Dose number is required.");
  }

  if (!input.dateGiven || Number.isNaN(new Date(input.dateGiven).getTime())) {
    errors.push("Date given is required.");
  }

  return errors;
}

export function groupRecordsByStage(records) {
  return STAGES.map((stage) => ({
    stage,
    records: records.filter((record) => record.stage === stage)
  })).filter((group) => group.records.length > 0);
}

export function getCurrentAge(dateOfBirth, today = new Date()) {
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;

  if (months < 1) return "Under 1 month";
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const extraMonths = months % 12;
  if (extraMonths === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"}, ${extraMonths} month${extraMonths === 1 ? "" : "s"}`;
}

export function formatRelativeDueDate(date, today = new Date()) {
  const diff = daysBetween(today, new Date(`${date}T00:00:00`));
  const abs = Math.abs(diff);

  if (diff === 0) return "Due today";
  if (diff > 0) return `Due in ${diff} day${diff === 1 ? "" : "s"}`;
  return `Overdue by ${abs} day${abs === 1 ? "" : "s"}`;
}

function resolveRecordStatus(record, today) {
  if (record.status === "not_applicable" || record.status === "deferred") return record.status;
  if (record.actualDate) return "completed";

  const diff = daysBetween(today, new Date(`${record.recommendedDate}T00:00:00`));
  if (diff < 0) return "overdue";
  if (diff === 0) return "due_today";
  if (diff <= 7) return "due_soon";
  return record.status || "scheduled";
}

function getUpcomingReminder(reminders, today) {
  return reminders
    .filter((reminder) => new Date(`${reminder.date}T00:00:00`) >= startOfDay(today))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
}

function buildRecommendedAction(nextDue, overdue, today) {
  if (overdue.length > 0) {
    return `Book or confirm ${overdue[0].vaccineName}. ${formatRelativeDueDate(
      overdue[0].recommendedDate,
      today
    )}.`;
  }

  if (nextDue) {
    return `${nextDue.vaccineName} is ${formatRelativeDueDate(
      nextDue.recommendedDate,
      today
    ).toLowerCase()}. Talk to your doctor if you are unsure.`;
  }

  return "Vaccination record looks complete for the current schedule. Keep future boosters in mind.";
}

function normalizeDoseInput(input = {}) {
  return {
    vaccineName: clean(input.vaccineName),
    doseNumber: clean(input.doseNumber),
    dateGiven: clean(input.dateGiven),
    clinic: clean(input.clinic),
    notes: clean(input.notes),
    cardUploadName: clean(input.cardUploadName)
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
  return `vac-${entropy}`;
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysBetween(today, target) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(target) - startOfDay(today)) / msPerDay);
}
