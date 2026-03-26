import { DashboardLayout } from "@/components/DashboardLayout";
import { Settings as SettingsIcon, User, Bell, Palette, Shield, Database, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

const SettingsPage = () => {
  const { user, login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    name: "",
    password: ""
  });
  const [status, setStatus] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    try {
      if (isRegister) {
        await register({
          employeeId: form.employeeId,
          email: form.email || undefined,
          name: form.name,
          password: form.password
        });
      } else {
        await login({
          employeeId: form.employeeId || undefined,
          email: form.email || undefined,
          password: form.password
        });
      }
      setStatus("Success");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your AI ShiftLog system</p>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-neon-blue" />
            <h3 className="text-sm font-semibold text-foreground">
              {user ? "Signed In" : isRegister ? "Create Account" : "Sign In"}
            </h3>
          </div>
          {user ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.employeeId}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-muted text-sm text-foreground hover:bg-muted/80"
              >
                Logout
              </button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  placeholder="Employee ID"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none"
                />
                <input
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none"
                />
              </div>
              {isRegister && (
                <input
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none w-full"
                />
              )}
              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none w-full"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg gradient-primary text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {isRegister ? "Register" : "Login"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {isRegister ? "Already have an account?" : "Need an account?"}
                </button>
                {status && (
                  <span className="text-xs text-muted-foreground">{status}</span>
                )}
              </div>
            </form>
          )}
        </div>

        {[
          { icon: User, title: "Profile", desc: "Manage your supervisor profile and credentials" },
          { icon: Bell, title: "Notifications", desc: "Configure alert preferences and channels" },
          { icon: Palette, title: "Appearance", desc: "Theme, language, and display options" },
          { icon: Shield, title: "Security", desc: "Two-factor authentication and access logs" },
          { icon: Database, title: "Data Management", desc: "Export logs, backup settings, retention policies" },
          { icon: SettingsIcon, title: "AI Configuration", desc: "Customize AI summarization and voice recognition settings" },
        ].map((item, i) => (
          <div key={i} className="glass-card-hover p-5 flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <item.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
