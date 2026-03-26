import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
