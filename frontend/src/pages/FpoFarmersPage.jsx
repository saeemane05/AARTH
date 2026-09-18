import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fpoApi } from "../api/fpos";
import "./FpoFoundation.css";

export default function FpoFarmersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({ search: "", district: "", taluka: "", village: "", crop: "", status: "" });
  const [invite, setInvite] = useState(null);
  const [notice, setNotice] = useState("");

  const load = () => fpoApi.members(filters).then(setData).catch((error) => setNotice(error.message));

  useEffect(() => { load(); }, [filters.search, filters.district, filters.taluka, filters.village, filters.crop, filters.status]);

  useEffect(() => {
    if (!id) { setDetail(null); return; }
    fpoApi.farmerDetail(id).then(setDetail).catch((error) => setNotice(error.message));
  }, [id]);

  const generateInvite = async () => {
    try {
      const result = await fpoApi.invite();
      setInvite({ ...result, link: `${window.location.origin}/fpo/join/${encodeURIComponent(result.code)}` });
      setNotice("Invitation created. Share the secure link or code with the Farmer.");
    } catch (error) { setNotice(error.message); }
  };

  const decide = async (membershipId, action) => {
    try { await fpoApi.decideMembership(membershipId, action); await load(); if (id) navigate("/fpo/farmers"); }
    catch (error) { setNotice(error.message); }
  };

  if (id && detail) return <Detail detail={detail} onBack={() => navigate("/fpo/farmers")} />;
  if (!data) return <div className="fpo-empty">Loading farmer network...</div>;

  return (
    <div className="fpo-network-page">
      <section className="fpo-hero">
        <div><span>Farmer network</span><h1>Farmers and membership requests</h1><p>Operational information is resolved from each existing Farmer profile.</p></div>
        <button className="fpo-button" onClick={generateInvite}>Invite farmer</button>
      </section>
      {notice && <div className="fpo-alert">{notice}</div>}
      {invite && <section className="fpo-panel fpo-invite"><h2>Secure invitation</h2><p><b>Code:</b> {invite.code}</p><p><b>Link:</b> <a href={invite.link}>{invite.link}</a></p><button className="fpo-button secondary" onClick={() => navigator.clipboard?.writeText(invite.link)}>Copy invite link</button><small>This invitation contains no password, token, or private Farmer data.</small></section>}
      <div className="fpo-stats">{[["Total farmers", data.summary.total], ["Active farmers", data.summary.active], ["Pending requests", data.summary.pending], ["Inactive / suspended", data.summary.inactive]].map(([label, value]) => <Info key={label} label={label} value={value} />)}</div>
      <section className="fpo-panel fpo-filter-panel">
        <input placeholder="Search name or AARTH ID" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <input placeholder="District" value={filters.district} onChange={(event) => setFilters({ ...filters, district: event.target.value })} />
        <input placeholder="Taluka" value={filters.taluka} onChange={(event) => setFilters({ ...filters, taluka: event.target.value })} />
        <input placeholder="Village" value={filters.village} onChange={(event) => setFilters({ ...filters, village: event.target.value })} />
        <input placeholder="Crop" value={filters.crop} onChange={(event) => setFilters({ ...filters, crop: event.target.value })} />
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="ACTIVE">Active</option><option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option></select>
      </section>
      {data.items.length ? <section className="fpo-table">{data.items.map((member) => <div className="fpo-member" key={member.membership_id}><div><strong>{member.full_name}</strong><small>{member.aarth_id}</small></div><div><span>{member.village || member.taluka || member.district || "Location not provided"}</span><small>{member.crops?.join(" · ") || "Crops not provided"}</small></div><strong>{member.status}</strong><div className="fpo-card-actions"><Link className="fpo-button secondary" to={`/fpo/farmers/${member.membership_id}`}>View</Link>{member.status === "PENDING" && <><button className="fpo-button" onClick={() => decide(member.membership_id, "approve")}>Approve</button><button className="fpo-button secondary" onClick={() => decide(member.membership_id, "reject")}>Reject</button></>}</div></div>)}</section> : <div className="fpo-empty"><h3>No farmers match these filters</h3><p>Use Invite farmer to connect an existing AARTH Farmer account.</p></div>}
    </div>
  );
}

function Detail({ detail, onBack }) {
  return <section className="fpo-panel"><button className="fpo-button secondary" onClick={onBack}>Back to farmers</button><h1>{detail.full_name}</h1><div className="fpo-info-grid"><Info label="AARTH ID" value={detail.aarth_id} /><Info label="District" value={detail.district || "Not provided"} /><Info label="Taluka" value={detail.taluka || "Not provided"} /><Info label="Village" value={detail.village || "Not provided"} /><Info label="Farm size" value={detail.land_size || "Not provided"} /><Info label="Crops" value={detail.crops?.join(" · ") || "Not provided"} /><Info label="Membership" value={detail.status} /><Info label="Joined" value={detail.approved_at ? new Date(detail.approved_at).toLocaleDateString() : "Pending"} /></div></section>;
}

function Info({ label, value }) { return <div className="fpo-info"><small>{label}</small><strong>{value}</strong></div>; }
