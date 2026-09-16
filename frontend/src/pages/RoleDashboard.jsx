import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { authApi } from "../api/auth";

import logo from "../assets/aarth-logo.png";

function getSession() {
  try {
    return JSON.parse(
      localStorage.getItem("aarth_session") ||
        "null"
    );
  } catch {
    return null;
  }
}

function getFieldKey(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function getPrimaryName(profile, config) {
  const data = profile?.profile_data || {};

  for (const key of config.nameFields) {
    if (data[key]) {
      return data[key];
    }
  }

  return profile?.username || config.welcome;
}

function createInitialValues(config, profile) {
  const stored = profile?.profile_data || {};

  const result = {};

  config.fields.forEach((field) => {
    const key = field.key;

    result[key] =
      stored[key] !== undefined
        ? stored[key]
        : "";
  });

  return result;
}

export default function RoleProfileDashboard({
  config,
}) {
  const navigate = useNavigate();

  const [session, setSession] =
    useState(getSession);

  const [values, setValues] =
    useState(() =>
      createInitialValues(
        config,
        getSession()?.profile
      )
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [activeNav, setActiveNav] =
    useState("Profile");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const storedSession =
        authApi.getSession();

      if (
        !storedSession?.access_token
      ) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        const profile =
          await authApi.me();

        if (
          profile.role !==
          config.role
        ) {
          navigate(
            config.dashboardPathForRole(
              profile.role
            ),
            {
              replace: true,
            }
          );

          return;
        }

        const updatedSession = {
          ...storedSession,
          profile,
        };

        localStorage.setItem(
          "aarth_session",
          JSON.stringify(
            updatedSession
          )
        );

        if (mounted) {
          setSession(
            updatedSession
          );

          setValues(
            createInitialValues(
              config,
              profile
            )
          );
        }
      } catch {
        authApi.clearSession();

        navigate("/login", {
          replace: true,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [config, navigate]);

  const profile =
    session?.profile || {};

  const displayName = useMemo(
    () =>
      getPrimaryName(
        profile,
        config
      ),
    [profile, config]
  );

  const readiness = useMemo(() => {
    const requiredFields =
      config.fields.filter(
        (field) => field.required
      );

    if (!requiredFields.length) {
      return 0;
    }

    const completed =
      requiredFields.filter(
        (field) =>
          String(
            values[field.key] ?? ""
          ).trim().length > 0
      ).length;

    return Math.round(
      (completed /
        requiredFields.length) *
        100
    );
  }, [config.fields, values]);

  const completedFields =
    config.fields.filter(
      (field) =>
        field.required &&
        String(
          values[field.key] ?? ""
        ).trim().length > 0
    ).length;

  async function saveProfile(
    continueAfterSave
  ) {
    setSaving(true);
    setNotice("");

    try {
      /*
       * Only fields defined by this role
       * are sent to the backend.
       *
       * This prevents future-sprint fields
       * from accidentally being stored.
       */
      const cleanData = {};

      config.fields.forEach(
        (field) => {
          cleanData[field.key] =
            values[field.key] ?? "";
        }
      );

      const response =
        await authApi.saveProfile(
          cleanData
        );

      const nextSession = {
        ...session,
        profile: response.profile,
      };

      localStorage.setItem(
        "aarth_session",
        JSON.stringify(
          nextSession
        )
      );

      setSession(nextSession);

      setNotice(
        continueAfterSave
          ? "Profile saved successfully."
          : "Draft saved successfully."
      );

      if (continueAfterSave) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (error) {
      setNotice(
        error?.message ||
          "Could not save the profile."
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

  function updateField(
    key,
    value
  ) {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  if (loading) {
    return (
      <div className="aarth-loading">
        <div className="aarth-loader"></div>

        <h2>AARTH</h2>

        <p>
          Loading your{" "}
          {config.roleLabel.toLowerCase()}{" "}
          dashboard...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`onboarding role-${config.slug}`}
      style={{
        "--accent": config.accent,
        "--deep": config.deep,
        "--soft": config.soft,
      }}
    >
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
                key={item.label}
                type="button"
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
          className="logout"
          type="button"
          onClick={logout}
        >
          ⇥&nbsp; Logout
        </button>
      </aside>

      <main className="portal-main">
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
              ACCOUNT
            </span>

            <strong>
              {config.roleLabel}
            </strong>
          </div>

          <div>
            <span className="strip-label">
              PROFILE STATUS
            </span>

            <strong>
              {profile.status ||
                "ACTIVE"}
            </strong>
          </div>
        </section>

        <div className="portal-content">
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
                            ]
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

                          {field.options.map(
                            (option) => (
                              <option
                                key={
                                  option
                                }
                                value={
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
                            ]
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
                  className="draft"
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    saveProfile(false)
                  }
                >
                  ▣&nbsp; Save as draft
                </button>

                <button
                  className="continue"
                  type="button"
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

          <aside className="profile-aside">
            <section className="readiness-card">
              <h3>
                Profile readiness
              </h3>

              <div>
                <strong>
                  {readiness}%
                </strong>

                <p>
                  <b>
                    {completedFields} of{" "}
                    {
                      config.fields.filter(
                        (field) =>
                          field.required
                      ).length
                    }{" "}
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

            <section className="tip-card">
              <span>
                {config.tipIcon}
              </span>

              <p>
                {config.tip}
              </p>
            </section>

            <section
              className={`role-visual ${config.visualClass}`}
            >
              <div className="visual-shape visual-shape-one"></div>
              <div className="visual-shape visual-shape-two"></div>

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