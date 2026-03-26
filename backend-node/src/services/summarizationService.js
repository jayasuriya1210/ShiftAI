const generateLogSummary = (structuredLog) => {
  if (!structuredLog) {
    return "";
  }

  const parts = [];
  if (structuredLog.issue) {
    parts.push(`Issue: ${structuredLog.issue}`);
  }
  if (structuredLog.actionTaken) {
    parts.push(`Action: ${structuredLog.actionTaken}`);
  }
  if (structuredLog.pendingTasks && structuredLog.pendingTasks.length > 0) {
    parts.push(`Pending: ${structuredLog.pendingTasks.join("; ")}`);
  }
  if (structuredLog.department) {
    parts.push(`Dept: ${structuredLog.department}`);
  }
  if (structuredLog.priority) {
    parts.push(`Priority: ${structuredLog.priority}`);
  }

  return parts.join(" | ");
};

const generateShiftSummary = (logs, options = {}) => {
  const issues = [];
  const actions = [];
  const pending = [];
  const criticalAlerts = [];
  const supervisors = new Set();

  logs.forEach((log) => {
    if (log.employeeName) {
      supervisors.add(log.employeeName);
    }
    if (log.structuredLog?.issue) {
      issues.push(log.structuredLog.issue);
    }
    if (log.structuredLog?.actionTaken) {
      actions.push(log.structuredLog.actionTaken);
    }
    if (log.structuredLog?.pendingTasks?.length) {
      pending.push(...log.structuredLog.pendingTasks);
    }
    const priority = log.structuredLog?.priority;
    if (priority === "critical" || priority === "high") {
      criticalAlerts.push({
        title: log.structuredLog.issue || "Critical Alert",
        details: log.structuredLog.details || log.rawTranscription || ""
      });
    }
  });

  const summary = {
    shiftLabel: options.shiftLabel,
    dateLabel: options.dateLabel,
    generatedAt: new Date().toISOString(),
    totals: {
      logs: logs.length,
      supervisors: supervisors.size,
      issues: issues.length,
      actions: actions.length,
      pending: pending.length,
      critical: criticalAlerts.length
    },
    sections: {
      issues,
      actions,
      pending,
      criticalAlerts
    }
  };

  const handoverMessageLines = [
    `SHIFT HANDOVER - ${options.shiftLabel || "Shift"} - ${options.dateLabel || ""}`,
    "",
    "KEY ISSUES:",
    ...issues.slice(0, 10).map((i) => `- ${i}`),
    "",
    "PENDING TASKS:",
    ...pending.slice(0, 10).map((p, idx) => `${idx + 1}. ${p}`)
  ];

  summary.handoverMessage = handoverMessageLines.join("\n");

  return summary;
};

module.exports = {
  generateLogSummary,
  generateShiftSummary
};
