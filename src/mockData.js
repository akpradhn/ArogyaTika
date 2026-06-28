export function createMockChildren() {
  return [
    {
      id: "child-demo-1",
      displayName: "Mira",
      dateOfBirth: "2025-09-14",
      avatarTone: "mint",
      updatedAt: "2026-06-22T10:00:00.000Z",
      records: [
        record("mira-bcg", "Birth", "BCG", "1", "2025-09-14", "2025-09-15", "Helps protect against severe tuberculosis.", "clinic_verified"),
        record("mira-hepb", "Birth", "Hepatitis B", "Birth dose", "2025-09-14", "2025-09-14", "Given soon after birth in many schedules.", "clinic_verified"),
        record("mira-opv0", "Birth", "OPV", "Birth dose", "2025-09-14", "2025-09-14", "Polio protection starts early.", "clinic_verified"),
        record("mira-penta1", "6 Weeks", "Pentavalent", "1", "2025-10-26", "2025-10-27", "Combined protection commonly given at this stage.", "clinic_verified"),
        record("mira-rota1", "6 Weeks", "Rotavirus", "1", "2025-10-26", "2025-10-27", "Helps protect against severe rotavirus illness.", "clinic_verified"),
        record("mira-pcv1", "6 Weeks", "PCV", "1", "2025-10-26", "2025-10-27", "Helps protect against pneumococcal disease.", "clinic_verified"),
        record("mira-penta2", "10 Weeks", "Pentavalent", "2", "2025-11-23", "2025-11-25", "Second dose in the series.", "clinic_verified"),
        record("mira-rota2", "10 Weeks", "Rotavirus", "2", "2025-11-23", "2025-11-25", "Second dose in the series.", "clinic_verified"),
        record("mira-pcv2", "10 Weeks", "PCV", "2", "2025-11-23", "2025-11-25", "Second dose in the series.", "clinic_verified"),
        record("mira-penta3", "14 Weeks", "Pentavalent", "3", "2025-12-21", "2025-12-22", "Third dose in the series.", "self_reported"),
        record("mira-ipv", "14 Weeks", "IPV", "1", "2025-12-21", "", "Polio vaccine dose due at this stage.", "schedule"),
        record("mira-flu", "6 Months", "Influenza", "1", "2026-03-14", "", "Ask your clinic whether this is recommended for your child.", "schedule"),
        record("mira-mr1", "9 Months", "MR", "1", "2026-06-14", "", "Measles and rubella protection.", "schedule"),
        record("mira-je1", "9 Months", "Japanese Encephalitis", "1", "2026-07-03", "", "May depend on local guidance.", "schedule"),
        record("mira-hepa", "12 Months", "Hepatitis A", "1", "2026-09-14", "", "Check availability and guidance with your clinic.", "schedule"),
        record("mira-dptb", "18 Months", "DPT Booster", "1", "2027-03-14", "", "Booster dose at this stage.", "schedule"),
        record("mira-typhoid", "2 Years", "Typhoid", "1", "2027-09-14", "", "Later protection to discuss with your doctor.", "schedule")
      ],
      reminders: [
        {
          id: "reminder-mira-je",
          vaccineName: "Japanese Encephalitis",
          date: "2026-07-01",
          status: "On",
          channel: "SMS and email"
        }
      ],
      recordUpdateEvents: []
    },
    {
      id: "child-demo-2",
      displayName: "Dev",
      dateOfBirth: "2024-02-08",
      avatarTone: "coral",
      updatedAt: "2026-06-19T12:00:00.000Z",
      records: [
        record("dev-bcg", "Birth", "BCG", "1", "2024-02-08", "2024-02-09", "Birth dose recorded.", "clinic_verified"),
        record("dev-hepb", "Birth", "Hepatitis B", "Birth dose", "2024-02-08", "2024-02-08", "Birth dose recorded.", "clinic_verified"),
        record("dev-penta1", "6 Weeks", "Pentavalent", "1", "2024-03-21", "2024-03-22", "First dose in the series.", "clinic_verified"),
        record("dev-penta2", "10 Weeks", "Pentavalent", "2", "2024-04-18", "2024-04-20", "Second dose in the series.", "clinic_verified"),
        record("dev-penta3", "14 Weeks", "Pentavalent", "3", "2024-05-16", "2024-05-18", "Third dose in the series.", "clinic_verified"),
        record("dev-mr1", "9 Months", "MR", "1", "2024-11-08", "2024-11-12", "First MR dose recorded.", "clinic_verified"),
        record("dev-dptb", "18 Months", "DPT Booster", "1", "2025-08-08", "", "Booster dose can still be discussed with your clinic.", "schedule"),
        record("dev-typhoid", "2 Years", "Typhoid", "1", "2026-02-08", "", "Later protection to discuss with your doctor.", "schedule"),
        record("dev-flu", "Later Boosters", "Influenza", "Yearly", "2026-07-09", "", "Ask your doctor whether a yearly dose is recommended.", "schedule")
      ],
      reminders: [
        {
          id: "reminder-dev-flu",
          vaccineName: "Influenza",
          date: "2026-07-05",
          status: "On",
          channel: "Email"
        }
      ],
      recordUpdateEvents: []
    }
  ];
}

function record(id, stage, vaccineName, doseNumber, recommendedDate, actualDate, explanation, source) {
  return {
    id,
    stage,
    vaccineName,
    doseNumber,
    recommendedDate,
    actualDate,
    status: actualDate ? "completed" : "scheduled",
    explanation,
    source
  };
}
