import { useEffect, useState } from "react";
import { fpoApi } from "../api/fpos";
import "./FpoFoundation.css";

export default function FpoOrganisationPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState("");

  const load = () => fpoApi.organisation().then((value) => { setData(value); setForm({ organisation_type: value.organisation_type || "", district: value.district || "", taluka: value.taluka || "", village: value.village || "", address: value.address || "", crops: (value.crops || []).join(", ") }); }).catch((error) => setNotice(error.message));
  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    try { await fpoApi.updateOrganisation({ ...form, crops: form.crops.split(",").map((item) => item.trim()).filter(Boolean) }); setNotice("Organisation profile saved."); load(); }
    catch (error) { setNotice(error.message); }
  };

  if (!data || !form) return <div className="fpo-empty">Loading organisation...</div>;
  const completion = data.profile_completion || { percentage: 0, missing: [] };

  return (
    <div className="fpo-settings-page">
      <section className="fpo-hero"><div><span>Organisation profile</span><h1>{data.fpo_name}</h1><p>Source data stays distinct from editable AARTH organisation information.</p></div><strong>{completion.percentage}% complete</strong></section>
      {notice && <div className="fpo-alert">{notice}</div>}
      <section className="fpo-panel"><h2>Read-only source data</h2><div className="fpo-info-grid"><Info label="Source" value={data.source || "Not provided"} /><Info label="Source record ID" value={data.source_record_id || "Not provided"} /><Info label="Last source update" value={data.source_last_updated ? new Date(data.source_last_updated).toLocaleDateString() : "Not provided"} /><Info label="Registration number" value={data.registration_number || "Not provided"} /><Info label="State" value={data.state || "Maharashtra"} /><Info label="Primary administrator" value={data.primary_admin_user_id || "Not assigned"} /></div></section>
      <form className="fpo-form fpo-panel" onSubmit={save}><h2>Editable AARTH organisation data</h2>{[["organisation_type", "Organisation type"], ["district", "District"], ["taluka", "Taluka"], ["village", "Village"], ["address", "Address"], ["crops", "Associated crops (comma-separated)"]].map(([key, label]) => <label key={key}>{label}<input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}<button className="fpo-button">Save organisation</button></form>
      <section className="fpo-panel"><h2>Profile completeness</h2>{completion.missing.length ? <p>Missing: {completion.missing.join(", ")}</p> : <p>All tracked organisation fields are complete.</p>}</section>
    </div>
  );
}

function Info({ label, value }) { return <div className="fpo-info"><small>{label}</small><strong>{value}</strong></div>; }
