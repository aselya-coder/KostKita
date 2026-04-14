import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Student/Owner Dashboard Components
const UserOverview = lazy(() => import("@/pages/dashboard/UserOverview"));
const MyMarketplaceItems = lazy(() => import("@/pages/dashboard/MyMarketplaceItems"));
const SellItem = lazy(() => import("@/pages/dashboard/SellItem"));
const EditItem = lazy(() => import("@/pages/dashboard/EditItem"));
const Profile = lazy(() => import("@/pages/dashboard/Profile"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const Notifications = lazy(() => import("@/pages/dashboard/Notifications"));
const PricingPage = lazy(() => import("@/pages/dashboard/Pricing"));
const TransactionsPage = lazy(() => import("@/pages/dashboard/Transactions"));
const BookingsPage = lazy(() => import("@/pages/dashboard/Bookings"));
const ChatPage = lazy(() => import("@/pages/dashboard/Chat"));
const Favorites = lazy(() => import("@/pages/Favorites"));

// Owner Specific Components
const MyBoardingHouses = lazy(() => import("@/pages/dashboard/MyBoardingHouses"));
const AddBoardingHouse = lazy(() => import("@/pages/dashboard/owner/AddKos"));
const EditKosPage = lazy(() => import("@/pages/dashboard/owner/EditKos"));
const Inquiries = lazy(() => import("@/pages/dashboard/Inquiries"));

// Admin Specific Components
const UserReports = lazy(() => import("@/pages/dashboard/UserReports"));
const TopUpPage = lazy(() => import("@/pages/dashboard/TopUp"));
const PaymentCheckout = lazy(() => import("@/pages/dashboard/PaymentCheckout"));

export function DashboardRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Memuat dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
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
    </Suspense>
  );
}
