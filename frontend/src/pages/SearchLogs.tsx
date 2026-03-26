import { DashboardLayout } from "@/components/DashboardLayout";
import { Search as SearchIcon, Filter } from "lucide-react";
import { useState } from "react";

const allLogs = [
  { time: "14:32", date: "2026-03-07", supervisor: "John Doe", issue: "Conveyor belt #3 overheating", dept: "Assembly", status: "pending" },
  { time: "13:15", date: "2026-03-07", supervisor: "Sarah Miller", issue: "Quality check failed Line 2", dept: "Quality", status: "resolved" },
  { time: "12:45", date: "2026-03-07", supervisor: "Mike Rodriguez", issue: "Coolant pressure drop Zone A", dept: "Maintenance", status: "resolved" },
  { time: "11:20", date: "2026-03-07", supervisor: "John Doe", issue: "Safety sensor malfunction Gate 5", dept: "Safety", status: "pending" },
  { time: "10:05", date: "2026-03-07", supervisor: "Sarah Miller", issue: "Material shortage Station 7", dept: "Logistics", status: "resolved" },
  { time: "08:30", date: "2026-03-06", supervisor: "Alex Chen", issue: "Hydraulic leak Line 4", dept: "Maintenance", status: "resolved" },
  { time: "15:45", date: "2026-03-06", supervisor: "Maria Santos", issue: "Power fluctuation Zone B", dept: "Electrical", status: "resolved" },
];

const SearchLogs = () => {
  const [query, setQuery] = useState("");
  const filtered = allLogs.filter(
    (l) =>
      l.issue.toLowerCase().includes(query.toLowerCase()) ||
      l.supervisor.toLowerCase().includes(query.toLowerCase()) ||
      l.dept.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Find any log entry across all shifts</p>
        </div>

        <div className="glass-card flex items-center gap-3 px-5 neon-glow-blue">
          <SearchIcon className="w-5 h-5 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by issue, supervisor, department..."
            className="flex-1 bg-transparent py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <Filter className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          {filtered.map((log, i) => (
            <div key={i} className="glass-card-hover p-4 flex items-center gap-4">
              <div className="text-xs font-mono text-muted-foreground w-20 shrink-0">
                {log.date}<br />{log.time}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{log.issue}</p>
                <p className="text-xs text-muted-foreground">{log.supervisor} · {log.dept}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                log.status === "resolved" ? "bg-neon-green/10 text-neon-green" : "bg-neon-amber/10 text-neon-amber"
              }`}>
                {log.status}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No logs found matching "{query}"</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SearchLogs;
