import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import { Toasts } from "./components/ui";
import { useStore } from "./store/useStore";
import { ForgotPassword, Login, SignUp } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import EmailDetail from "./pages/EmailDetail";
import Assistant from "./pages/Assistant";
import Analytics from "./pages/Analytics";
import ImportData from "./pages/ImportData";
import Profile from "./pages/Profile";
import Overview from "./pages/admin/Overview";
import Users from "./pages/admin/Users";
import Admins from "./pages/admin/Admins";
import Activity from "./pages/admin/Activity";
import AdminSettings from "./pages/admin/AdminSettings";
import type { ReactNode } from "react";

/** Regular members only. Admins are sent to their own console. */
function RequireUser({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

/** Admins only. Everyone else is quietly sent away. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  if (!user) return <>{children}</>;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><SignUp /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />

        <Route element={<RequireUser><Layout /></RequireUser>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:id" element={<EmailDetail />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="admins" element={<Admins />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}
