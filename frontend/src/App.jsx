import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import FarmerDashboard from "./pages/FarmerDashboard";
import FpoDashboard from "./pages/FpoDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import LogisticsDashboard from "./pages/LogisticsDashboard";
import StorageDashboard from "./pages/StorageDashboard";

import { authApi, dashboardPath } from "./api/auth";

import "./pages/Dashboard.css";

function LoadingScreen() {
  return (
    <div className="aarth-loading">
      <div className="aarth-loader"></div>
      <h2>AARTH</h2>
      <p>Verifying your account...</p>
    </div>
  );
}

function ProtectedRole({ role, children }) {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const session = authApi.getSession();

      if (!session?.access_token) {
        if (active) {
          setChecking(false);
        }

        return;
      }

      try {
        const profile = await authApi.me();

        if (!active) {
          return;
        }

        /*
         * IMPORTANT:
         *
         * The role comes from Supabase-backed public.profiles.
         *
         * We do NOT trust the role stored in localStorage.
         */
        if (profile?.role !== role) {
          navigate(dashboardPath(profile?.role), {
            replace: true,
          });

          return;
        }

        const updatedSession = {
          ...session,
          profile,
        };

        localStorage.setItem(
          "aarth_session",
          JSON.stringify(updatedSession)
        );

        setAllowed(true);
      } catch {
        authApi.clearSession();

        if (active) {
          navigate("/login", {
            replace: true,
          });
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [navigate, role]);

  if (checking) {
    return <LoadingScreen />;
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>AARTH Administration</h1>
      <p>Administrator dashboard foundation.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<LoginPage initialMode="login" />}
      />

      <Route
        path="/register"
        element={<LoginPage initialMode="register" />}
      />

      <Route
        path="/farmer"
        element={
          <ProtectedRole role="FARMER">
            <FarmerDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo"
        element={
          <ProtectedRole role="FPO">
            <FpoDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/buyer"
        element={
          <ProtectedRole role="BUYER">
            <BuyerDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/logistics-partner"
        element={
          <ProtectedRole role="LOGISTICS_PARTNER">
            <LogisticsDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/storage-partner"
        element={
          <ProtectedRole role="STORAGE_PARTNER">
            <StorageDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRole role="ADMIN">
            <AdminPage />
          </ProtectedRole>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}