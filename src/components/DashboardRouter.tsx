import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import StudentOverview from "@/pages/dashboard/StudentOverview";
import OwnerOverview from "@/pages/dashboard/OwnerOverview";
import AdminOverview from "@/pages/dashboard/AdminOverview";
import Favorites from "@/pages/Favorites";
import { useAuth } from "@/hooks/useAuth";

// Student/Owner Dashboard Components
import MyMarketplaceItems from "@/pages/dashboard/MyMarketplaceItems";
import SellItem from "@/pages/dashboard/SellItem";
import Profile from "@/pages/dashboard/Profile";
import Settings from "@/pages/dashboard/Settings";
import Notifications from "@/pages/dashboard/Notifications";

// Owner Specific Components
import MyBoardingHouses from "@/pages/dashboard/MyBoardingHouses";
import AddBoardingHouse from "@/pages/dashboard/owner/AddKos";
import EditKosPage from "@/pages/dashboard/owner/EditKos"; // Import the new component
import Inquiries from "@/pages/dashboard/Inquiries";

// Admin Specific Components
import UserManagement from "@/pages/dashboard/UserManagement";
import KosManagement from "@/pages/dashboard/KosManagement";
import MarketplaceModeration from "@/pages/dashboard/MarketplaceModeration";
import Reports from "@/pages/dashboard/Reports";
import SystemSettings from "@/pages/dashboard/SystemSettings";
import ActivityLogPage from "@/pages/dashboard/admin/ActivityLog";

export function DashboardRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  return (
    <DashboardLayout user={user}>
      <Routes>
        {/* Student Routes */}
        {role === "student" && (
          <>
            <Route index element={<StudentOverview />} />
            <Route path="my-items" element={<MyMarketplaceItems />} />
            <Route path="sell-item" element={<SellItem />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}

        {/* Owner Routes */}
        {role === "owner" && (
          <>
            <Route index element={<OwnerOverview />} />
            <Route path="my-kos" element={<MyBoardingHouses />} />
            <Route path="add-kos" element={<AddBoardingHouse />} />
            <Route path="edit-kos/:id" element={<EditKosPage />} /> {/* Add the edit route */}
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="my-items" element={<MyMarketplaceItems />} />
            <Route path="sell-item" element={<SellItem />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/owner-dashboard" replace />} />
          </>
        )}

        {/* Admin Routes */}
        {role === "admin" && (
          <>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="kos" element={<KosManagement />} />
            <Route path="marketplace" element={<MarketplaceModeration />} />
            <Route path="reports" element={<Reports />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="system-settings" element={<SystemSettings />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        )}
      </Routes>
    </DashboardLayout>
  );
}