import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { fpoApi } from "../api/fpos";
import logo from "../assets/aarth-logo.png";
import "./FpoDashboard.css";

const LOT_CREATION_ROUTE = "/fpo/lots/create";

function Icon({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </>
    ),

    organisation: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
      </>
    ),

    farmers: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M17 11a3 3 0 1 0-1-5.8" />
        <path d="M20.5 21v-2a4 4 0 0 0-3-3.9" />
      </>
    ),

    application: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),

    lot: (
      <>
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
        <path d="M4 7.5 12 12l8-4.5M12 12v9" />
      </>
    ),

    staff: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0M15 19a4 4 0 0 1 6 0" />
      </>
    ),

    verify: (
      <>
        <path d="M12 3 20 6v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    support: (
      <>
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
        <path d="M4 13h3v5H5a1 1 0 0 1-1-1zM20 13h-3v5h2a1 1 0 0 1 1-1z" />
        <path d="M17 18c-.8 1.5-2.1 2.3-4 2.5" />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),

    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),

    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
      </>
    ),

    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),

    chevron: <path d="m9 18 6-6-6-6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function StatusBadge({ children, tone = "green" }) {
  return (
    <span className={`fpo-d-status fpo-d-status-${tone}`}>
      <span className="fpo-d-status-dot" />
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, note, to }) {
  const content = (
    <div className="fpo-d-stat-card">
      <div className="fpo-d-stat-icon">
        <Icon name={icon} size={25} />
      </div>

      <div className="fpo-d-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>

      {to && (
        <span className="fpo-d-card-arrow">
          <Icon name="arrow" size={18} />
        </span>
      )}
    </div>
  );

  return to ? (
    <Link className="fpo-d-stat-link" to={to}>
      {content}
    </Link>
  ) : (
    content
  );
}

function QuickAction({
  icon,
  title,
  text,
  to,
  disabled = false,
}) {
  const body = (
    <div
      className={`fpo-d-action-card ${
        disabled ? "is-disabled" : ""
      }`}
    >
      <div className="fpo-d-action-icon">
        <Icon name={icon} size={26} />
      </div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>

      <Icon name="chevron" size={20} />
    </div>
  );

  return disabled ? (
    <div
      className="fpo-d-action-link"
      title="This module will be connected in a later AARTH phase"
    >
      {body}
    </div>
  ) : (
    <Link className="fpo-d-action-link" to={to}>
      {body}
    </Link>
  );
}

function Empty({ title, text, action }) {
  return (
    <div className="fpo-d-empty">
      <div className="fpo-d-empty-icon">
        <Icon name="farmers" size={25} />
      </div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        {action}
      </div>
    </div>
  );
}

