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
import AdminLayout from "@/pages/admin/AdminLayout";

// Page Imports
import Home from "@/pages/Index";
import KosDetail from "@/pages/KosDetail";
import SearchResults from "@/pages/SearchKos";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import Favorites from "@/pages/Favorites";
import AddKos from "@/pages/dashboard/owner/AddKos";
import OwnerDashboard from "@/pages/dashboard/OwnerOverview";
import StudentDashboard from "@/pages/dashboard/StudentOverview";
import MyBoardingHouses from "@/pages/dashboard/MyBoardingHouses";
import Profile from "@/pages/dashboard/Profile";
import Settings from "@/pages/dashboard/Settings";

// Admin Pages
import AdminDashboard from "@/pages/dashboard/admin/AdminDashboard";
import UserManagement from "@/pages/dashboard/UserManagement";
import EditKos from "@/pages/dashboard/admin/EditKos";

// Route Protection
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { OwnerRoute } from "@/components/OwnerRoute";

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

// Helper component to render the correct dashboard index based on role
const DashboardIndex = () => {
  const { user } = useAuth();
  if (user?.role === 'owner') {
    return <OwnerDashboard />;
  }
  // Default to student dashboard
  return <StudentDashboard />;
};

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
            </Route>

            {/* Unified Dashboard for Students and Owners */}
            <Route 
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardIndex />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              
              {/* Owner-Specific Routes */}
              <Route path="my-kos" element={<OwnerRoute><MyBoardingHouses /></OwnerRoute>} />
              <Route path="add-kos" element={<OwnerRoute><AddKos /></OwnerRoute>} />
              <Route path="edit-kos/:id" element={<OwnerRoute><AddKos isEditMode /></OwnerRoute>} />
            </Route>

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