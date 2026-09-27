import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
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
import BuyerRequirementPage from "./pages/BuyerRequirementPage";
import BuyerDiscoverLotsPage from "./pages/BuyerDiscoverLotsPage";

import LogisticsDashboard from "./pages/LogisticsDashboard";
import StorageDashboard from "./pages/StorageDashboard";

import AarthScanPage from "./pages/AarthScanPage";
<<<<<<< HEAD
import ProfitLossPage from "./market_intelligence/ProfitLossPage.tsx";
=======
import PrototypeWorkspacePage from "./pages/PrototypeWorkspacePage";
>>>>>>> f6b12ac (FEAT : ADDED THE SECTIONS FOR REJECTED LOT RECOVERY MULTI CROP MATCHING , REQUIREMENTS , etc)

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

  const isDemo = () => {
    try {
      return sessionStorage.getItem("sih26193_demo") === "true" && sessionStorage.getItem("sih26193_demo_role")?.toUpperCase() === role;
    } catch {
      return false;
    }
  };

  const [checking, setChecking] = useState(() => {
    if (isDemo()) return false;
    const session = authApi.getSession();
    return session?.profile?.role !== role;
  });

  const [allowed, setAllowed] = useState(() => {
    if (isDemo()) return true;
    const session = authApi.getSession();
    return session?.profile?.role === role;
  });

  useEffect(() => {
    let active = true;

    if (isDemo()) {
      setAllowed(true);
      setChecking(false);
      return () => { active = false; };
    }

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


const SIH26193_ROLES = {
  farmer: { role: "FARMER", target: "/farmer", prefix: "FAR" },
  buyer: { role: "BUYER", target: "/buyer", prefix: "BUY" },
  fpo: { role: "FPO", target: "/fpo/dashboard", prefix: "FPO" },
  logistics: { role: "LOGISTICS_PARTNER", target: "/logistics-partner", prefix: "LOG" },
  storage: { role: "STORAGE_PARTNER", target: "/storage-partner", prefix: "STO" },
};

function SIH26193Entry() {
  const { role = "farmer" } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const config = SIH26193_ROLES[role] || SIH26193_ROLES.farmer;
    const counterKey = `sih26193_${config.prefix}_id`;
    let demoId = localStorage.getItem(counterKey);
    if (!demoId) {
      demoId = `SIH26193-${config.prefix}-0001`;
      localStorage.setItem(counterKey, demoId);
    }

    const demoProfile = {
      user_id: `sih-demo-${config.prefix.toLowerCase()}`,
      username: `sih26193_${role}`,
      email: `${role}@sih26193.demo`,
      phone: "+91 90000 26193",
      role: config.role,
      role_id: demoId,
      aarth_id: demoId,
      status: "ACTIVE",
    };

    sessionStorage.setItem("sih26193_demo", "true");
    sessionStorage.setItem("sih26193_demo_role", role);
    sessionStorage.setItem("sih26193_demo_id", demoId);
    localStorage.setItem("aarth_session", JSON.stringify({
      access_token: "sih26193-demo-token",
      profile: demoProfile,
    }));

    navigate(config.target, { replace: true });
  }, [navigate, role]);

  return <LoadingScreen />;
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

      {/* =========================
          PUBLIC HOMEPAGE
      ========================== */}
      <Route
        path="/"
        element={<HomePage />}
      />


      {/* =========================
          AUTHENTICATION
      ========================== */}

      <Route
        path="/login"
        element={<LoginPage initialMode="login" />}
      />

      <Route
        path="/register"
        element={<LoginPage initialMode="register" />}
      />

      {/* SIH26193: direct presentation access to the existing dashboards. */}
      <Route path="/sih26193/:role" element={<SIH26193Entry />} />


      {/* =========================
          FARMER
      ========================== */}

      <Route
        path="/farmer"
        element={
          <ProtectedRole role="FARMER">
            <FarmerDashboard />
          </ProtectedRole>
        }
      />

<<<<<<< HEAD
      <Route path="/farmer/lots" element={<ProtectedRole role="FARMER"><FarmerLotPage mode="list" /></ProtectedRole>} />
      <Route path="/farmer/lots/:lotId" element={<ProtectedRole role="FARMER"><FarmerLotPage mode="detail" /></ProtectedRole>} />
      <Route path="/farmer/lots/new" element={<ProtectedRole role="FARMER"><FarmerLotPage mode="create" /></ProtectedRole>} />
      <Route path="/fpo/scan" element={<ProtectedRole role="FPO"><AarthScanPage /></ProtectedRole>} />
      <Route path="/farmer/scan" element={<ProtectedRole role="FARMER"><AarthScanPage /></ProtectedRole>} />
      <Route path="/farmer/market-insights" element={<ProtectedRole role="FARMER"><ProfitLossPage /></ProtectedRole>} />
=======
      {/* Existing FarmerLotPage handles:
          list
          detail
          create
      */}

      <Route
        path="/farmer/lots"
        element={
          <ProtectedRole role="FARMER">
            <FarmerLotPage mode="list" />
          </ProtectedRole>
        }
      />

      <Route
        path="/farmer/lots/:lotId"
        element={
          <ProtectedRole role="FARMER">
            <FarmerLotPage mode="detail" />
          </ProtectedRole>
        }
      />

      <Route
        path="/farmer/lots/new"
        element={
          <ProtectedRole role="FARMER">
            <FarmerLotPage mode="create" />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpo/scan"
        element={
          <ProtectedRole role="FPO">
            <AarthScanPage />
          </ProtectedRole>
        }
      />

      <Route
        path="/farmer/scan"
        element={
          <ProtectedRole role="FARMER">
            <AarthScanPage />
          </ProtectedRole>
        }
      />


      <Route
        path="/farmer/market-insights"
        element={
          <ProtectedRole role="FARMER">
            <Navigate to="/farmer/profit-loss" replace />
          </ProtectedRole>
        }
      />

      <Route
        path="/farmer/profit-loss"
        element={
          <ProtectedRole role="FARMER">
            <PrototypeWorkspacePage role="FARMER" initialTab="Profit & Loss" />
          </ProtectedRole>
        }
      />

      <Route
        path="/farmer/operations"
        element={
          <ProtectedRole role="FARMER">
            <PrototypeWorkspacePage role="FARMER" initialTab="Operations" />
          </ProtectedRole>
        }
      />

      <Route path="/farmer/recovery" element={<ProtectedRole role="FARMER"><PrototypeWorkspacePage role="FARMER" initialTab="Rejected Recovery" /></ProtectedRole>} />
      <Route path="/farmer/residue" element={<ProtectedRole role="FARMER"><PrototypeWorkspacePage role="FARMER" initialTab="Residue" /></ProtectedRole>} />



      <Route
        path="/farmer/recovery"
        element={
          <ProtectedRole role="FARMER">
            <PrototypeWorkspacePage
              role="FARMER"
              initialTab="Rejected Recovery"
            />
          </ProtectedRole>
        }
      />

      <Route
        path="/farmer/residue"
        element={
          <ProtectedRole role="FARMER">
            <PrototypeWorkspacePage
              role="FARMER"
              initialTab="Residue"
            />
          </ProtectedRole>
        }
      />


      {/* =========================
          FPO PUBLIC
      ========================== */}
>>>>>>> f6b12ac (FEAT : ADDED THE SECTIONS FOR REJECTED LOT RECOVERY MULTI CROP MATCHING , REQUIREMENTS , etc)

      <Route
        path="/fpo"
        element={
          <ProtectedRole role="FPO">
            <Navigate
              to="/fpo/dashboard"
              replace
            />
          </ProtectedRole>
        }
      />

      <Route
        path="/fpos"
        element={<FpoDirectory />}
      />

      <Route
        path="/fpos/:id"
        element={<FpoDetail />}
      />

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


      {/* =========================
          FPO DASHBOARD
      ========================== */}

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
        path="/fpo/operations"
        element={
          <ProtectedRole role="FPO">
            <PrototypeWorkspacePage role="FPO" />
          </ProtectedRole>
        }
      />


      {/* =========================
          BUYER
      ========================== */}

      <Route
        path="/buyer"
        element={
          <ProtectedRole role="BUYER">
            <BuyerDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/buyer/requirements"
        element={
          <ProtectedRole role="BUYER">
            <BuyerRequirementPage />
          </ProtectedRole>
        }
      />

      <Route
        path="/buyer/discover-lots"
        element={
          <ProtectedRole role="BUYER">
            <BuyerDiscoverLotsPage />
          </ProtectedRole>
        }
      />

      <Route path="/buyer/orders" element={<ProtectedRole role="BUYER"><PrototypeWorkspacePage role="BUYER" initialTab="Orders" /></ProtectedRole>} />
      <Route path="/buyer/search-produce" element={<ProtectedRole role="BUYER"><PrototypeWorkspacePage role="BUYER" initialTab="Search Produce" /></ProtectedRole>} />
      <Route path="/buyer/suppliers" element={<ProtectedRole role="BUYER"><PrototypeWorkspacePage role="BUYER" initialTab="Supplier Network" /></ProtectedRole>} />
      <Route path="/buyer/market-insights" element={<ProtectedRole role="BUYER"><PrototypeWorkspacePage role="BUYER" initialTab="Market Insights" /></ProtectedRole>} />
      <Route path="/buyer/support" element={<ProtectedRole role="BUYER"><PrototypeWorkspacePage role="BUYER" initialTab="Support" /></ProtectedRole>} />
      <Route
        path="/buyer/operations"
        element={<ProtectedRole role="BUYER"><PrototypeWorkspacePage role="BUYER" initialTab="Operations" /></ProtectedRole>}
      />
      <Route
        path="/buyer/recovery"
        element={<ProtectedRole role="BUYER"><PrototypeWorkspacePage role="BUYER" initialTab="Recovered Lots" /></ProtectedRole>}
      />


      {/* =========================
          LOGISTICS
      ========================== */}

      <Route
        path="/logistics-partner"
        element={
          <ProtectedRole role="LOGISTICS_PARTNER">
            <LogisticsDashboard />
          </ProtectedRole>
        }
      />

      <Route
        path="/logistics-partner/operations"
        element={
          <ProtectedRole role="LOGISTICS_PARTNER">
            <PrototypeWorkspacePage
              role="LOGISTICS_PARTNER"
            />
          </ProtectedRole>
        }
      />


      {/* =========================
          STORAGE
      ========================== */}

      <Route
        path="/storage-partner"
        element={
          <ProtectedRole role="STORAGE_PARTNER">
            <StorageDashboard />
          </ProtectedRole>
        }
      />

      <Route path="/storage-partner/requests" element={<ProtectedRole role="STORAGE_PARTNER"><PrototypeWorkspacePage role="STORAGE_PARTNER" initialTab="Storage Requests" /></ProtectedRole>} />
      <Route path="/storage-partner/facilities" element={<ProtectedRole role="STORAGE_PARTNER"><PrototypeWorkspacePage role="STORAGE_PARTNER" initialTab="My Facilities" /></ProtectedRole>} />
      <Route path="/storage-partner/capacity" element={<ProtectedRole role="STORAGE_PARTNER"><PrototypeWorkspacePage role="STORAGE_PARTNER" initialTab="Capacity" /></ProtectedRole>} />
      <Route path="/storage-partner/bookings" element={<ProtectedRole role="STORAGE_PARTNER"><PrototypeWorkspacePage role="STORAGE_PARTNER" initialTab="Bookings" /></ProtectedRole>} />
      <Route path="/storage-partner/operations" element={<ProtectedRole role="STORAGE_PARTNER"><PrototypeWorkspacePage role="STORAGE_PARTNER" initialTab="Operations" /></ProtectedRole>} />
      <Route path="/storage-partner/support" element={<ProtectedRole role="STORAGE_PARTNER"><PrototypeWorkspacePage role="STORAGE_PARTNER" initialTab="Support" /></ProtectedRole>} />


      {/* =========================
          ADMIN
      ========================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRole role="ADMIN">
            <AdminPage />
          </ProtectedRole>
        }
      />


      {/* =========================
          PROTOTYPE / DEMO
      ========================== */}

      <Route
        path="/prototype"
        element={<PrototypeWorkspacePage />}
      />


      {/* =========================
          FALLBACK
      ========================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}