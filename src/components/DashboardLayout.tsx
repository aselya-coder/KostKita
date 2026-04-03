import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardRouter } from "./DashboardRouter"; // Import DashboardRouter
import { useAuth } from "@/hooks/useAuth";

export function DashboardLayout() {
  const { user } = useAuth(); // Get user from context
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    // This should ideally be handled by ProtectedRoute, but as a fallback
    return null; 
  }
  
  return (
    <div className="min-h-screen bg-surface flex">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <DashboardRouter /> {/* Render DashboardRouter here */}
          </div>
        </main>
      </div>
    </div>
  );
}