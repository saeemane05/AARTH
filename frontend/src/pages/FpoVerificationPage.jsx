import { useEffect, useState } from "react";
import { fpoApi } from "../api/fpos";
import "./FpoFoundation.css";

export default function FpoVerificationPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { fpoApi.dashboard().then(setData).catch((value) => setError(value.message)); }, []);
  if (error) return <div className="fpo-alert">{error}</div>;
  if (!data) return <div className="fpo-empty">Loading verification...</div>;
  const verification = data.verification || {};
  const checks = [
    ["Government/public record matched", verification.government_record_matched, "Not available"],
    ["Organisation details verified", verification.organisation_details_verified, "Not verified"],
    ["Representative verified", verification.representative_verified, "Not verified"],
    ["e-NAM registration", verification.enam_registered, "Not provided"],
    ["GST", verification.gst_verified, "Not provided"],
    ["AARTH verification", data.verification_status === "AARTH_VERIFIED", "Not verified"],
    ["AARTH transaction activity", verification.transaction_activity, "Not available"],
  ];
  return <section className="fpo-panel"><h1>Verification details</h1><p>Each state is shown separately. No government certification is implied by AARTH status.</p>{checks.map(([label, value, missing]) => <p className="fpo-checkline" key={label}><b className={value ? "yes" : "no"}>{value ? "✓" : "—"}</b>{label}<span>{value ? "Verified" : missing}</span></p>)}<p>Source: {data.source || "Not provided"}. Last source update: {data.source_last_updated ? new Date(data.source_last_updated).toLocaleDateString() : "Not provided"}.</p></section>;
}
