import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, ChevronDown, ChevronUp, FileAudio } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ShiftNote = {
  id: string;
  title: string;
  transcript: string;
  source: "recorded" | "uploaded";
  fileName?: string | null;
  durationSec?: number | null;
  createdAt: string;
};

const ShiftLogs = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch<ShiftNote[]>(
          `/api/notes?limit=50${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`
        );
        if (active) {
          setNotes(data);
        }
      } catch {
        if (active) {
          setNotes([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Search and browse recent transcriptions</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] glass-card flex items-center gap-2 px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-[80px_2fr_2fr_140px_80px] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <span>Time</span>
            <span>Title</span>
            <span>Source</span>
            <span>File</span>
            <span></span>
          </div>
          {loading && (
            <div className="px-5 py-4 text-xs text-muted-foreground">Loading...</div>
          )}
          {!loading && notes.length === 0 && (
            <div className="px-5 py-4 text-xs text-muted-foreground">No notes found</div>
          )}
          {notes.map((note, i) => {
            const created = new Date(note.createdAt);
            const time = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const fileLabel = note.fileName || "—";

            return (
              <div key={note.id}>
                <div
                  className="grid grid-cols-[80px_2fr_2fr_140px_80px] gap-4 px-5 py-4 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer items-center"
                  onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                >
                  <span className="text-xs font-mono text-muted-foreground">{time}</span>
                  <span className="text-sm text-foreground truncate">{note.title}</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {note.source === "recorded" ? "Recorded" : "Uploaded"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate flex items-center gap-2">
                    <FileAudio className="w-3 h-3" /> {fileLabel}
                  </span>
                  <div className="flex items-center justify-end">
                    {expandedId === note.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedId === note.id && (
                  <div className="px-5 py-4 bg-muted/20 border-b border-border/50 animate-fade-in">
                    <p className="text-sm text-foreground/80">{note.transcript}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ShiftLogs;
