import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { useCustodialAuth } from "@/hooks/useCustodialAuth";

import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ClassesPage from "./pages/ClassesPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import DirectoryPage from "./pages/DirectoryPage";
import ReportsPage from "./pages/ReportsPage";
import TeacherToolsPage from "./pages/TeacherToolsPage";
import GuardianPortalPage from "./pages/GuardianPortalPage";
import GuardianMediaPage from "./pages/GuardianMediaPage";
import StudentProgressPage from "./pages/StudentProgressPage";
import CompliancePage from "./pages/CompliancePage";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

/** Protect routes that require authentication */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { account, isLoading } = useCustodialAuth();
  if (isLoading) return null;
  if (!account) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redirect authenticated users away from auth pages */
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { account, isLoading } = useCustodialAuth();
  if (isLoading) return null;
  if (account) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

        {/* Protected — General */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
        <Route path="/directory" element={<ProtectedRoute><DirectoryPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/teacher-tools" element={<ProtectedRoute><TeacherToolsPage /></ProtectedRoute>} />
        <Route path="/guardian-portal" element={<ProtectedRoute><GuardianPortalPage /></ProtectedRoute>} />
        <Route path="/guardian/media" element={<ProtectedRoute><GuardianMediaPage /></ProtectedRoute>} />
        <Route path="/guardian/progress" element={<ProtectedRoute><StudentProgressPage /></ProtectedRoute>} />
        <Route path="/guardian/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />

        {/* Protected — Admin only */}
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/messages" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Navigate to="/profile" replace /></ProtectedRoute>} />
        <Route path="/about-security" element={<Navigate to="/profile" replace />} />

        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
