import { useEffect, useState } from "react";
import { fpoApi } from "../api/fpos";
import "./FpoFoundation.css";

const roles = ["FPO_ADMIN", "OPERATIONS_MANAGER", "FIELD_COORDINATOR", "FINANCE"];

export default function FpoStaffPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ user_id: "", role: "FIELD_COORDINATOR" });
  const [notice, setNotice] = useState("");

  const load = () => fpoApi.staff().then(setData).catch((error) => setNotice(error.message));
  useEffect(() => { load(); }, []);

  const add = async (event) => {
    event.preventDefault();
    try { await fpoApi.addStaff(form); setForm({ user_id: "", role: "FIELD_COORDINATOR" }); setNotice("Staff access added."); load(); }
    catch (error) { setNotice(error.message); }
  };

  const updateRole = async (userId, role) => {
    try { await fpoApi.changeStaffRole(userId, role); setNotice("Staff role updated."); load(); }
    catch (error) { setNotice(error.message); }
  };

  const updateStatus = async (userId, status) => {
    try { await fpoApi.changeStaffStatus(userId, status); setNotice("Staff access updated."); load(); }
    catch (error) { setNotice(error.message); }
  };

  if (!data) return <div className="fpo-empty">Loading staff access...</div>;

  return (
    <div className="fpo-settings-page">
      <section className="fpo-hero"><div><span>Staff management</span><h1>Organisation access</h1><p>Staff permissions apply only to this FPO and are enforced by the backend.</p></div></section>
      {notice && <div className="fpo-alert">{notice}</div>}
      <section className="fpo-panel fpo-table">
        {data.items.length ? data.items.map((person) => <div className="fpo-member" key={person.user_id}><div><strong>{person.user_id}</strong><small>Added {person.added_at ? new Date(person.added_at).toLocaleDateString() : "Not provided"}</small></div><select value={person.role} onChange={(event) => updateRole(person.user_id, event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select><strong>{person.status}</strong><button className="fpo-button secondary" onClick={() => updateStatus(person.user_id, person.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>{person.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</button></div>) : <div className="fpo-empty">No additional staff access has been added.</div>}
      </section>
      <form className="fpo-form fpo-panel" onSubmit={add}><h2>Add staff member</h2><label>AARTH user ID<input required value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} /></label><label>Organisation role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label><button className="fpo-button">Add staff access</button></form>
    </div>
  );
}
