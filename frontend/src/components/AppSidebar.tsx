import { 
  LayoutDashboard, Mic, FileText, Brain, Bell, 
  ArrowRightLeft, Search, Settings, Sparkles 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Voice Log", url: "/voice-log", icon: Mic },
  { title: "Shift Notes", url: "/shift-logs", icon: FileText },
  { title: "AI Summary", url: "/ai-summary", icon: Brain },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Shift Handover", url: "/handover", icon: ArrowRightLeft },
  { title: "Search Logs", url: "/search", icon: Search },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-[72px] hover:w-[240px] transition-all duration-300 group/sidebar h-screen bg-sidebar border-r border-border flex flex-col overflow-hidden shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center neon-glow-blue shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          AI ShiftLog
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent ${
                isActive ? "" : ""
              }`}
              activeClassName="bg-sidebar-accent text-primary neon-text-blue"
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            JD
          </div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <p className="text-xs font-medium text-foreground">John Doe</p>
            <p className="text-[10px] text-muted-foreground">Supervisor</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
