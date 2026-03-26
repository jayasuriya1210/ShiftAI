import { DashboardLayout } from "@/components/DashboardLayout";
import { Send, Mail, MessageCircle, Bell, Eye, ArrowRightLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const Handover = () => {
  const { user } = useAuth();
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp" | "inapp">("inapp");
  const [shiftType, setShiftType] = useState("ShiftA");
  const [shiftDate, setShiftDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [handoverMessage, setHandoverMessage] = useState("");
  const [status, setStatus] = useState("");

  const loadPreview = async () => {
    setStatus("Loading...");
    try {
      const data = await apiFetch<{ handoverMessage: string }>(
        `/api/summary/preview?shiftType=${shiftType}&shiftDate=${shiftDate}`
      );
      setHandoverMessage(data.handoverMessage || "");
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Preview failed");
    }
  };

  const sendHandover = async () => {
    if (!user) {
      setStatus("Sign in to send handover");
      return;
    }
    setStatus("Sending...");
    try {
      await apiFetch("/api/handover/send", {
        method: "POST",
        body: JSON.stringify({
          method: sendMethod,
          toTeam: shiftType === "ShiftA" ? "Shift B Team" : "Shift C Team",
          message: handoverMessage,
          shiftType,
          shiftDate
        })
      });
      setStatus("Handover sent");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Send failed");
    }
  };

  useEffect(() => {
    loadPreview();
  }, [shiftType, shiftDate]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Handover</h1>
          <p className="text-sm text-muted-foreground mt-1">Send shift summary to the next team</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-4 h-4 text-neon-blue" />
            <h3 className="text-sm font-semibold text-foreground">Handover To</h3>
          </div>
          <div className="flex gap-3">
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border outline-none"
            >
              <option value="ShiftA">Shift B Team — Led by Alex Chen</option>
              <option value="ShiftB">Shift C Team — Led by Maria Santos</option>
            </select>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border outline-none"
            />
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Send Via</h3>
          <div className="flex gap-3">
            {[
              { id: "email" as const, icon: Mail, label: "Email" },
              { id: "whatsapp" as const, icon: MessageCircle, label: "WhatsApp" },
              { id: "inapp" as const, icon: Bell, label: "In-App" }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setSendMethod(method.id)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                  sendMethod === method.id
                    ? "gradient-primary text-primary-foreground neon-glow-blue"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <method.icon className="w-4 h-4" /> {method.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-neon-purple" />
            <h3 className="text-sm font-semibold text-foreground">Message Preview</h3>
            <span className="text-[10px] bg-neon-purple/10 text-neon-purple px-2 py-0.5 rounded-full">AI-Generated</span>
          </div>
          <pre className="bg-muted/50 rounded-lg p-4 text-sm text-foreground/80 whitespace-pre-wrap font-mono text-xs leading-relaxed border border-border">
            {handoverMessage || "No summary available for selected shift."}
          </pre>
        </div>

        <button
          onClick={sendHandover}
          className="w-full py-3.5 rounded-xl gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 neon-glow-blue"
        >
          <Send className="w-4 h-4" /> Send Handover Report
        </button>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    </DashboardLayout>
  );
};

export default Handover;
