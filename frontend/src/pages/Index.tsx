import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Mic, FileText, AlertTriangle, CheckCircle, Brain, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";

type Note = {
  id: string;
  title: string;
  transcript: string;
  source: "recorded" | "uploaded";
  fileName?: string | null;
  durationSec?: number | null;
  createdAt: string;
};
type Issue = {
  id: string;
  issue: string;
  status: "pending" | "resolved";
  priority?: string | null;
  createdAt: string;
  updatedAt: string;
  employeeName?: string;
  shiftType?: string;
};

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const toSnippet = (text: string, max = 140) => {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3)}...`;
};

const Dashboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueUpdating, setIssueUpdating] = useState<string | null>(null);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "checking">("checking");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [noteData, issueData] = await Promise.all([
          apiFetch<Note[]>("/api/notes?limit=50"),
          apiFetch<Issue[]>("/api/issues?limit=50")
        ]);
        if (!alive) return;
        setNotes(noteData);
        setIssues(issueData);
        setLastUpdated(new Date());
      } catch {
        if (!alive) return;
      }
    };

    const checkApi = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(`${API_BASE}/`, { signal: controller.signal });
        if (!alive) return;
        setApiStatus(response.ok ? "online" : "offline");
      } catch {
        if (!alive) return;
        setApiStatus("offline");
      } finally {
        window.clearTimeout(timeout);
      }
    };

    load();
    checkApi();

    const interval = window.setInterval(() => {
      load();
      checkApi();
    }, 10000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const readRecording = () => {
      const active = localStorage.getItem("shiftai_recording_active") === "true";
      const startedAtRaw = localStorage.getItem("shiftai_recording_started_at");
      const startedAt = startedAtRaw ? Number(startedAtRaw) : 0;
      setRecordingActive(active);
      if (active && Number.isFinite(startedAt) && startedAt > 0) {
        const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        setRecordingSeconds(elapsed);
      } else {
        setRecordingSeconds(0);
      }
    };

    readRecording();
    const interval = window.setInterval(readRecording, 1000);
    window.addEventListener("storage", readRecording);
    window.addEventListener("shiftai-recording", readRecording);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", readRecording);
      window.removeEventListener("shiftai-recording", readRecording);
    };
  }, []);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const todayNotes = notes.filter((note) => new Date(note.createdAt) >= todayStart);
  const yesterdayNotes = notes.filter((note) => {
    const created = new Date(note.createdAt);
    return created >= yesterdayStart && created < todayStart;
  });

  const logsToday = todayNotes.length;
  const logsYesterday = yesterdayNotes.length;
  const logsDiff = logsToday - logsYesterday;
  const logsTrend = logsYesterday > 0 ? `${logsDiff >= 0 ? "+" : ""}${logsDiff} from yesterday` : "No logs yesterday";

  const pendingIssues = issues.filter((issue) => issue.status !== "resolved").length;
  const resolvedToday = issues.filter((issue) => {
    if (issue.status !== "resolved") return false;
    return new Date(issue.updatedAt) >= todayStart;
  });
  const criticalToday = issues.filter((issue) => issue.priority === "critical");

  const resolutionRate = issues.length > 0
    ? Math.round((resolvedToday.length / issues.length) * 100)
    : null;

  const latestNote = notes[0];
  const highlightText = latestNote
    ? toSnippet(latestNote.transcript || latestNote.title, 160)
    : "No notes yet.";
  const criticalIssue = issues.find((issue) => issue.priority === "critical") || issues[0];
  const criticalText = criticalIssue
    ? toSnippet(criticalIssue.issue, 140)
    : "No critical alerts detected.";

  const lastNoteTime = latestNote ? formatTime(latestNote.createdAt) : null;
  const liveStatus = recordingActive
    ? `Session active - ${formatDuration(recordingSeconds)} elapsed`
    : lastNoteTime
    ? `Last transcription - ${lastNoteTime}`
    : "No recordings yet";

  const toggleIssueStatus = async (issue: Issue) => {
    const nextStatus = issue.status === "resolved" ? "pending" : "resolved";
    setIssueUpdating(issue.id);
    try {
      await apiFetch(`/api/issues/${issue.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      });
      const updatedAt = new Date().toISOString();
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issue.id
            ? { ...item, status: nextStatus, updatedAt }
            : item
        )
      );
    } catch {
      // ignore
    } finally {
      setIssueUpdating(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Shift A Overview - Real-time monitoring</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">Live feed updated at {formatTime(lastUpdated)}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                apiStatus === "online"
                  ? "bg-neon-green/10 text-neon-green"
                  : apiStatus === "offline"
                  ? "bg-neon-red/10 text-neon-red"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              API {apiStatus === "online" ? "online" : apiStatus === "offline" ? "offline" : "checking"}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Voice Recording"
            value={recordingActive ? "LIVE" : "READY"}
            icon={<Mic className="w-5 h-5" />}
            trend={recordingActive ? "Active session" : undefined}
            trendUp={recordingActive}
            glowColor="blue"
          />
          <StatCard
            title="Today's Logs"
            value={logsToday}
            icon={<FileText className="w-5 h-5" />}
            trend={logsTrend}
            trendUp={logsDiff >= 0}
            glowColor="purple"
          />
          <StatCard
            title="Pending Issues"
            value={pendingIssues}
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={criticalToday.length > 0 ? `${criticalToday.length} critical` : "No critical alerts"}
            trendUp={pendingIssues === 0}
            glowColor="amber"
          />
          <StatCard
            title="Resolved Today"
            value={resolvedToday.length}
            icon={<CheckCircle className="w-5 h-5" />}
            trend={resolutionRate !== null ? `${resolutionRate}% resolution rate` : "No issues logged"}
            trendUp={resolutionRate !== null ? resolutionRate >= 50 : true}
            glowColor="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* AI Summary Preview */}
          <div className="lg:col-span-1 glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-semibold text-foreground">AI Summary Preview</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Latest Note</p>
                <p className="text-sm text-foreground">{highlightText}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Critical Alert</p>
                <p className="text-sm text-neon-amber">{criticalText}</p>
              </div>
            </div>
            <Link
              to="/shift-logs"
              className="w-full block text-center py-2 rounded-lg gradient-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              View Full Summary
            </Link>
          </div>

          {/* Recent Shift Notes Timeline */}
          <div className="lg:col-span-2 glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-blue" />
              <h3 className="text-sm font-semibold text-foreground">Recent Shift Notes</h3>
            </div>
            <div className="space-y-3">
              {notes.map((note, i) => {
                const time = formatTime(note.createdAt);
                return (
                  <div
                    key={note.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="text-xs font-mono text-muted-foreground mt-0.5 w-12 shrink-0">
                      {time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {note.source === "recorded" ? "Recorded note" : "Uploaded audio"}
                        {note.fileName ? ` - ${note.fileName}` : ""}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-1 rounded-full shrink-0 bg-neon-green/10 text-neon-green"
                    >
                      transcribed
                    </span>
                  </div>
                );
              })}
              {notes.length === 0 && (
                <div className="text-xs text-muted-foreground">No recent notes yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neon-amber" />
              <h3 className="text-sm font-semibold text-foreground">Issue Tracker</h3>
            </div>
            <span className="text-xs text-muted-foreground">{pendingIssues} pending</span>
          </div>
          <div className="space-y-3">
            {issues.slice(0, 8).map((issue) => {
              const time = formatTime(issue.createdAt);
              const isResolved = issue.status === "resolved";
              return (
                <div
                  key={issue.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-xs font-mono text-muted-foreground mt-0.5 w-12 shrink-0">
                    {time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{issue.issue || "Untitled issue"}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.employeeName || "Supervisor"}{issue.shiftType ? ` - ${issue.shiftType}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-1 rounded-full shrink-0 ${
                      isResolved
                        ? "bg-neon-green/10 text-neon-green"
                        : "bg-neon-amber/10 text-neon-amber"
                    }`}
                  >
                    {isResolved ? "resolved" : "pending"}
                  </span>
                  <button
                    onClick={() => toggleIssueStatus(issue)}
                    disabled={issueUpdating === issue.id}
                    className="text-xs px-3 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResolved ? "Reopen" : "Resolve"}
                  </button>
                </div>
              );
            })}
            {issues.length === 0 && (
              <div className="text-xs text-muted-foreground">No issues logged yet.</div>
            )}
          </div>
        </div>

        {/* Live Recording Widget */}
        <div className={`glass-card p-5 ${recordingActive ? "neon-glow-blue" : ""}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                recordingActive ? "gradient-primary animate-pulse-slow" : "bg-muted"
              }`}>
                <Mic className={`w-6 h-6 ${recordingActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Live Voice Recording</p>
                <p className="text-xs text-muted-foreground">{liveStatus}</p>
              </div>
            </div>
            {recordingActive && (
              <div className="flex items-center gap-1">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="voice-bar w-1"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: `${8 + Math.random() * 20}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
