import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fpoApi } from "../api/fpos";
import "./FpoFoundation.css";

export default function FpoSettings() {
  const [organisation, setOrganisation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fpoApi.organisation().then(setOrganisation).catch((error) => setError(error.message));
  }, []);

  if (error) return <div className="fpo-alert">{error}</div>;
  if (!organisation) return <div className="fpo-empty">Loading settings...</div>;

  return (
    <div className="fpo-settings-page">
      <section className="fpo-hero">
        <div><span>FPO settings</span><h1>Organisation settings</h1><p>Account and access information for this AARTH organisation.</p></div>
      </section>
      <section className="fpo-info-grid">
        <Info label="Organisation" value={organisation.fpo_name} />
        <Info label="Account role" value="FPO organisation" />
        <Info label="Activation status" value={organisation.activation_status || "Not provided"} />
        <Info label="Verification status" value={organisation.verification_status || "Not provided"} />
      </section>
      <section className="fpo-panel">
        <h2>Organisation preferences</h2>
        <p>Organisation profile fields are managed from the organisation workspace.</p>
        <Link className="fpo-button" to="/fpo/organisation">Open organisation profile</Link>
      </section>
      <section className="fpo-panel">
        <h2>Staff access</h2>
        <p>Review roles and deactivate access from the staff workspace.</p>
        <Link className="fpo-button secondary" to="/fpo/staff">Manage staff</Link>
      </section>
      <section className="fpo-panel">
        <h2>Notifications</h2>
        <p>Notification preferences are coming soon. No notification service is enabled yet.</p>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="fpo-info"><small>{label}</small><strong>{value}</strong></div>;
}
