import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, buyerRequirementApi } from "../api/auth";
import { matchingEngineApi } from "../api/matchingEngine";
import logo from "../assets/aarth-logo.png";
import "./MarketplaceDiscovery.css";

const unit = { kg: "kg", quintal: "quintal", ton: "MT" };
const quantity = (item) => item?.quantity ? `${Number(item.quantity).toLocaleString("en-IN")} ${unit[item.quantity_unit] || item.quantity_unit}` : "—";
const date = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`)) : "—";
const timeAgo = (value) => { if (!value) return "Just now"; const ms = Math.max(0, Date.now() - new Date(value).getTime()); const minutes = Math.floor(ms / 60000); if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; };
const money = (value) => value == null ? "—" : `₹${Number(value).toLocaleString("en-IN")}`;

function MarketStatus({ value }) { const open = value === "OPEN"; return <span className={`market-pill ${open ? "open" : "closed"}`}><i />{open ? "OPEN" : "CLOSED"}</span>; }

export default function BuyerDiscoverLotsPage() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [selectedRequirement, setSelectedRequirement] = useState("");
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    try {
      const [me, reqResult] = await Promise.all([authApi.me(), buyerRequirementApi.list()]);
      const active = (reqResult.requirements || []).filter((x) => x.status === "ACTIVE");
      setProfile(me); setRequirements(active);
      const requirementId = selectedRequirement || active[0]?.requirement_id || "";
      if (requirementId && !selectedRequirement) setSelectedRequirement(requirementId);
      if (requirementId) {
        const result = await matchingEngineApi.buyerLots({ requirementId, limit: 80 });
        setItems(result.items || []);
      } else setItems([]);
      setLastSync(new Date()); setError("");
    } catch (reason) { setError(reason.message || "Unable to load live farmer lots."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); const timer = setInterval(load, 8000); const onFocus = () => load(); window.addEventListener("focus", onFocus); return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); }; }, [selectedRequirement]);

  const filtered = useMemo(() => items.filter((item) => {
    const q = filter.trim().toLowerCase();
    return !q || `${item.lot?.commodity_name || ""} ${item.seller?.name || ""} ${item.lot?.pickup_district || ""} ${item.lot?.variety || ""}`.toLowerCase().includes(q);
  }), [items, filter]);

  return <div className="market-shell buyer-market">
    <header className="market-nav"><button className="market-brand" onClick={() => navigate("/buyer")}><img src={logo} alt="AARTH" /><span>AARTH</span></button><nav><button onClick={() => navigate("/buyer")}>Home</button><button onClick={() => navigate("/buyer/requirements")}>My Requirements</button><button className="active">Discover Lots</button><button onClick={() => navigate("/buyer")}>Orders</button><button onClick={() => navigate("/buyer")}>Market Insights</button></nav><div className="market-nav-right"><span className="live-dot" /> Live lots <button onClick={() => { authApi.logout(); navigate("/login"); }}>Log out</button></div></header>
    <main className="market-main">
      <section className="market-hero"><div><span className="market-kicker">AARTH · LIVE LOT MARKETPLACE</span><h1>Discover farmer lots matched to your demand</h1><p>Choose an active requirement and AARTH ranks currently available lots using commodity, quality, quantity, delivery window, price, distance, seller signals and evidence.</p><div className="market-hero-meta"><span>⚡ Constraint checked</span><span>📦 Direct + aggregation</span><span>🔄 8s refresh</span></div></div><div className="market-hero-stat"><strong>{filtered.length}</strong><span>live suitable lots</span><small>{lastSync ? `Synced ${lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Syncing…"}</small></div></section>
      <div className="market-toolbar"><div><b>Discover Lots</b><span>Best suitable lot first</span></div><div className="market-toolbar-controls"><select value={selectedRequirement} onChange={(e) => setSelectedRequirement(e.target.value)}><option value="">Select requirement</option>{requirements.map((r) => <option key={r.requirement_id} value={r.requirement_id}>{r.commodity_name} · {r.requirement_id}</option>)}</select><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search farmer, crop or district…" /></div></div>
      {error && <div className="market-alert">{error}</div>}
      {!requirements.length && !loading ? <div className="market-empty"><div>📋</div><h2>Publish an active requirement first</h2><p>Once a requirement is OPEN, AARTH can continuously discover and rank farmer lots against it.</p><button className="market-primary" onClick={() => navigate("/buyer/requirements")}>Create requirement</button></div> : loading ? <div className="market-grid">{[1,2,3,4].map((x) => <div className="market-skeleton" key={x} />)}</div> : !filtered.length ? <div className="market-empty"><div>🌾</div><h2>No suitable open lots at this moment</h2><p>New farmer lots are picked up automatically on the next live refresh.</p></div> : <div className="market-grid">{filtered.map((item, index) => { const lot = item.lot; return <article className="market-card" key={item.lot_id}><header className="market-card-top"><div><span className="rank-badge">#{index + 1} AARTH MATCH</span><h2>{lot.commodity_name}</h2><p>{lot.variety || "Any variety"} · {lot.pickup_district}{lot.pickup_taluka ? ` · ${lot.pickup_taluka}` : ""} · Posted {timeAgo(lot.created_at)}</p></div><MarketStatus value={lot.market_status} /></header><div className="match-score"><div><span>Suitability</span><strong>{item.score_percent}%</strong></div><div className="score-track"><i style={{ width: `${item.score_percent}%` }} /></div><small>{item.match_type === "DIRECT" ? "Can supply the requirement directly" : "Candidate for multi-lot aggregation"}</small></div><div className="market-facts"><div><span>Lot quantity</span><b>{quantity(lot)}</b></div><div><span>Expected price</span><b>{money(lot.expected_price)} / quintal</b></div><div><span>Quality</span><b>{lot.grade || "Declared on review"}{lot.size_calibre ? ` · ${lot.size_calibre}` : ""}</b></div><div><span>Farmer</span><b>{item.seller?.name || "Farmer"}</b></div></div><div className="seller-strip"><span>📍 {lot.pickup_district}{lot.pickup_village ? ` · ${lot.pickup_village}` : ""}</span><span>🛡 {lot.evidence_status === "SUBMITTED" ? "Evidence submitted" : "Evidence pending"}</span></div><div className="match-reasons">{item.explanations?.slice(0, 3).map((x) => <span key={x.label}>✓ {x.label}: {x.value}</span>)}</div><footer><button className="market-primary" onClick={() => setSelected(item)}>View more</button><span>{item.distance_km != null ? `${item.distance_km} km approx.` : "Distance pending"}</span></footer></article>; })}</div>}
    </main>
    {selected && <div className="market-modal-backdrop" onClick={() => setSelected(null)}><div className="market-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><span className="market-kicker">LOT DETAILS · {selected.lot_id}</span><h2>{selected.lot?.commodity_name} · {selected.lot?.variety || "Any variety"}</h2><div className="modal-match"><strong>{selected.score_percent}%</strong><span>match suitability</span><MarketStatus value={selected.lot?.market_status} /></div><div className="modal-grid">{Object.entries(selected.factors || {}).map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><b>{Math.round(value * 100)}%</b></div>)}</div><h3>Farmer & lot</h3><div className="modal-note"><b>{selected.seller?.name || "Farmer"}</b> · {selected.seller?.district || selected.lot?.pickup_district}<br />Lot: {quantity(selected.lot)} · ₹{Number(selected.lot?.expected_price || 0).toLocaleString("en-IN")} / quintal<br />Availability: {date(selected.lot?.available_from)} – {date(selected.lot?.pickup_until)}</div><h3>Why AARTH matched this</h3><ul>{selected.explanations?.map((x) => <li key={`${x.label}-${x.value}`}><b>{x.label}:</b> {x.value}</li>)}</ul><div className="modal-note">AARTH does not expose the farmer's exact GPS/contact details at discovery stage. Those are shared only when the transaction workflow authorizes it.</div></div></div>}
  </div>;
}
