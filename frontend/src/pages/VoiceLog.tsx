import { DashboardLayout } from "@/components/DashboardLayout";
import { Mic, MicOff, Save, Brain, User, Clock, Upload, Sparkles, Briefcase } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const VoiceLog = () => {
  const { user } = useAuth();
  const sttOnly = (import.meta.env.VITE_STT_ONLY ?? "true") === "true";
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(
    "Conveyor belt number three is showing overheating signs near the motor section. We applied temporary coolant adjustment and notified maintenance team. Priority should be set to high. The issue is in the assembly department."
  );
  const [status, setStatus] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("Supervisor");
  const [shiftType, setShiftType] = useState("ShiftA");
  const RECORDING_ACTIVE_KEY = "shiftai_recording_active";
  const RECORDING_STARTED_AT_KEY = "shiftai_recording_started_at";

  const roles = [
    "Supervisor",
    "Lead Technician",
    "Technician",
    "Operator"
  ];

  const shifts = [
    { label: "Shift A (06:00 - 14:00)", value: "ShiftA" },
    { label: "Shift B (14:00 - 22:00)", value: "ShiftB" },
    { label: "Shift C (22:00 - 06:00)", value: "ShiftC" }
  ];

  const pickMimeType = () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4"
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const setRecordingState = (active: boolean, startedAt?: number) => {
    if (active) {
      const started = startedAt ?? Date.now();
      localStorage.setItem(RECORDING_ACTIVE_KEY, "true");
      localStorage.setItem(RECORDING_STARTED_AT_KEY, String(started));
    } else {
      localStorage.removeItem(RECORDING_ACTIVE_KEY);
      localStorage.removeItem(RECORDING_STARTED_AT_KEY);
    }
    window.dispatchEvent(new Event("shiftai-recording"));
  };

  const createNote = async (payload: {
    transcript: string;
    title?: string;
    source?: string;
    fileName?: string | null;
    durationSec?: number | null;
  }) => {
    try {
      await apiFetch("/api/notes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch {
      // Ignore note history errors to avoid blocking transcription
    }
  };

  const transcribeBlob = async (
    blob: Blob,
    meta?: { source?: string; fileName?: string | null; durationSec?: number | null }
  ) => {
    setStatus("Transcribing...");
    try {
      const form = new FormData();
      const extension = blob.type.includes("ogg")
        ? "ogg"
        : blob.type.includes("mp4")
        ? "m4a"
        : "webm";
      const file = new File([blob], `recording.${extension}`, { type: blob.type });
      form.append("file", file);
      setDebugInfo(`Recorded ${Math.round(blob.size / 1024)} KB - ${blob.type || "unknown"}`);
      const sttUrl =
        import.meta.env.VITE_STT_URL || "http://127.0.0.1:8000/transcribe";
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 90000);
      setDebugInfo((prev) => `${prev} - Sending ${file.name}`);
      const response = await fetch(sttUrl, { method: "POST", body: form, signal: controller.signal });
      window.clearTimeout(timeout);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "STT request failed");
      }
      const data = (await response.json()) as { transcription?: string; error?: string };
      if (data.error) {
        throw new Error(data.error);
      }
      setTranscript(data.transcription || "");
      setStatus("Transcription complete");
      if (data.transcription) {
        createNote({
          transcript: data.transcription,
          title: noteTitle || undefined,
          source: meta?.source || "recorded",
          fileName: meta?.fileName || null,
          durationSec: meta?.durationSec ?? null
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("Transcription timed out. Try a shorter clip.");
      } else {
        setStatus(err instanceof Error ? err.message : "Transcription failed");
      }
    }
  };

  const startRecording = async () => {
    setMicError("");
    setStatus("");
    setRecordingSeconds(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const extension = recorder.mimeType.includes("ogg")
          ? "ogg"
          : recorder.mimeType.includes("mp4")
          ? "m4a"
          : "webm";
        const file = new File([blob], `recording.${extension}`, { type: blob.type });
        setAudioFile(file);
        setDebugInfo(`Recorded ${Math.round(blob.size / 1024)} KB - ${blob.type || "unknown"}`);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setIsRecording(false);
        setRecordingState(false);
        transcribeBlob(blob, {
          source: "recorded",
          fileName: file.name,
          durationSec: recordingSeconds
        });
      };

      recorder.start();
      setIsRecording(true);
      setRecordingState(true, Date.now());
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setMicError(err instanceof Error ? err.message : "Microphone access denied");
      setRecordingState(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      setIsRecording(false);
      setRecordingState(false);
    }
  };

  const saveLog = async () => {
    setStatus("Saving...");
    try {
      const normalizedName = employeeName.trim();
      const derivedId = normalizedName
        ? `MANUAL-${normalizedName.replace(/\s+/g, "_").toUpperCase()}`
        : "MANUAL-UNKNOWN";
      const payloadDate = new Date().toISOString();

      if (audioFile) {
        const form = new FormData();
        form.append("file", audioFile);
        form.append("employeeId", user?.employeeId || derivedId);
        form.append("employeeName", normalizedName || "Unknown");
        form.append("employeeRole", employeeRole);
        form.append("shiftDate", payloadDate);
        form.append("shiftType", shiftType);
        if (noteTitle) {
          form.append("issueTitle", noteTitle);
        }
        if (transcript) {
          form.append("rawTranscription", transcript);
        }

        await apiFetch("/api/shiftlogs", {
          method: "POST",
          body: form
        });
      } else {
        await apiFetch("/api/shiftlogs", {
          method: "POST",
          body: JSON.stringify({
            employeeId: user?.employeeId || derivedId,
            employeeName: normalizedName || "Unknown",
            employeeRole,
            shiftDate: payloadDate,
            shiftType,
            rawTranscription: transcript,
            issueTitle: noteTitle || undefined
          })
        });
      }

      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
  };

  const generateSummary = async () => {
    if (sttOnly) {
      setStatus("STT-only mode: Summary is disabled for now");
      return;
    }
    if (!user) {
      setStatus("Sign in to generate summaries");
      return;
    }
    setStatus("Generating summary...");
    try {
      await apiFetch("/api/summary/generate", {
        method: "POST",
        body: JSON.stringify({
          shiftDate: new Date().toISOString(),
          shiftType
        })
      });
      setStatus("Summary generated");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Summary failed");
    }
  };

  const transcribeOnly = async () => {
    if (!audioFile) {
      setStatus("Upload an audio file first");
      return;
    }
    try {
      await transcribeBlob(audioFile, {
        source: "uploaded",
        fileName: audioFile.name,
        durationSec: null
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Transcription failed");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setRecordingState(false);
    };
  }, [audioUrl]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voice-to-Text Logger</h1>
          <p className="text-sm text-muted-foreground mt-1">Record and transcribe shift logs with AI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <User className="w-3 h-3" /> Employee Name
            </label>
            <input
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Type employee name"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground border-none outline-none"
            />
          </div>
          <div className="glass-card p-4">
            <label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> Role
            </label>
            <select
              value={employeeRole}
              onChange={(e) => setEmployeeRole(e.target.value)}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground border-none outline-none"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="glass-card p-4">
            <label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Shift
            </label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground border-none outline-none"
            >
              {shifts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center py-8">
          <button
            onClick={() => (isRecording ? stopRecording() : startRecording())}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? "gradient-primary neon-glow-blue animate-pulse-slow"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 text-primary-foreground" />
            ) : (
              <Mic className="w-10 h-10 text-muted-foreground" />
            )}
          </button>
          <p className="text-sm text-muted-foreground mt-4">
            {isRecording ? `Recording... ${recordingSeconds}s` : "Tap to start recording"}
          </p>

          {isRecording && (
            <div className="flex items-center gap-1 mt-4">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="voice-bar w-1"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Live Transcription</h3>
            <span className="text-[10px] font-mono text-muted-foreground">14:32:15</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Shift Note Title (optional)</label>
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g., Conveyor belt overheating"
              className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none focus:border-primary transition-colors"
            />
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full bg-muted/50 rounded-lg p-4 text-sm text-foreground border border-border resize-none h-28 outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-neon-blue" />
            <h3 className="text-sm font-semibold text-foreground">Upload Audio</h3>
          </div>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="text-xs text-muted-foreground"
          />
          {audioFile && (
            <p className="text-xs text-muted-foreground">Selected: {audioFile.name}</p>
          )}
          {audioUrl && (
            <audio controls src={audioUrl} className="w-full mt-2" />
          )}
          <button
            onClick={transcribeOnly}
            className="w-full py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Transcribe Only
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={saveLog}
            className="flex-1 py-3 rounded-xl gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Save Log
          </button>
          <button
            onClick={generateSummary}
            disabled={sttOnly}
            className="flex-1 py-3 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className="w-4 h-4" /> Generate AI Summary
          </button>
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
        {micError && <p className="text-xs text-neon-amber">{micError}</p>}
        {debugInfo && <p className="text-[10px] text-muted-foreground">{debugInfo}</p>}
      </div>
    </DashboardLayout>
  );
};

export default VoiceLog;
