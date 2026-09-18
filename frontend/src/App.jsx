import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import FarmerDashboard from "./pages/FarmerDashboard";
import FpoDashboard from "./pages/FpoDashboard";
import FpoLotCreationBridge from "./pages/FpoLotCreationBridge";
import FpoJoinPage from "./pages/FpoJoinPage";
import FpoFarmersPage from "./pages/FpoFarmersPage";
import FpoSettings from "./pages/FpoSettings";
import FpoStaffPage from "./pages/FpoStaffPage";
import FpoOrganisationPage from "./pages/FpoOrganisationPage";
import FpoVerificationPage from "./pages/FpoVerificationPage";
import FarmerLotPage from "./pages/FarmerLotPage";
import { FpoClaim, FpoDetail, FpoDirectory } from "./pages/FpoFoundation";
import BuyerDashboard from "./pages/BuyerDashboard";
import LogisticsDashboard from "./pages/LogisticsDashboard";
import StorageDashboard from "./pages/StorageDashboard";
import AarthScanPage from "./pages/AarthScanPage";

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

  const [checking, setChecking] = useState(() => {
    const session = authApi.getSession();
    return session?.profile?.role !== role;
  });
  const [allowed, setAllowed] = useState(() => {
    const session = authApi.getSession();
    return session?.profile?.role === role;
  });

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

      <Route path="/farmer/lots" element={<ProtectedRole role="FARMER"><FarmerLotPage mode="list" /></ProtectedRole>} />
      <Route path="/farmer/lots/:lotId" element={<ProtectedRole role="FARMER"><FarmerLotPage mode="detail" /></ProtectedRole>} />
      <Route path="/farmer/lots/new" element={<ProtectedRole role="FARMER"><FarmerLotPage mode="create" /></ProtectedRole>} />
      <Route path="/fpo/scan" element={<ProtectedRole role="FPO"><AarthScanPage /></ProtectedRole>} />
      <Route path="/farmer/scan" element={<ProtectedRole role="FARMER"><AarthScanPage /></ProtectedRole>} />

      <Route
        path="/fpo"
        element={
          <ProtectedRole role="FPO">
            <Navigate to="/fpo/dashboard" replace />
          </ProtectedRole>
        }
      />

      <Route path="/fpos" element={<FpoDirectory />} />

      <Route path="/fpos/:id" element={<FpoDetail />} />

      <Route
        path="/fpo/join/:inviteCode"
        element={<FpoJoinPage />}
      />

      <Route
        path="/fpo/claim/:id"
        element={<FpoClaim />}
      />

      <Route
        path="/fpo/login"
        element={<LoginPage initialMode="login" />}
      />

      <Route
        path="/fpo/dashboard"
        element={
          <ProtectedRole role="FPO">
            <FpoDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/lots/create"
        element={
          <ProtectedRole role="FPO">
            <FpoLotCreationBridge />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/farmers"
        element={
          <ProtectedRole role="FPO">
            <FpoFarmersPage />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/organisation"
        element={
          <ProtectedRole role="FPO">
            <FpoOrganisationPage />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/farmers/:id"
        element={
          <ProtectedRole role="FPO">
            <FpoFarmersPage />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/settings"
        element={
          <ProtectedRole role="FPO">
            <FpoSettings />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/staff"
        element={
          <ProtectedRole role="FPO">
            <FpoStaffPage />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/verification"
        element={
          <ProtectedRole role="FPO">
            <FpoVerificationPage />
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