import { DashboardLayout } from "@/components/DashboardLayout";
import { Brain, Volume2, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Summary = {
  shiftLabel?: string;
  dateLabel?: string;
  generatedAt?: string;
  totals?: {
    logs: number;
    supervisors: number;
    issues: number;
    actions: number;
    pending: number;
    critical: number;
  };
  sections?: {
    issues: string[];
    actions: string[];
    pending: string[];
    criticalAlerts: { title: string; details: string }[];
  };
  handoverMessage?: string;
};

const AISummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState("");
  const [shiftType, setShiftType] = useState("ShiftA");
  const [shiftDate, setShiftDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const loadPreview = async () => {
    setStatus("Loading...");
    try {
      const data = await apiFetch<Summary>(
        `/api/summary/preview?shiftType=${shiftType}&shiftDate=${shiftDate}`
      );
      setSummary(data);
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Load failed");
    }
  };

  const generateSummary = async () => {
    if (!user) {
      setStatus("Sign in to generate summaries");
      return;
    }
    setStatus("Generating...");
    try {
      const data = await apiFetch<Summary>("/api/summary/generate", {
        method: "POST",
        body: JSON.stringify({ shiftType, shiftDate })
      });
      setSummary(data);
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Generate failed");
    }
  };

  useEffect(() => {
    loadPreview();
  }, [shiftType, shiftDate]);

  const issues = summary?.sections?.issues || [];
  const actions = summary?.sections?.actions || [];
  const pending = summary?.sections?.pending || [];
  const critical = summary?.sections?.criticalAlerts || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Shift Summary</h1>
            <p className="text-sm text-muted-foreground mt-1">Auto-generated handover report</p>
          </div>
          <button
            onClick={generateSummary}
            className="gradient-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 neon-glow-blue"
          >
            <Brain className="w-4 h-4" /> Generate Summary
          </button>
        </div>

        <div className="flex gap-3">
          <select
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value)}
            className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none"
          >
            <option value="ShiftA">Shift A</option>
            <option value="ShiftB">Shift B</option>
            <option value="ShiftC">Shift C</option>
          </select>
          <input
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none"
          />
          {status && <span className="text-xs text-muted-foreground">{status}</span>}
        </div>

        <div className="glass-card p-5 shimmer">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-neon-purple" />
            <h2 className="text-lg font-semibold gradient-text">
              {summary?.shiftLabel || "Shift"} Summary — {summary?.dateLabel || shiftDate}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Generated at {summary?.generatedAt ? new Date(summary.generatedAt).toLocaleTimeString() : "—"} ·{" "}
            Covers {summary?.totals?.logs ?? 0} logs · {summary?.totals?.supervisors ?? 0} supervisors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neon-amber" />
              <h3 className="text-sm font-semibold text-foreground">Key Issues ({issues.length})</h3>
            </div>
            <ul className="space-y-2">
              {issues.slice(0, 6).map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-neon-amber mt-1">•</span> {item}
                </li>
              ))}
              {issues.length === 0 && (
                <li className="text-xs text-muted-foreground">No issues recorded</li>
              )}
            </ul>
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-semibold text-foreground">Actions Taken ({actions.length})</h3>
            </div>
            <ul className="space-y-2">
              {actions.slice(0, 6).map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-neon-green mt-1">•</span> {item}
                </li>
              ))}
              {actions.length === 0 && (
                <li className="text-xs text-muted-foreground">No actions recorded</li>
              )}
            </ul>
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-blue" />
              <h3 className="text-sm font-semibold text-foreground">Pending Tasks ({pending.length})</h3>
            </div>
            <ul className="space-y-2">
              {pending.slice(0, 6).map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-neon-blue mt-1">•</span> {item}
                </li>
              ))}
              {pending.length === 0 && (
                <li className="text-xs text-muted-foreground">No pending tasks</li>
              )}
            </ul>
          </div>

          <div className="glass-card p-5 space-y-3 border-neon-red/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neon-red" />
              <h3 className="text-sm font-semibold text-foreground">Critical Alerts ({critical.length})</h3>
            </div>
            <div className="space-y-3">
              {critical.slice(0, 4).map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-neon-red/5 border border-neon-red/10">
                  <p className="text-sm text-foreground font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                </div>
              ))}
              {critical.length === 0 && (
                <p className="text-xs text-muted-foreground">No critical alerts</p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-neon-cyan" />
            <div>
              <p className="text-sm font-semibold text-foreground">Listen to Audio Summary</p>
              <p className="text-xs text-muted-foreground">AI-generated voice summary · 2 min 15 sec</p>
            </div>
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2">
            <Volume2 className="w-4 h-4" /> Play
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AISummary;
