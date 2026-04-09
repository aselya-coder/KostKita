import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import UserOverview from "@/pages/dashboard/UserOverview";
import AdminOverview from "@/pages/dashboard/AdminOverview";
import Favorites from "@/pages/Favorites";
import { useAuth } from "@/hooks/useAuth";

// Student/Owner Dashboard Components
import MyMarketplaceItems from "@/pages/dashboard/MyMarketplaceItems";
import SellItem from "@/pages/dashboard/SellItem";
import EditItem from "@/pages/dashboard/EditItem";
import Profile from "@/pages/dashboard/Profile";
import Settings from "@/pages/dashboard/Settings";
import Notifications from "@/pages/dashboard/Notifications";
import PricingPage from "@/pages/dashboard/Pricing";
import TransactionsPage from "@/pages/dashboard/Transactions";
import BookingsPage from "@/pages/dashboard/Bookings";
import ChatPage from "@/pages/dashboard/Chat";


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
import UserReports from "@/pages/dashboard/UserReports";
import SystemSettings from "@/pages/dashboard/SystemSettings";
import ActivityLogPage from "@/pages/dashboard/admin/ActivityLog";
import CoinPackagesPage from "@/pages/dashboard/admin/CoinPackages";
import TopUpPage from "@/pages/dashboard/TopUp";
import PaymentCheckout from "@/pages/dashboard/PaymentCheckout";

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
    <Routes>
      {/* Unified User Routes for All Registered Users */}
      {role !== "admin" && (
        <>
          <Route index element={<UserOverview />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="my-kos" element={<MyBoardingHouses />} />
          <Route path="add-kos" element={<AddBoardingHouse />} />
          <Route path="edit-kos/:id" element={<EditKosPage />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="my-items" element={<MyMarketplaceItems />} />
          <Route path="sell-item" element={<SellItem />} />
          <Route path="edit-item/:id" element={<EditItem />} />
          <Route path="reports" element={<UserReports />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="topup" element={<TopUpPage />} />
          <Route path="topup/checkout" element={<PaymentCheckout />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}

      {/* Admin Routes */}
      {role === "admin" && (
        <>
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>
      )}
    </Routes>
  );
}
