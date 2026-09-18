import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authApi, dashboardPath } from "../api/auth";

import logo from "../assets/aarth-logo.png";
import background from "../assets/aarth-login-bg.png";

import "./LoginPage.css";

const ROLE_LABELS = {
  FARMER: "Farmer",
  BUYER: "Buyer",
  FPO: "FPO",
  LOGISTICS_PARTNER: "Logistics Partner",
  STORAGE_PARTNER: "Storage Partner",
};

const ROLE_GROUPS = {
  individual: [
    ["FARMER", "Farmer"],
    ["BUYER", "Buyer"],
    ["LOGISTICS_PARTNER", "Logistics Partner"],
  ],

  organization: [
    ["FPO", "FPO"],
    ["STORAGE_PARTNER", "Storage Partner"],
  ],
};

const PENDING_INVITE_KEY = "aarth_pending_fpo_invite";

export default function LoginPage({ initialMode = "login" }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode);

  const [accountType, setAccountType] =
    useState("individual");

  const [role, setRole] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError("");
  }, [initialMode]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess(null);

    navigate(
      nextMode === "register"
        ? "/register"
        : "/login",
      {
        replace: true,
      }
    );
  }

    function changeAccountType(type) {
      setAccountType(type);
      setRole("");
    }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    if (mode === "register" && !role) {
  setError("Please select your account role before creating your account.");
    return;
    }
    setLoading(true);

    try {
      let data;

      if (mode === "login") {
        data = await authApi.login(
          username,
          password
        );

        localStorage.setItem(
          "aarth_welcome",
          `Welcome to AARTH, ${data.profile.username}.`
        );

        /*
         * IMPORTANT:
         *
         * Login does NOT ask the user for a role.
         *
         * The backend returns the role stored in
         * public.profiles.
         */
        navigate(
          data.profile.role === "FARMER" &&
            localStorage.getItem(PENDING_INVITE_KEY)
            ? `/fpo/join/${encodeURIComponent(
                localStorage.getItem(PENDING_INVITE_KEY)
              )}`
            : dashboardPath(data.profile.role),
          {
            replace: true,
          }
        );
      } else {
        data = await authApi.register(
          username,
          password,
          role
        );

        localStorage.setItem(
          "aarth_welcome",
          `Welcome to AARTH, ${data.profile.username}.`
        );

        /*
         * Do not redirect immediately.
         *
         * Show the AARTH ID first.
         */
        setSuccess({
          role: data.profile.role,
          aarthId: data.profile.aarth_id,
          roleId: data.profile.role_id,
        });
      }
    } catch (error) {
      setError(
        error?.message ||
          "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyAarthId() {
    const idToCopy =
      success?.roleId || success?.aarthId;

    if (!idToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        idToCopy
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  function continueAfterRegistration() {
    if (!success?.role) {
      return;
    }

    const pendingInvite = localStorage.getItem(
      PENDING_INVITE_KEY
    );

    navigate(
      success.role === "FARMER" && pendingInvite
        ? `/fpo/join/${encodeURIComponent(pendingInvite)}`
        : dashboardPath(success.role),
      {
        replace: true,
      }
    );
  }

  return (
    <main
      className="login-page"
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      <section className="login-panel">
        <div className="brand-section">
          <img
            src={logo}
            alt="AARTH"
            className="aarth-logo"
          />

          <p>
            FROM FARM TO BETTER MARKETS
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={
              mode === "login"
                ? "active"
                : ""
            }
            onClick={() =>
              switchMode("login")
            }
          >
            Login
          </button>

          <button
            type="button"
            className={
              mode === "register"
                ? "active"
                : ""
            }
            onClick={() =>
              switchMode("register")
            }
          >
            Register
          </button>
        </div>

        <div className="login-content">
          <h1>
            {mode === "login"
              ? "Welcome back"
              : "Join AARTH"}
          </h1>

          <p className="login-subtitle">
            {mode === "login"
              ? "Sign in with your AARTH username and password."
              : "Create your AARTH account and select your role."}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="registration-role">
                <label>
                  Registration type
                </label>

                <div className="selection-grid">
                  <button
                    type="button"
                    className={`selection-card ${
                      accountType ===
                      "individual"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      changeAccountType(
                        "individual"
                      )
                    }
                  >
                    <span className="selection-title">
                      Individual
                    </span>

                    <span className="selection-description">
                      Farmer, buyer or logistics
                      partner
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`selection-card ${
                      accountType ===
                      "organization"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      changeAccountType(
                        "organization"
                      )
                    }
                  >
                    <span className="selection-title">
                      Organization
                    </span>

                    <span className="selection-description">
                      FPO or storage partner
                    </span>
                  </button>
                </div>

                <div className="role-grid">
                  {ROLE_GROUPS[
                    accountType
                  ].map(
                    ([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        className={`role-button ${
                          role === value
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setRole(value)
                        }
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                required
                minLength={4}
                maxLength={30}
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                autoComplete="username"
                placeholder="Enter your username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                placeholder="At least 8 characters, including a number"
              />
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={
                loading ||
                (mode === "register" && !role)
              }
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login →"
                : "Create account →"}
            </button>
          </form>
        </div>
      </section>

      {success && (
        <div
          className="success-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="success-modal">
            <div className="success-check">
              ✓
            </div>

            <h2>
              Registered Successfully
            </h2>

            <p>
              Your{" "}
              {ROLE_LABELS[
                success.role
              ]}{" "}
              ID is
            </p>

            <strong>
              {success.roleId || success.aarthId}
            </strong>

            <div className="success-actions">
              <button
                type="button"
                onClick={copyAarthId}
              >
                {copied
                  ? "Copied ✓"
                  : "Copy ID"}
              </button>

              <button
                type="button"
                className="success-primary"
                onClick={
                  continueAfterRegistration
                }
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}