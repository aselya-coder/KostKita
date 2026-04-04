import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

// Layouts
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardLayout } from "@/components/DashboardLayout";
import AdminLayout from "@/pages/dashboard/admin/AdminLayout";

// Page Imports
import Home from "@/pages/Index";
import KosDetail from "@/pages/KosDetail";
import SearchResults from "@/pages/SearchKos";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import Favorites from "@/pages/Favorites";
import Marketplace from "@/pages/Marketplace";
import ItemDetail from "@/pages/ItemDetail";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Owner from "@/pages/Owner";
import AddKos from "@/pages/dashboard/owner/AddKos";
import OwnerEditKos from "@/pages/dashboard/owner/EditKos";
import UserOverview from "@/pages/dashboard/UserOverview";
import MyBoardingHouses from "@/pages/dashboard/MyBoardingHouses";
import Profile from "@/pages/dashboard/Profile";
import Settings from "@/pages/dashboard/Settings";

// Admin Pages
import AdminDashboard from "@/pages/dashboard/admin/AdminDashboard";
import UserManagement from "@/pages/dashboard/UserManagement";
import EditKos from "@/pages/dashboard/admin/EditKos";
import KosManagement from "@/pages/dashboard/KosManagement";
import MarketplaceModeration from "@/pages/dashboard/MarketplaceModeration";
import AdminAdvertisements from "@/pages/dashboard/admin/Advertisements";
import Reports from "@/pages/dashboard/Reports";
import ActivityLog from "@/pages/dashboard/admin/ActivityLog";
import CoinPackages from "@/pages/dashboard/admin/CoinPackages";
import SystemSettings from "@/pages/dashboard/SystemSettings";
import TopupUsers from "@/pages/dashboard/admin/TopupUsers";

// Route Protection
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { OwnerRoute } from "./components/OwnerRoute";

const queryClient = new QueryClient();

// Layout for public pages that includes Navbar and Footer
const PublicLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <MobileBottomNav />
    <div className="h-16 md:hidden" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/kos/:id" element={<KosDetail />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ItemDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/owner" element={<Owner />} />
              <Route path="/favorites" element={<Favorites />} />
            </Route>

            {/* Unified Dashboard for Students and Owners */}
            <Route 
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="kos" element={<KosManagement />} />
              <Route path="advertisements" element={<AdminAdvertisements />} />
              <Route path="marketplace" element={<MarketplaceModeration />} />
              <Route path="reports" element={<Reports />} />
              <Route path="activity-log" element={<ActivityLog />} />
              <Route path="coin-packages" element={<CoinPackages />} />
              <Route path="topup-users" element={<TopupUsers />} />
              <Route path="system-settings" element={<SystemSettings />} />
              <Route path="edit-kos/:id" element={<EditKos />} />
            </Route>

            {/* Redirect old dashboard paths */}
            <Route path="/owner-dashboard/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-dashboard/*" element={<Navigate to="/admin" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
