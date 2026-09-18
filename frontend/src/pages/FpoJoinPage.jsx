import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { fpoApi } from "../api/fpos";
import logo from "../assets/aarth-logo.png";
import "./FpoFoundation.css";

const PENDING_INVITE_KEY = "aarth_pending_fpo_invite";

export default function FpoJoinPage() {
  const { inviteCode = "" } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [aarthId, setAarthId] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fpoApi.inviteDetails(inviteCode)
      .then((data) => active && setInvite(data))
      .catch((error) => active && setNotice(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [inviteCode]);

  const continueToAuth = (path) => {
    localStorage.setItem(PENDING_INVITE_KEY, inviteCode);
    navigate(path);
  };

  const requestMembership = async () => {
    setBusy(true);
    setNotice("");
    try {
      await fpoApi.requestMembership(inviteCode, aarthId.trim() || undefined);
      setNotice("Your membership request is pending FPO approval.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const session = authApi.getSession();
  const isAuthenticated = Boolean(session?.access_token);

  return (
    <PublicShell>
      {loading && <Loading />}
      {!loading && !invite && <div className="fpo-alert">{notice || "This invitation is unavailable."}</div>}
      {invite && (
        <main className="fpo-detail fpo-join-page">
          <img src={logo} alt="AARTH" className="fpo-join-logo" />
          <span>FPO invitation</span>
          <h1>Join {invite.fpo.fpo_name}</h1>
          <p className="fpo-location">
            {[invite.fpo.village, invite.fpo.taluka, invite.fpo.district].filter(Boolean).join(", ") || "Maharashtra"}
          </p>
          <section className="fpo-info-grid">
            <Info label="Organisation type" value={invite.fpo.organisation_type || "Not provided"} />
            <Info label="Associated crops" value={invite.fpo.crops?.join(" · ") || "Not provided"} />
            <Info label="Invitation status" value="Active" />
            <Info label="Remaining uses" value={invite.remaining_uses} />
          </section>
          {!isAuthenticated ? (
            <section className="fpo-join-panel">
              <div>
                <h2>Connect your AARTH account</h2>
                <p>Use your existing Farmer account. FPO membership is optional and does not create a second profile.</p>
              </div>
              <div className="fpo-card-actions">
                <button className="fpo-button" onClick={() => continueToAuth("/login")}>Login and continue</button>
                <button className="fpo-button secondary" onClick={() => continueToAuth("/register")}>Create AARTH account</button>
              </div>
            </section>
          ) : (
            <section className="fpo-join-panel">
              <div>
                <h2>Request membership</h2>
                <p>Your authenticated account will be verified as an active Farmer before the request is created.</p>
              </div>
              <label className="fpo-join-id">
                AARTH ID (optional)
                <input value={aarthId} onChange={(event) => setAarthId(event.target.value)} placeholder="Verify an existing Farmer ID" />
              </label>
              <button className="fpo-button" disabled={busy} onClick={requestMembership}>
                {busy ? "Submitting..." : "Request membership"}
              </button>
            </section>
          )}
          {notice && <div className="fpo-alert">{notice}</div>}
          <Link className="fpo-button secondary" to="/fpos">Back to FPO directory</Link>
        </main>
      )}
    </PublicShell>
  );
}

function PublicShell({ children }) {
  return (
    <>
      <header className="fpo-public-nav">
        <Link to="/fpos" className="fpo-wordmark">AARTH</Link>
        <nav><Link to="/fpos">Find FPOs</Link><Link to="/login">Login</Link></nav>
      </header>
      <div className="fpo-public-main">{children}</div>
    </>
  );
}

function Info({ label, value }) {
  return <div className="fpo-info"><small>{label}</small><strong>{value}</strong></div>;
}

function Loading() {
  return <div className="fpo-empty">Loading invitation...</div>;
}