export default function FpoDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      fpoApi.dashboard(),
      fpoApi.members(),
    ])
      .then(([dashboard, network]) => {
        if (!active) return;

        setData(dashboard);
        setMembers(network);
      })
      .catch(
        (e) =>
          active &&
          setError(
            e.message || "Unable to load the FPO dashboard."
          )
      );

    return () => {
      active = false;
    };
  }, []);

  const summary = data?.summary || {
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
  };

  const memberItems = members?.items || [];

  const pending = memberItems.filter(
    (m) => m.status === "PENDING"
  );

  const recent = [...memberItems]
    .sort(
      (a, b) =>
        new Date(b.requested_at || 0) -
        new Date(a.requested_at || 0)
    )
    .slice(0, 5);

  const fpoName =
    data?.fpo_name ||
    data?.username ||
    "FPO";

  const location =
    [data?.taluka, data?.district]
      .filter(Boolean)
      .join(", ") || "Maharashtra";

  const profileFields = [
    data?.fpo_name,
    data?.organisation_type,
    data?.registration_number,
    data?.district,
    data?.taluka,
    data?.village,
    data?.address,
    data?.crops?.length ? "crops" : "",
  ];

  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length /
      profileFields.length) *
      100
  );

  const handleLogout = () => {
    authApi.logout();
    navigate("/login", { replace: true });
  };

  const generateInvite = async () => {
    setInviteBusy(true);
    setNotice("");

    try {
      const result = await fpoApi.invite();

      const link = `${window.location.origin}/fpo/join/${encodeURIComponent(
        result.code
      )}`;

      setInvite({
        ...result,
        link,
      });

      setNotice("Farmer registration link generated.");
    } catch (e) {
      setNotice(
        e.message ||
          "Unable to generate an invitation."
      );
    } finally {
      setInviteBusy(false);
    }
  };

  const copyInvite = async () => {
    if (!invite?.link) return;

    try {
      await navigator.clipboard.writeText(
        invite.link
      );

      setNotice("Registration link copied.");
    } catch {
      setNotice(
        "Copy is unavailable. Share the registration code instead."
      );
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();

    const value = search.trim();

    navigate(
      value
        ? `/fpo/farmers?search=${encodeURIComponent(value)}`
        : "/fpo/farmers"
    );
  };

  if (error) {
    return (
      <div className="fpo-d-error">
        <strong>AARTH FPO dashboard</strong>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fpo-d-loading">
        <div className="fpo-d-spinner" />
        <strong>AARTH</strong>
        <span>Loading FPO workspace…</span>
      </div>
    );
  }

  return (
    <div className="fpo-dashboard-shell">
      <header className="fpo-d-navbar">
        <Link
          to="/fpo/dashboard"
          className="fpo-d-brand"
          aria-label="AARTH FPO dashboard"
        >
          <img src={logo} alt="AARTH" className="fpo-d-logo" />

          <span>
            <b>AARTH</b>
            <small>
              Agriculture Market Linkage Platform
            </small>
            <em>
              शेतकऱ्यांसाठी सक्षम बाजार, समृद्ध महाराष्ट्र
            </em>
          </span>
        </Link>

        <nav
          className={`fpo-d-nav ${
            mobileNav ? "open" : ""
          }`}
        >
          <Link
            className="active"
            to="/fpo/dashboard"
          >
            <Icon name="home" size={18} />
            Dashboard
          </Link>

          <Link to="/fpo/organisation">
            <Icon
              name="organisation"
              size={18}
            />
            Organisation
          </Link>

          <Link to="/fpo/farmers">
            <Icon name="farmers" size={18} />
            Farmers
          </Link>

          <Link to="/fpo/staff">
            <Icon name="staff" size={18} />
            Staff
          </Link>

          <Link to="/fpo/verification">
            <Icon name="verify" size={18} />
            Verification
          </Link>

          <Link to={LOT_CREATION_ROUTE}>
            <Icon name="lot" size={18} />
            Lots
          </Link>

          <Link to="/fpo/operations">
            <Icon name="search" size={18} />
            Operations
          </Link>

          <Link to="/fpos">
            <Icon name="search" size={18} />
            FPO Directory
          </Link>
        </nav>

        <form
          className="fpo-d-search"
          onSubmit={submitSearch}
        >
          <Icon name="search" size={16} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search farmers, lots…"
            aria-label="Search farmers or lots"
          />
        </form>

        <button
          className="fpo-d-icon-button"
          onClick={() =>
            navigate(
              pending.length
                ? "/fpo/farmers"
                : "/fpo/dashboard"
            )
          }
          aria-label="Notifications"
        >
          <Icon name="bell" size={20} />

          {pending.length > 0 && (
            <span>
              {pending.length > 9
                ? "9+"
                : pending.length}
            </span>
          )}
        </button>

        <div className="fpo-d-account-wrap">
          <button
            className="fpo-d-account"
            onClick={() =>
              setMenuOpen((v) => !v)
            }
          >
            <span className="fpo-d-avatar">
              {fpoName
                .slice(0, 2)
                .toUpperCase()}
            </span>

            <span>
              <b>{fpoName}</b>
              <small>FPO Account</small>
            </span>

            <span className="fpo-d-chevron">
              ⌄
            </span>
          </button>

          {menuOpen && (
            <div className="fpo-d-account-menu">
              <Link to="/fpo/organisation">
                Organisation profile
              </Link>

              <Link to="/fpo/settings">
                Settings
              </Link>

              <button onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>

        <button
          className="fpo-d-mobile-menu"
          onClick={() =>
            setMobileNav((v) => !v)
          }
          aria-label="Open navigation"
        >
          <Icon name="menu" size={21} />
        </button>
      </header>

      <main className="fpo-d-main">
        <section className="fpo-d-hero">
          <div className="fpo-d-hero-overlay" />

          <div className="fpo-d-hero-content">
            <span className="fpo-d-kicker">
              FPO ORGANISATION WORKSPACE
            </span>

            <h1>
              Welcome back,
              <br />
              <strong>{fpoName}!</strong>
            </h1>

            <p>
              Manage your farmer network,
              membership applications and
              AARTH-ready lot workflows.
            </p>

            <div className="fpo-d-hero-meta">
              <StatusBadge
                tone={
                  data.activation_status ===
                  "ACTIVATED"
                    ? "green"
                    : "amber"
                }
              >
                {data.activation_status ===
                "ACTIVATED"
                  ? "AARTH Activated"
                  : "Government-listed"}
              </StatusBadge>

              <span>•</span>

              <span>
                {location}, Maharashtra
              </span>
            </div>

            <div className="fpo-d-hero-actions">
              <button
                className="fpo-d-brown-button"
                onClick={generateInvite}
              >
                <Icon name="plus" size={15} />

                {inviteBusy
                  ? "Generating…"
                  : "Invite / register farmer"}
              </button>

              <Link
                className="fpo-d-hero-outline"
                to="/fpo/farmers"
              >
                Open farmer network
              </Link>
            </div>
          </div>

          <div className="fpo-d-hero-mark">
            <span>FPO</span>
            <b>सामूहिक शक्ती</b>
            <small>
              Farmer network • Maharashtra
            </small>
          </div>
        </section>

        <section
          className="fpo-d-stats"
          aria-label="FPO summary"
        >
          <StatCard
            icon="farmers"
            label="Registered Farmers"
            value={summary.total}
            note={`${summary.active} active members`}
            to="/fpo/farmers"
          />

          <StatCard
            icon="application"
            label="Membership Applications"
            value={summary.pending}
            note={
              summary.pending
                ? "Needs review"
                : "No pending requests"
            }
            to="/fpo/farmers"
          />

          <StatCard
            icon="organisation"
            label="Crops Represented"
            value={data.crops?.length || 0}
            note={
              data.crops?.length
                ? data.crops
                    .slice(0, 3)
                    .join(" • ")
                : "Not recorded yet"
            }
            to="/fpo/organisation"
          />

          <StatCard
            icon="verify"
            label="Organisation Status"
            value={
              data.activation_status ===
              "ACTIVATED"
                ? "Active"
                : "Listed"
            }
            note={
              data.verification_status ===
              "AARTH_VERIFIED"
                ? "AARTH verified"
                : "Source status only"
            }
            to="/fpo/verification"
          />
        </section>

        <section className="fpo-d-grid-main">
          <div className="fpo-d-panel fpo-d-applications">
            <div className="fpo-d-panel-head">
              <div>
                <span>FARMER NETWORK</span>
                <h2>
                  Recent membership applications
                </h2>
              </div>

              <Link to="/fpo/farmers">
                View all{" "}
                <Icon name="arrow" size={16} />
              </Link>
            </div>

            {recent.length ? (
              <div className="fpo-d-table">
                <div className="fpo-d-table-head">
                  <span>Farmer</span>
                  <span>Location</span>
                  <span>Crops</span>
                  <span>Status</span>
                  <span />
                </div>

                {recent.map((member) => (
                  <Link
                    to={`/fpo/farmers/${member.membership_id}`}
                    className="fpo-d-row"
                    key={member.membership_id}
                  >
                    <span>
                      <b>
                        {member.full_name ||
                          "Farmer"}
                      </b>

                      <small>
                        {member.aarth_id ||
                          "AARTH farmer account"}
                      </small>
                    </span>

                    <span>
                      {member.village ||
                        member.taluka ||
                        member.district ||
                        "—"}
                    </span>

                    <span>
                      {member.crops
                        ?.slice(0, 2)
                        .join(" • ") || "—"}
                    </span>

                    <span>
                      <span
                        className={`fpo-d-row-status ${member.status.toLowerCase()}`}
                      >
                        {member.status ===
                        "PENDING"
                          ? "Pending"
                          : member.status ===
                            "ACTIVE"
                          ? "Active"
                          : member.status}
                      </span>
                    </span>

                    <Icon
                      name="chevron"
                      size={17}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty
                title="No farmer applications yet"
                text="Farmers can register through your invitation link or QR code. New requests will appear here for approval."
                action={
                  <Link
                    className="fpo-d-inline-action"
                    to="/fpo/farmers"
                  >
                    Open farmer network
                  </Link>
                }
              />
            )}
          </div>

          <aside className="fpo-d-panel fpo-d-profile-panel">
            <div className="fpo-d-panel-head">
              <div>
                <span>
                  ORGANISATION PROFILE
                </span>
                <h2>Profile readiness</h2>
              </div>

              <Icon
                name="organisation"
                size={22}
              />
            </div>

            <div className="fpo-d-progress">
              <span
                style={{
                  width: `${profileCompletion}%`,
                }}
              />

              <b>{profileCompletion}%</b>
            </div>

            <strong className="fpo-d-profile-title">
              {profileCompletion >= 100
                ? "Organisation profile complete"
                : "Complete your organisation profile"}
            </strong>

            <p>
              Keep organisation and source
              details complete so farmers can
              understand who they are joining.
            </p>

            <Link
              className="fpo-d-brown-button"
              to="/fpo/organisation"
            >
              Manage profile{" "}
              <Icon name="arrow" size={17} />
            </Link>

            <div className="fpo-d-profile-location">
              <span>Registered location</span>
              <b>{location}</b>
              <small>
                {data.village ||
                  "Village not recorded"}
              </small>
            </div>
          </aside>
        </section>

        <section className="fpo-d-actions-grid">
          <QuickAction
            icon="farmers"
            title="Register / invite farmer"
            text="Generate a safe farmer registration link or code. The farmer keeps their own AARTH account."
            to="/fpo/farmers"
          />

          <QuickAction
            icon="lot"
            title="Create FPO lot"
            text="Open the lot-creation handoff. The main lot engine will be connected here in the next phase."
            to={LOT_CREATION_ROUTE}
          />

          <QuickAction
            icon="application"
            title="Review applications"
            text={`${summary.pending} membership ${
              summary.pending === 1
                ? "request"
                : "requests"
            } currently pending approval.`}
            to="/fpo/farmers"
          />

          <QuickAction
            icon="staff"
            title="Manage staff"
            text="Assign organisation roles with least-privilege access."
            to="/fpo/staff"
          />
        </section>

        <section className="fpo-d-lower-grid">
          <div className="fpo-d-panel fpo-d-network-panel">
            <div className="fpo-d-panel-head">
              <div>
                <span>FARMER NETWORK</span>
                <h2>Active member overview</h2>
              </div>

              <Link to="/fpo/farmers">
                Manage{" "}
                <Icon name="arrow" size={16} />
              </Link>
            </div>

            <div className="fpo-d-network-numbers">
              <div>
                <strong>
                  {summary.total}
                </strong>
                <span>Total registered</span>
              </div>

              <div>
                <strong>
                  {summary.active}
                </strong>
                <span>Active members</span>
              </div>

              <div>
                <strong>
                  {summary.inactive}
                </strong>
                <span>
                  Inactive / suspended
                </span>
              </div>
            </div>

            {data.crops?.length ? (
              <div className="fpo-d-crop-list">
                {data.crops
                  .slice(0, 6)
                  .map((crop) => (
                    <span key={crop}>
                      {crop}
                    </span>
                  ))}
              </div>
            ) : (
              <p className="fpo-d-muted">
                No crop information has been
                recorded for this FPO yet.
              </p>
            )}
          </div>

          <div className="fpo-d-panel fpo-d-lot-panel">
            <div className="fpo-d-panel-head">
              <div>
                <span>LOT WORKSPACE</span>
                <h2>
                  Ready for the next layer
                </h2>
              </div>

              <Icon name="lot" size={22} />
            </div>

            <div className="fpo-d-lot-empty">
              <div className="fpo-d-lot-icon">
                <Icon name="lot" size={28} />
              </div>

              <div>
                <strong>
                  No active lots yet
                </strong>

                <p>
                  When the main lot-creation
                  backend is connected, FPO lots
                  will appear here. Farmers can
                  remain independent while FPO
                  aggregation is optional.
                </p>

                <Link
                  to={LOT_CREATION_ROUTE}
                >
                  Open lot creation{" "}
                  <Icon name="arrow" size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="fpo-d-footer-actions">
          <Link to="/fpo/verification">
            <Icon name="verify" size={21} />

            <span>
              <b>Verification</b>
              <small>
                {data.verification_status ===
                "AARTH_VERIFIED"
                  ? "AARTH verified"
                  : "Review verification status"}
              </small>
            </span>

            <Icon
              name="chevron"
              size={18}
            />
          </Link>

          <Link to="/fpos">
            <Icon name="search" size={21} />

            <span>
              <b>FPO Directory</b>
              <small>
                Discover and review other FPOs
              </small>
            </span>

            <Icon
              name="chevron"
              size={18}
            />
          </Link>

          <a href="mailto:support@aarth.example">
            <Icon name="support" size={21} />

            <span>
              <b>Support</b>
              <small>
                Get help with the AARTH FPO
                workspace
              </small>
            </span>

            <Icon
              name="chevron"
              size={18}
            />
          </a>
        </section>
      </main>

      {invite && (
        <div
          className="fpo-d-modal-backdrop"
          onMouseDown={() => setInvite(null)}
        >
          <div
            className="fpo-d-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="fpo-d-modal-close"
              onClick={() => setInvite(null)}
            >
              ×
            </button>

            <span className="fpo-d-kicker">
              FARMER REGISTRATION
            </span>

            <h2>
              Invite a farmer to {fpoName}
            </h2>

            <p>
              The farmer will create or use
              their own AARTH account and then
              request membership. No shared
              credentials are created.
            </p>

            <div className="fpo-d-invite-code">
              <small>
                Registration code
              </small>
              <b>{invite.code}</b>
            </div>

            <div className="fpo-d-invite-link">
              <small>
                Registration link
              </small>

              <input
                readOnly
                value={invite.link}
              />

              <button onClick={copyInvite}>
                <Icon name="copy" size={17} />
                Copy
              </button>
            </div>

            <div className="fpo-d-qr-wrap">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  invite.link
                )}`}
                alt="Farmer registration QR code"
              />

              <span>
                Scan to open the farmer
                registration flow.
              </span>
            </div>

            <div className="fpo-d-modal-actions">
              <button
                className="fpo-d-brown-button"
                onClick={copyInvite}
              >
                Copy link
              </button>

              <button
                className="fpo-d-outline-button"
                onClick={() => setInvite(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && !invite && (
        <button
          className="fpo-d-toast"
          onClick={() => setNotice("")}
        >
          {notice}
        </button>
      )}

      {inviteBusy && (
        <div className="fpo-d-busy">
          Generating registration link…
        </div>
      )}
    </div>
  );
}