
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { authApi, lotApi } from "../api/auth";
import { fpoApi } from "../api/fpos";

import logo from "../assets/aarth-logo.png";
import FarmerIdentityCard from "../components/FarmerIdentityCard";

import {
  MAHARASHTRA_VILLAGE_CONFIG,
} from "../data/maharashtraLocations";

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
    initial[field.key] = saved[field.key] ?? (
      field.key === "full_name"
        ? profile?.username || ""
        : ""
    );
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

  const [loading, setLoading] = useState(() => {
    const initialSession = getStoredSession();
    return initialSession?.profile?.role !== config.role;
  });

  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");

  const [activeNav, setActiveNav] =
    useState("Profile");

  const [activeStep, setActiveStep] = useState(0);

  const [cropSearch, setCropSearch] = useState("");

  const [openCropCategory, setOpenCropCategory] = useState("");

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [attemptedSteps, setAttemptedSteps] = useState([]);

  const [fpoMemberships, setFpoMemberships] = useState([]);

  const [lotSummary, setLotSummary] = useState(null);

  const completion = useMemo(
    () =>
      getCompletion(
        config,
        values
      ),
    [config, values]
  );

  const savedCompletion = useMemo(
    () => getCompletion(config, getInitialValues(config, session?.profile)),
    [config, session?.profile]
  );

  useEffect(() => {
    if (config.role !== "FARMER") {
      return undefined;
    }

    let active = true;
    fpoApi.farmerMembership()
      .then((result) => active && setFpoMemberships(result.items || []))
      .catch(() => active && setFpoMemberships([]));

    return () => {
      active = false;
    };
  }, [config.role]);

  useEffect(() => {
    if (config.role !== "FARMER") {
      return undefined;
    }

    let active = true;
    lotApi.summary()
      .then((result) => active && setLotSummary(result))
      .catch(() => active && setLotSummary(null));

    return () => {
      active = false;
    };
  }, [config.role]);

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
      ...(key === "district"
        ? { taluka: "", village: "" }
        : {}),
      ...(key === "taluka" ? { village: "" } : {}),
    }));
  }

  function toggleCrop(cropKey) {
    const selected = Array.isArray(values.crops_grown)
      ? values.crops_grown
      : [];

    updateField(
      "crops_grown",
      selected.includes(cropKey)
        ? selected.filter((key) => key !== cropKey)
        : [...selected, cropKey]
    );
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

  if (config.slug === "farmer") {
    const fieldsForStep = config.fields.filter(
      (field) => field.step === activeStep && !field.hidden
    );
    const field = (key) => config.fields.find((item) => item.key === key);
    const cropField = field("crops_grown");
    const selectedCrops = Array.isArray(values.crops_grown)
      ? values.crops_grown
      : [];
    const cropLookup = new Map(
      Object.values(cropField?.categories || {}).flat().map((crop) => [crop.key, crop])
    );
    const location = [values.village, values.taluka, values.district]
      .filter(Boolean)
      .join(", ");
    const isConditionalFieldVisible = (item) =>
      !item.dependsOn ||
      item.key === "taluka" ||
      (item.key === "fpo_name" && values.fpo_membership === "Yes") ||
      (item.key === "storage_type" && values.storage_access === "Available");
    const isStepComplete = (stepIndex) => {
      const required = config.fields.filter(
        (item) => item.step === stepIndex && item.required && isConditionalFieldVisible(item)
      );
      return required.length > 0 && required.every((item) => {
        const value = values[item.key];
        return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
      });
    };
    const goToStep = (nextStep) => {
      if (nextStep > activeStep && !isStepComplete(activeStep)) {
        setAttemptedSteps((current) => [...new Set([...current, activeStep])]);
      }
      setActiveStep(nextStep);
    };
    const selectFarmerNav = (label) => {
      setActiveNav(label);
      if (label === "Market Insights") {
        navigate("/farmer/market-insights");
        return;
      }
      if (label === "Create Lot") {
        navigate("/farmer/lots/new");
        return;
      }
      if (label === "My Lots") {
        navigate("/farmer/lots");
        return;
      }
      if (label === "Buyers") {
        navigate("/farmer/buyers");
        return;
      }
      if (label === "Profile") {
        requestAnimationFrame(() => {
          document.querySelector(".redesigned-form-card")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    };
    const farmerNavIcons = {
      home: "⌂",
      user: "●",
      chart: "▥",
      box: "◇",
      users: "♧",
      buyers: "♧",
      book: "▤",
      cloud: "☁",
      headset: "◉",
    };
    const renderInput = (item) => {
      if (!isConditionalFieldVisible(item)) return null;
      const label = <span className="field-label-row"><i className="field-label-icon">{item.icon === "map" ? "⌖" : item.icon === "sprout" ? "☘" : item.icon === "phone" ? "☎" : "●"}</i>{item.label}{item.required && <sup>*</sup>}</span>;
      if (item.key === "district") {
        return <label className="profile-field">{label}<select value={values.district || ""} onChange={(event) => updateField("district", event.target.value)}><option value="">Select district</option>{(item.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
      }
      if (item.key === "taluka") {
        const options = item.optionsByParent?.[values.district] || [];
        return <label className="profile-field">{label}<select disabled={!values.district} value={values.taluka || ""} onChange={(event) => updateField("taluka", event.target.value)}><option value="">{values.district ? "Select taluka" : "Select district first"}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
      }
      if (item.key === "village") {
        const enabled = Boolean(values.district && values.taluka);
        return <label className="profile-field wide village-search-control">{label}<input disabled={!enabled} value={values.village || ""} placeholder={enabled ? "⌕ Search your village..." : values.district ? MAHARASHTRA_VILLAGE_CONFIG.selectTalukaFirst : MAHARASHTRA_VILLAGE_CONFIG.selectDistrictFirst} onChange={(event) => updateField("village", event.target.value)} /><small className="location-helper">{enabled ? `Search is limited to ${values.taluka}, ${values.district}.` : "Choose your district and taluka before searching."}</small></label>;
      }
      if (item.key === "crops_grown") {
        const categories = Object.entries(item.categories || {}).filter(([, crops]) => crops.some((crop) => `${crop.name} ${crop.key} ${crop.code}`.toLowerCase().includes(cropSearch.toLowerCase())));
        return <div className="profile-field wide">{label}<div className="crop-selector"><div className="crop-selected-summary"><span className="crop-summary-label">{selectedCrops.length ? "Selected crops" : "Select one or more crops"}</span>{selectedCrops.length > 0 && <div className="crop-chip-list">{selectedCrops.map((key) => <button type="button" className="crop-chip" key={key} onClick={() => toggleCrop(key)}>{cropLookup.get(key)?.name || key}<span>×</span></button>)}</div>}</div><div className="crop-search"><span>⌕</span><input value={cropSearch} placeholder="Search crops..." onChange={(event) => setCropSearch(event.target.value)} /></div><div className="crop-category-grid">{categories.length ? categories.map(([category, crops]) => { const visible = crops.filter((crop) => `${crop.name} ${crop.key} ${crop.code}`.toLowerCase().includes(cropSearch.toLowerCase())); const open = cropSearch || openCropCategory === category; return <section className={`crop-category ${open ? "open" : ""}`} key={category}><button className="crop-category-trigger" type="button" onClick={() => setOpenCropCategory(open ? "" : category)}><span><strong>{category}</strong><small>{visible.length} crops</small></span><b className="crop-chevron">⌄</b></button>{open && <div className="crop-option-panel">{visible.map((crop) => <button type="button" className={`crop-option ${selectedCrops.includes(crop.key) ? "selected" : ""}`} key={crop.key} onClick={() => toggleCrop(crop.key)}><i className="crop-check">{selectedCrops.includes(crop.key) ? "✓" : ""}</i><span><b>{crop.name}</b><small>{crop.code}</small></span></button>)}</div>}</section>; }) : <p className="empty-dropdown">No crops found</p>}</div></div></div>;
      }
      if (item.key === "cultivation_type" || item.key === "fpo_membership" || item.key === "storage_access") {
        return <fieldset className={`profile-field ${item.wide ? "wide" : ""}`}><legend>{label}</legend><div className="segmented-options">{item.options.map((option) => <label key={option}><input type="radio" name={item.key} checked={values[item.key] === option} onChange={() => updateField(item.key, option)} /><span>{option}</span></label>)}</div></fieldset>;
      }
      if (item.type === "textarea") return <label className="profile-field wide">{label}<span className="textarea-wrap"><textarea maxLength={item.maxLength} value={values[item.key] || ""} placeholder={item.placeholder} onChange={(event) => updateField(item.key, event.target.value)} /><small>{String(values[item.key] || "").length}/{item.maxLength}</small></span></label>;
      if (item.type === "select") return <label className="profile-field">{label}<select value={values[item.key] || ""} onChange={(event) => updateField(item.key, event.target.value)}><option value="">{item.placeholder}</option>{item.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
      return <label className={`profile-field ${item.wide ? "wide" : ""}`}>{label}<input type={item.type || "text"} value={values[item.key] || ""} placeholder={item.placeholder} readOnly={item.readOnlyFromRegistration && Boolean(values[item.key])} onChange={(event) => updateField(item.key, event.target.value)} /></label>;
    };

    return <div className="onboarding role-farmer" style={{ "--accent": config.accent, "--deep": config.deep, "--soft": config.soft }}>
      <header className="aarth-topbar"><div className="aarth-brand-block"><img src={logo} alt="AARTH" /><span><strong>AARTH</strong><small>FARMERS · MARKETS · OPPORTUNITIES</small></span></div><nav className="aarth-main-nav">{(config.nav.some((item) => item.label === "Buyers") ? config.nav : [...config.nav, { label: "Buyers", icon: "buyers" }]).map((item) => <button type="button" key={item.label} className={activeNav === item.label ? "active" : ""} onClick={() => selectFarmerNav(item.label)}><b>{farmerNavIcons[item.icon] || "•"}</b><span>{item.label}</span></button>)}</nav><div className="aarth-topbar-actions"><label className="aarth-search-box"><span>⌕</span><input placeholder="Search markets, crops, buyers..." /></label><button type="button" className="top-icon-button" aria-label="Notifications">♧<i className="notification-dot" /></button><div className="farmer-account-menu"><button type="button" className="farmer-account" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}><span className="farmer-avatar">{displayName.slice(0, 2).toUpperCase()}</span><span className="farmer-account-copy"><strong>{displayName}</strong><small>Farmer</small></span><b className="account-chevron">⌄</b></button>{accountMenuOpen && <div className="account-dropdown"><span>{displayName}</span><button type="button" onClick={logout}>↪ Log out</button></div>}</div></div></header>
      <main className="redesigned-farmer-main"><section className="farmer-welcome-hero"><div className="welcome-copy"><span className="welcome-leaf-icon">☘</span><div><h1>Welcome, {displayName}!</h1><p>Let’s set up your profile to get started with AARTH.</p></div></div><div className="farmer-hero-image" style={{ backgroundImage: `url(${config.visualImage})` }}><div className="farmer-hero-overlay" /></div></section>
      <section className="role-dashboard-strip redesigned-id-strip">{[["▣", "AARTH ID", profile.aarth_id || "Not assigned", true], ["☘", "ROLE ID", profile.role_id || "Not assigned", true], ["●", "ACCOUNT TYPE", config.roleLabel], ["●", "ACCOUNT STATUS", profile.status || "ACTIVE"]].map(([icon, labelText, value, copy]) => <div className="id-card-item" key={labelText}><i className={`id-card-icon ${labelText === "ACCOUNT STATUS" ? "status-icon" : ""}`}>{icon}</i><span><small>{labelText}</small><strong>{value}</strong></span>{copy && <button type="button" aria-label={`Copy ${labelText}`} onClick={() => navigator.clipboard?.writeText(value)}>⧉</button>}</div>)}</section>
      {(completion.percentage === 100 || savedCompletion.percentage === 100) && <FarmerIdentityCard profile={profile} onScan={() => navigate("/farmer/scan")} />}
      <div className="portal-content redesigned-content"><section className="form-card redesigned-form-card"><div className="form-title redesigned-form-title"><div><h2>Complete your profile</h2><p className="form-description">Tell us about yourself and your farm so AARTH can connect you with relevant market opportunities.</p></div><span>FARMER</span></div><div className="stepper redesigned-stepper">{config.steps.map((step, index) => { const completed = isStepComplete(index); const incomplete = attemptedSteps.includes(index) && !completed; return <button type="button" key={step} className={[index === activeStep ? "current" : "", completed ? "completed" : "", incomplete ? "incomplete" : ""].filter(Boolean).join(" ")} onClick={() => goToStep(index)}><i>{completed ? "✓" : index + 1}</i><small>{step}</small></button>; })}</div><div className="details-box redesigned-details-box">{activeStep < 2 ? <><div className="section-heading-row"><div><h3><em>{activeStep === 0 ? "●" : "☘"}</em>{activeStep === 0 ? "Personal & Location" : "Farm Profile"}</h3><p>{activeStep === 0 ? "Who is this farmer? Add your basic contact and Maharashtra location details." : "A concise agricultural background for relevant AARTH participants."}</p></div><span className="maharashtra-badge"><b>MH</b>Maharashtra</span></div><div className="field-grid redesigned-field-grid">{fieldsForStep.map((item) => <div className={item.wide ? "wide" : ""} key={item.key}>{renderInput(item)}</div>)}</div>{activeStep === 0 && <div className="maharashtra-note"><span>⌖</span><div><strong>Location flow</strong>Select your district, then taluka, before searching for your village.</div></div>}<footer className="redesigned-form-footer"><button type="button" className="draft redesigned-secondary" disabled={saving} onClick={() => saveProfile(false)}>▣ Save as draft</button><span className="step-actions">{activeStep > 0 && <button type="button" className="back-button" onClick={() => setActiveStep(activeStep - 1)}>← Back</button>}<button type="button" className="continue redesigned-primary" disabled={saving} onClick={() => goToStep(activeStep === 1 ? 2 : 1)}>{saving ? "Saving..." : activeStep === 1 ? "Review profile →" : "Save & Continue →"}</button></span></footer></> : <div className="review-panel"><div className="review-profile-header"><span className="review-avatar">{displayName.slice(0, 2).toUpperCase()}</span><div><h3>{values.full_name || displayName}</h3><p>Farmer {location && `· ${location}`}</p></div></div><div className="review-grid"><div><small>PERSONAL & LOCATION</small><strong>{values.full_name || "—"}<br />{values.phone_number || "—"}<br />{location || "—"}</strong></div><div><small>FARM SIZE</small><strong>{values.land_size || "—"}</strong></div><div className="review-wide"><small>CROPS GROWN</small><div className="review-chip-list">{selectedCrops.length ? selectedCrops.map((key) => <span key={key}>{cropLookup.get(key)?.name || key}</span>) : <strong>—</strong>}</div></div><div><small>CULTIVATION</small><strong>{values.cultivation_type || "—"}</strong></div><div><small>FPO / COOPERATIVE</small><strong>{values.fpo_membership === "Yes" ? values.fpo_name || "Yes" : values.fpo_membership || "—"}</strong></div><div><small>STORAGE</small><strong>{values.storage_access === "Available" ? values.storage_type || "Available" : values.storage_access || "—"}</strong></div><div className="review-wide"><small>ABOUT THE FARM</small><strong>{values.about_farm || "No description added."}</strong></div></div><div className="review-actions"><button type="button" className="back-button" onClick={() => setActiveStep(1)}>← Back</button><button type="button" className="redesigned-secondary" onClick={() => setActiveStep(0)}>Edit</button><button type="button" className="redesigned-primary" disabled={saving} onClick={() => saveProfile(true)}>{saving ? "Publishing..." : "Publish Profile"}</button></div></div>}</div></section>
      <aside className="profile-aside redesigned-aside"><section className="readiness-card redesigned-readiness-card"><div className="aside-card-heading"><h3>Profile readiness</h3><span>{completion.percentage}%</span></div><div className="readiness-progress-track"><span style={{ width: `${completion.percentage}%` }} /></div><p><b>{completion.completed} of {completion.total} required fields completed</b><br />Complete your basic profile to unlock AARTH opportunities.</p></section><section className="tip-card redesigned-tip-card"><span className="tip-icon-box">💡</span><p>Your basic farm information helps AARTH understand your location and production context.</p></section><section className="role-visual redesigned-role-visual" style={{ backgroundImage: "url(/leaf.png)" }}><div className="visual-photo-overlay" /><div className="visual-copy redesigned-visual-copy"><span className="visual-main-line">Better market links<br />Better price choices</span><small>Without the right market link, a farmer may miss the best price.</small></div></section><section className="quick-card redesigned-quick-card profile-public-card"><span className="public-card-icon">☘</span><div><strong>Build your farmer profile</strong><p>Complete your basic details before creating lots and exploring market opportunities.</p></div></section></aside></div>{notice && <div className="save-notice redesigned-save-notice">✓ {notice}<button type="button" onClick={() => setNotice("")}>×</button></div>}</main></div>;
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

            {config.role === "FARMER" && (
              <section className="quick-card">
                <div className="quick-icon">⌂</div>
                <div>
                  <strong>FPO membership</strong>
                  {fpoMemberships.length ? (
                    fpoMemberships.map(({ fpo, membership }) => (
                      <p key={`${fpo.id}-${membership.id}`}>
                        {fpo.fpo_name}: {membership.status}
                      </p>
                    ))
                  ) : (
                    <p>FPO membership is optional. Join through an invitation when you are ready.</p>
                  )}
                </div>
              </section>
            )}

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
