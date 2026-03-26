import { Sparkles, Bell, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function TopHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-sidebar/50 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          AI Assistant <span className="neon-text-blue">Online</span>
        </span>
        <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse ml-1" />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground font-mono">
          Shift A · {new Date().toLocaleDateString()}
        </span>
        {user ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{user.name}</span>
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-foreground hover:bg-muted/80"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not signed in</span>
        )}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-red" />
        </button>
      </div>
    </header>
  );
}
