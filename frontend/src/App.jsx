import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RoleDashboard from "./pages/RoleDashboard";
import FarmerDashboard from "./pages/FarmerDashboard";
import FpoDashboard from "./pages/FpoDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import LogisticsDashboard from "./pages/LogisticsDashboard";
import StorageDashboard from "./pages/StorageDashboard";
import "./pages/Dashboard.css";
const roles = ["farmer", "fpo", "buyer", "logistics-partner", "storage-partner", "admin"];
export default function App() { return <BrowserRouter><Routes><Route path="/" element={<Navigate to="/login" replace />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<LoginPage initialMode="register" />} /><Route path="/farmer" element={<FarmerDashboard />} /><Route path="/fpo" element={<FpoDashboard />} /><Route path="/buyer" element={<BuyerDashboard />} /><Route path="/logistics-partner" element={<LogisticsDashboard />} /><Route path="/storage-partner" element={<StorageDashboard />} /><Route path="/admin" element={<RoleDashboard role="admin" />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes></BrowserRouter>; }
