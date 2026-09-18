import { Link } from "react-router-dom";
import aarthLogo from "../assets/aarth-logo.png";
import "./FpoDashboard.css";

export default function FpoLotCreationBridge() {
  return (
    <div className="fpo-dashboard-shell">
      <header className="fpo-d-navbar">
        <Link to="/fpo/dashboard" className="fpo-d-brand">
          <img src={aarthLogo} alt="AARTH" className="fpo-d-logo" />
          <span><b>AARTH</b><small>Agriculture Market Linkage Platform</small></span>
        </Link>
        <nav className="fpo-d-nav" style={{ display: "flex" }}>
          <Link to="/fpo/dashboard">Dashboard</Link>
          <Link to="/fpo/farmers">Farmers</Link>
          <Link className="active" to="/fpo/lots/create">Lots</Link>
        </nav>
      </header>
      <main className="fpo-d-main">
        <section className="fpo-d-panel" style={{ padding: 28, maxWidth: 820, margin: "30px auto" }}>
          <span className="fpo-d-kicker">LOT CREATION HANDOFF</span>
          <h1 style={{ color: "#10284c", margin: "8px 0 10px", fontSize: 30 }}>FPO Lot Creation</h1>
          <p style={{ color: "#6e7b8c", fontSize: 13, lineHeight: 1.6 }}>
            This route is intentionally reserved for AARTH's main lot-creation engine. The FPO dashboard is already wired to this route, so the later backend lot workflow can be connected without redesigning the FPO workspace.
          </p>
          <div className="fpo-d-lot-empty" style={{ margin: "22px 0 0" }}>
            <div className="fpo-d-lot-icon">📦</div>
            <div>
              <strong>No lot-creation backend is connected yet.</strong>
              <p>When the main lot service is implemented, replace this handoff view with the shared lot-creation UI/API. No fake lot is created here.</p>
              <Link to="/fpo/dashboard">← Back to FPO dashboard</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
