import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VoiceLog from "./pages/VoiceLog";
import ShiftLogs from "./pages/ShiftLogs";
import AISummary from "./pages/AISummary";
import Notifications from "./pages/Notifications";
import Handover from "./pages/Handover";
import SearchLogs from "./pages/SearchLogs";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/voice-log" element={<VoiceLog />} />
          <Route path="/shift-logs" element={<ShiftLogs />} />
          <Route path="/ai-summary" element={<AISummary />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/handover" element={<Handover />} />
          <Route path="/search" element={<SearchLogs />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
