import { lazy, Suspense } from "react";
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

// Lazy Page Imports
const Home = lazy(() => import("@/pages/Index"));
const KosDetail = lazy(() => import("@/pages/KosDetail"));
const SearchResults = lazy(() => import("@/pages/SearchKos"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const ItemDetail = lazy(() => import("@/pages/ItemDetail"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Owner = lazy(() => import("@/pages/Owner"));

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/dashboard/admin/AdminDashboard"));
const UserManagement = lazy(() => import("@/pages/dashboard/UserManagement"));
const EditKos = lazy(() => import("@/pages/dashboard/admin/EditKos"));
const KosManagement = lazy(() => import("@/pages/dashboard/KosManagement"));
const MarketplaceModeration = lazy(() => import("@/pages/dashboard/MarketplaceModeration"));
const Reports = lazy(() => import("@/pages/dashboard/Reports"));
const ActivityLog = lazy(() => import("@/pages/dashboard/admin/ActivityLog"));
const CoinPackages = lazy(() => import("@/pages/dashboard/admin/CoinPackages"));
const SystemSettings = lazy(() => import("@/pages/dashboard/SystemSettings"));
const AdManagement = lazy(() => import("@/pages/dashboard/AdManagement"));
const TopupUsers = lazy(() => import("@/pages/dashboard/admin/TopupUsers"));

// Route Protection
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { OwnerRoute } from "./components/OwnerRoute";

const queryClient = new QueryClient();

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
                <Route path="marketplace" element={<MarketplaceModeration />} />
                <Route path="reports" element={<Reports />} />
                <Route path="activity-log" element={<ActivityLog />} />
                <Route path="coin-packages" element={<CoinPackages />} />
                <Route path="topup-users" element={<TopupUsers />} />
                <Route path="system-settings" element={<SystemSettings />} />
                <Route path="ad-management" element={<AdManagement />} />
                <Route path="edit-kos/:id" element={<EditKos />} />
              </Route>

              {/* Redirect old dashboard paths */}
              <Route path="/admin/advertisements" element={<Navigate to="/admin/ad-management" replace />} />
              <Route path="/owner-dashboard/*" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin-dashboard/*" element={<Navigate to="/admin" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
