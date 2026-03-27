import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardRouter } from "@/components/DashboardRouter";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import SearchKos from "./pages/SearchKos";
import KosDetail from "./pages/KosDetail";
import Marketplace from "./pages/Marketplace";
import ItemDetail from "./pages/ItemDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Favorites from "./pages/Favorites";
import Owner from "./pages/Owner";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isDashboard = 
    location.pathname.startsWith("/dashboard") || 
    location.pathname.startsWith("/owner-dashboard") || 
    location.pathname.startsWith("/admin");
  
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (isAuthPage) {
    return (
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboard && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchKos />} />
          <Route path="/kos/:id" element={<KosDetail />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/login" element={<Login />} />
          
          {/* Role-based Dashboards */}
          <Route path="/dashboard/*" element={<DashboardRouter />} />
          <Route path="/owner-dashboard/*" element={<DashboardRouter />} />
          <Route path="/admin/*" element={<DashboardRouter />} />

          {/* Legacy routes or redirects could go here if needed */}
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/owner" element={<Owner />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      {!isDashboard && <MobileBottomNav />}
      {!isDashboard && <div className="h-16 md:hidden" />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
