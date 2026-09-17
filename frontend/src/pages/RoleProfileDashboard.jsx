import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { authApi } from "../api/auth";

import logo from "../assets/aarth-logo.png";

const ROLE_PATHS = {
  FARMER: "/farmer",
  FPO: "/fpo",
  BUYER: "/buyer",
  LOGISTICS_PARTNER: "/logistics-partner",
  STORAGE_PARTNER: "/storage-partner",
  ADMIN: "/admin",
};

function getStoredSession() {
  try {
    return JSON.parse(
      localStorage.getItem("aarth_session") || "null"
    );
  } catch {
    return null;
  }
}

function getDisplayName(profile, config) {
  const data = profile?.profile_data || {};

  for (const field of config.nameFields || []) {
    if (data[field]) {
      return data[field];
    }
  }

  return profile?.username || config.welcome;
}

function getInitialValues(config, profile) {
  const saved = profile?.profile_data || {};

  const initial = {};

  config.fields.forEach((field) => {
    initial[field.key] =
      saved[field.key] ?? "";
  });

  return initial;
}

function getCompletion(config, values) {
  const requiredFields = config.fields.filter(
    (field) => field.required
  );

  if (requiredFields.length === 0) {
    return {
      percentage: 0,
      completed: 0,
      total: 0,
    };
  }

  const completed = requiredFields.filter(
    (field) =>
      String(values[field.key] ?? "").trim()
        .length > 0
  ).length;

  return {
    percentage: Math.round(
      (completed / requiredFields.length) * 100
    ),
    completed,
    total: requiredFields.length,
  };
}

