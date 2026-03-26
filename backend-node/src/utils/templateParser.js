const DEPARTMENT_KEYWORDS = [
  { dept: "Assembly", keywords: ["assembly", "conveyor", "line", "station"] },
  { dept: "Maintenance", keywords: ["maintenance", "motor", "valve", "coolant"] },
  { dept: "Quality", keywords: ["quality", "inspection", "batch", "reinspection"] },
  { dept: "Safety", keywords: ["safety", "sensor", "gate", "hazard"] },
  { dept: "Logistics", keywords: ["logistics", "material", "supply", "delivery"] }
];

const PRIORITY_KEYWORDS = [
  { value: "critical", keywords: ["critical", "urgent", "immediate"] },
  { value: "high", keywords: ["high", "priority", "important"] },
  { value: "medium", keywords: ["medium", "moderate"] },
  { value: "low", keywords: ["low", "minor"] }
];

const ACTION_KEYWORDS = [
  "applied",
  "adjusted",
  "replaced",
  "repaired",
  "notified",
  "halted",
  "recalibrated",
  "isolated",
  "reported",
  "ordered",
  "increased",
  "reduced",
  "fixed"
];

const PENDING_KEYWORDS = [
  "needs",
  "need",
  "pending",
  "schedule",
  "follow up",
  "follow-up",
  "inspection",
  "replace",
  "confirm",
  "monitor",
  "within"
];

const splitSentences = (text) =>
  text
    .split(/[\.\!\?;\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

const detectDepartment = (text) => {
  const lower = text.toLowerCase();
  for (const item of DEPARTMENT_KEYWORDS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.dept;
    }
  }
  return undefined;
};

const detectPriority = (text) => {
  const lower = text.toLowerCase();
  for (const item of PRIORITY_KEYWORDS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.value;
    }
  }
  return undefined;
};

const pickActionSentence = (sentences) => {
  const found = sentences.find((s) =>
    ACTION_KEYWORDS.some((k) => s.toLowerCase().includes(k))
  );
  return found || sentences[1] || sentences[0];
};

const extractPendingTasks = (sentences) =>
  sentences.filter((s) =>
    PENDING_KEYWORDS.some((k) => s.toLowerCase().includes(k))
  );

const extractStructuredFields = (text) => {
  if (!text || typeof text !== "string") {
    return {};
  }

  const sentences = splitSentences(text);
  const issue = sentences[0];
  const actionTaken = pickActionSentence(sentences);
  const pendingTasks = extractPendingTasks(sentences);
  const department = detectDepartment(text);
  const priority = detectPriority(text);

  return {
    issue,
    actionTaken,
    pendingTasks,
    department,
    priority,
    details: text
  };
};

module.exports = {
  extractStructuredFields
};
