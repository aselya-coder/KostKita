import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { mockUsers } from "@/data/mockData";
import StudentOverview from "@/pages/dashboard/StudentOverview";
import OwnerOverview from "@/pages/dashboard/OwnerOverview";
import AdminOverview from "@/pages/dashboard/AdminOverview";
import PlaceholderPage from "@/pages/dashboard/PlaceholderPage";
import Favorites from "@/pages/Favorites";
import { useAuth } from "@/context/AuthContext";

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
            <Route path="my-items" element={<PlaceholderPage title="My Marketplace Items" />} />
            <Route path="sell-item" element={<PlaceholderPage title="Sell Item" />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}

        {/* Owner Routes */}
        {role === "owner" && (
          <>
            <Route index element={<OwnerOverview />} />
            <Route path="my-kos" element={<PlaceholderPage title="My Boarding Houses" />} />
            <Route path="add-kos" element={<PlaceholderPage title="Add Boarding House" />} />
            <Route path="my-items" element={<PlaceholderPage title="My Marketplace Items" />} />
            <Route path="sell-item" element={<PlaceholderPage title="Sell Item" />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="*" element={<Navigate to="/owner-dashboard" replace />} />
          </>
        )}

        {/* Admin Routes */}
        {role === "admin" && (
          <>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<PlaceholderPage title="User Management" />} />
            <Route path="kos" element={<PlaceholderPage title="Kos Management" />} />
            <Route path="marketplace" element={<PlaceholderPage title="Marketplace Moderation" />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="profile" element={<PlaceholderPage title="Admin Profile" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        )}
      </Routes>
    </DashboardLayout>
  );
}
