import { DashboardLayout } from "@/components/DashboardLayout";
import { AlertTriangle, Clock, FileText, Bell as BellIcon, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  _id: string;
  type: "critical" | "warning" | "info" | "log" | "success";
  title: string;
  desc?: string;
  read: boolean;
  createdAt: string;
};

const typeStyles: Record<string, string> = {
  critical: "border-l-neon-red bg-neon-red/5",
  warning: "border-l-neon-amber bg-neon-amber/5",
  info: "border-l-neon-blue bg-neon-blue/5",
  log: "border-l-neon-purple bg-neon-purple/5",
  success: "border-l-neon-green bg-neon-green/5"
};

const iconStyles: Record<string, string> = {
  critical: "text-neon-red",
  warning: "text-neon-amber",
  info: "text-neon-blue",
  log: "text-neon-purple",
  success: "text-neon-green"
};

const typeIcon = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: BellIcon,
  log: FileText,
  success: CheckCircle
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState("");

  const loadNotifications = async () => {
    setStatus("Loading...");
    try {
      const data = await apiFetch<Notification[]>("/api/notifications");
      setNotifications(data);
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Load failed");
    }
  };

  const markAllRead = async () => {
    setStatus("Updating...");
    try {
      await apiFetch("/api/notifications/mark-all-read", { method: "POST" });
      await loadNotifications();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Update failed");
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread alerts</p>
          </div>
          <button onClick={markAllRead} className="text-xs text-primary hover:underline">
            Mark all as read
          </button>
        </div>

        {status && <p className="text-xs text-muted-foreground">{status}</p>}

        {!user && (
          <div className="text-xs text-muted-foreground">Sign in to view notifications</div>
        )}

        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = typeIcon[n.type] || BellIcon;
            return (
              <div
                key={n._id}
                className={`glass-card p-4 border-l-4 ${typeStyles[n.type]} ${!n.read ? "ring-1 ring-border" : "opacity-70"} transition-all duration-200 hover:opacity-100`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconStyles[n.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{n.desc}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
          {notifications.length === 0 && user && (
            <div className="text-xs text-muted-foreground">No notifications</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