export default function RoleProfileDashboard({
  config,
}) {
  const navigate = useNavigate();

  const [session, setSession] = useState(
    getStoredSession
  );

  const [values, setValues] = useState(() =>
    getInitialValues(
      config,
      getStoredSession()?.profile
    )
  );

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");

  const [activeNav, setActiveNav] =
    useState("Profile");

  const completion = useMemo(
    () =>
      getCompletion(
        config,
        values
      ),
    [config, values]
  );

  useEffect(() => {
    let mounted = true;

    async function verifyAndLoadProfile() {
      const currentSession =
        authApi.getSession();

      if (
        !currentSession?.access_token
      ) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        /*
         * IMPORTANT:
         *
         * Never determine the user's role from
         * localStorage alone.
         *
         * Ask the backend, which verifies the
         * Supabase access token and retrieves
         * public.profiles.role.
         */
        const profile =
          await authApi.me();

        if (!profile?.role) {
          throw new Error(
            "AARTH profile does not contain a role."
          );
        }

        /*
         * If the user manually opens another
         * role's URL, send them to their real
         * dashboard.
         */
        if (
          profile.role !== config.role
        ) {
          navigate(
            ROLE_PATHS[profile.role] ||
              "/login",
            {
              replace: true,
            }
          );

          return;
        }

        const nextSession = {
          ...currentSession,
          profile,
        };

        localStorage.setItem(
          "aarth_session",
          JSON.stringify(nextSession)
        );

        if (!mounted) {
          return;
        }

        setSession(nextSession);

        setValues(
          getInitialValues(
            config,
            profile
          )
        );
      } catch (error) {
        console.error(
          "AARTH session verification failed:",
          error
        );

        authApi.clearSession();

        if (mounted) {
          navigate("/login", {
            replace: true,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    verifyAndLoadProfile();

    return () => {
      mounted = false;
    };
  }, [config, navigate]);

  function updateField(key, value) {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function saveProfile(
    continueAfterSave = false
  ) {
    if (saving) {
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      /*
       * Only send fields belonging to the current
       * role's basic profile.
       *
       * This prevents future fields such as:
       * payment preference,
       * selling urgency,
       * typical selling quantity,
       * payment terms,
       * etc.
       *
       * from being accidentally submitted here.
       */
      const profileData = {};

      config.fields.forEach(
        (field) => {
          profileData[field.key] =
            values[field.key] ?? "";
        }
      );

      const response =
        await authApi.saveProfile(
          profileData
        );

      if (
        !response?.profile
      ) {
        throw new Error(
          "The server did not return the updated AARTH profile."
        );
      }

      const nextSession = {
        ...session,
        profile:
          response.profile,
      };

      localStorage.setItem(
        "aarth_session",
        JSON.stringify(
          nextSession
        )
      );

      setSession(nextSession);

      setValues(
        getInitialValues(
          config,
          response.profile
        )
      );

      setNotice(
        continueAfterSave
          ? "Profile saved successfully."
          : "Draft saved successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "AARTH profile save failed:",
        error
      );

      setNotice(
        error?.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    authApi.logout();

    navigate("/login", {
      replace: true,
    });
  }

  if (loading) {
    return (
      <div className="aarth-loading">
        <div className="aarth-loader" />

        <h2>AARTH</h2>

        <p>
          Loading your{" "}
          {config.roleLabel.toLowerCase()}{" "}
          dashboard...
        </p>
      </div>
    );
  }

  const profile =
    session?.profile || {};

  const displayName =
    getDisplayName(
      profile,
      config
    );

  return (
    <div
      className={`onboarding role-${config.slug}`}
      style={{
        "--accent": config.accent,
        "--deep": config.deep,
        "--soft": config.soft,
      }}
    >
      {/* =====================================================
          LEFT SIDEBAR
      ====================================================== */}

      <aside className="portal-sidebar">
        <div className="portal-brand">
          <img
            src={logo}
            alt="AARTH"
          />

          <strong>AARTH</strong>

          <small>
            FROM FARM TO BETTER MARKETS
          </small>
        </div>

        <div className="role-sidebar-title">
          {config.roleLabel}
        </div>

        <nav>
          {config.nav.map(
            (item) => (
              <button
                type="button"
                key={item.label}
                className={
                  activeNav ===
                  item.label
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveNav(
                    item.label
                  )
                }
              >
                <span>
                  {item.icon}
                </span>

                {item.label}
              </button>
            )
          )}
        </nav>

        <button
          type="button"
          className="logout"
          onClick={logout}
        >
          ⇥&nbsp; Logout
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="portal-main">
        {/* HEADER */}

        <header className="portal-header">
          <div className="welcome-icon">
            {config.icon}
          </div>

          <div>
            <h1>
              Welcome,{" "}
              {displayName}!
            </h1>

            <p>
              {config.subtitle}
            </p>
          </div>

          <div className="portal-tagline">
            {config.tagline.map(
              (line) => (
                <span key={line}>
                  {line}
                </span>
              )
            )}
          </div>
        </header>

        {/* =================================================
            ACCOUNT INFORMATION
        ================================================== */}

        <section className="role-dashboard-strip">
          <div>
            <span className="strip-label">
              AARTH ID
            </span>

            <strong>
              {profile.aarth_id ||
                "Not assigned"}
            </strong>
          </div>

          <div>
            <span className="strip-label">
              ROLE ID
            </span>

            <strong>
              {profile.role_id ||
                "Not assigned"}
            </strong>
          </div>

          <div>
            <span className="strip-label">
              ACCOUNT TYPE
            </span>

            <strong>
              {config.roleLabel}
            </strong>
          </div>

          <div>
            <span className="strip-label">
              ACCOUNT STATUS
            </span>

            <strong>
              {profile.status ||
                "ACTIVE"}
            </strong>
          </div>
        </section>

        {/* =================================================
            CONTENT
        ================================================== */}

        <div className="portal-content">
          {/* =================================================
              PROFILE FORM
          ================================================== */}

          <section className="form-card">
            <div className="form-title">
              <div>
                <h2>
                  Complete your profile
                </h2>

                <p className="form-description">
                  {config.formDescription}
                </p>
              </div>

              <span>
                {config.roleLabel}
              </span>
            </div>

            {/* STEPPER */}

            <div className="stepper">
              {config.steps.map(
                (step, index) => (
                  <div
                    key={step}
                    className={
                      index === 0
                        ? "current"
                        : ""
                    }
                  >
                    <i>
                      {index + 1}
                    </i>

                    <small>
                      {step}
                    </small>
                  </div>
                )
              )}
            </div>

            {/* FORM */}

            <div className="details-box">
              <h3>
                <em>
                  {config.sectionIcon}
                </em>

                {config.sectionTitle}
              </h3>

              <div className="field-grid">
                {config.fields.map(
                  (field) => (
                    <label
                      key={field.key}
                      className={
                        field.wide
                          ? "wide"
                          : ""
                      }
                    >
                      <span>
                        {field.label}

                        {field.required && (
                          <sup>
                            *
                          </sup>
                        )}
                      </span>

                      {field.type ===
                      "select" ? (
                        <select
                          value={
                            values[
                              field.key
                            ] || ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateField(
                              field.key,
                              event.target
                                .value
                            )
                          }
                        >
                          <option value="">
                            {field.placeholder ||
                              "Select"}
                          </option>

                          {(
                            field.options ||
                            []
                          ).map(
                            (option) => (
                              <option
                                value={
                                  option
                                }
                                key={
                                  option
                                }
                              >
                                {option}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <input
                          type={
                            field.type ||
                            "text"
                          }
                          value={
                            values[
                              field.key
                            ] || ""
                          }
                          placeholder={
                            field.placeholder ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateField(
                              field.key,
                              event.target
                                .value
                            )
                          }
                        />
                      )}
                    </label>
                  )
                )}
              </div>

              <footer>
                <button
                  type="button"
                  className="draft"
                  disabled={saving}
                  onClick={() =>
                    saveProfile(false)
                  }
                >
                  ▣&nbsp; Save as draft
                </button>

                <button
                  type="button"
                  className="continue"
                  disabled={saving}
                  onClick={() =>
                    saveProfile(true)
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save & Continue →"}
                </button>
              </footer>
            </div>
          </section>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <aside className="profile-aside">
            {/* READINESS */}

            <section className="readiness-card">
              <h3>
                Profile readiness
              </h3>

              <div>
                <strong>
                  {completion.percentage}%
                </strong>

                <p>
                  <b>
                    {completion.completed}{" "}
                    of{" "}
                    {completion.total}{" "}
                    required fields
                    completed
                  </b>

                  <br />

                  Complete your basic
                  profile to unlock
                  AARTH opportunities.
                </p>
              </div>
            </section>

            {/* TIP */}

            <section className="tip-card">
              <span>
                {config.tipIcon}
              </span>

              <p>
                {config.tip}
              </p>
            </section>

            {/* ROLE VISUAL */}

            <section
              className={`role-visual ${
                config.visualClass
              }`}
            >
              <div className="visual-shape visual-shape-one" />

              <div className="visual-shape visual-shape-two" />

              <div className="visual-icon">
                {config.visualIcon}
              </div>

              <div className="visual-copy">
                {config.visualLines.map(
                  (line) => (
                    <span
                      key={line}
                    >
                      {line}
                    </span>
                  )
                )}
              </div>
            </section>

            {/* QUICK INFORMATION */}

            <section className="quick-card">
              <div className="quick-icon">
                {config.quickIcon}
              </div>

              <div>
                <strong>
                  {config.quickTitle}
                </strong>

                <p>
                  {config.quickText}
                </p>
              </div>
            </section>
          </aside>
        </div>

        {/* SAVE MESSAGE */}

        {notice && (
          <div className="save-notice">
            ✓ {notice}

            <button
              type="button"
              onClick={() =>
                setNotice("")
              }
            >
              ×
            </button>
          </div>
        )}
      </main>
    </div>
  );
}