
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { matchingEngineApi } from "../api/matchingEngine";
import logo from "../assets/aarth-logo.png";
import "./MarketplaceDiscovery.css";

const unit = { kg: "kg", quintal: "quintal", ton: "MT" };
const money = (value) => (value == null ? "—" : `₹${Number(value).toLocaleString("en-IN")}`);
const quantity = (item) => item?.quantity ? `${Number(item.quantity).toLocaleString("en-IN")} ${unit[item.quantity_unit] || item.quantity_unit}` : "—";
const date = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "—";
const timeAgo = (value) => { if (!value) return "Just now"; const ms = Math.max(0, Date.now() - new Date(value).getTime()); const minutes = Math.floor(ms / 60000); if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); return `${days}d ago`; };

function MarketStatus({ value }) {
  const open = value === "OPEN";
  return <span className={`market-pill ${open ? "open" : "closed"}`}><i />{open ? "OPEN" : "CLOSED"}</span>;
}

export default function FarmerBuyerRequirementsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    try {
      const [me, result] = await Promise.all([authApi.me(), matchingEngineApi.farmerRequirements(80)]);
      setProfile(me);
      setItems(result.items || []);
      setLastSync(new Date());
      setError("");
    } catch (reason) {
      setError(reason.message || "Unable to load live buyer requirements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const q = filter.trim().toLowerCase();
    return !q || `${item.requirement?.commodity_name || ""} ${item.buyer?.business_name || ""} ${item.requirement?.delivery_district || ""}`.toLowerCase().includes(q);
  }), [items, filter]);

  const farmerName = profile.profile_data?.full_name || "Farmer";

  return (
    <div className="market-shell farmer-market">
      <header className="market-nav">
        <button className="market-brand" onClick={() => navigate("/farmer")}><img src={logo} alt="AARTH" /><span>AARTH</span></button>
        <nav>
          <button onClick={() => navigate("/farmer")}>Home</button>
          <button onClick={() => navigate("/farmer/lots")}>My Lots</button>
          <button className="active">Buyers</button>
          <button onClick={() => navigate("/farmer")}>Market Insights</button>
          <button onClick={() => navigate("/farmer")}>Support</button>
        </nav>
        <div className="market-nav-right"><span className="live-dot" /> Live marketplace <button onClick={() => authApi.logout() || navigate("/login")}>Log out</button></div>
      </header>

      <main className="market-main">
        <section className="market-hero">
          <div>
            <span className="market-kicker">AARTH · BUYER MARKETPLACE</span>
            <h1>Buyer requirements made for {farmerName}</h1>
            <p>See active sourcing needs and let AARTH rank the requirements that fit your active lots. Prices, quality, quantity, delivery and location are checked before a match is shown.</p>
            <div className="market-hero-meta"><span>⚡ Auto-ranked</span><span>🔄 Live refresh</span><span>📍 Maharashtra-first</span></div>
          </div>
          <div className="market-hero-stat"><strong>{filtered.length}</strong><span>matched requirements</span><small>{lastSync ? `Synced ${lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Syncing…"}</small></div>
        </section>

        <div className="market-toolbar">
          <div><b>Buyer requirements</b><span>Ranked by your most suitable active lot</span></div>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search crop, buyer or district…" />
        </div>

        {error && <div className="market-alert">{error}</div>}
        {loading ? <div className="market-grid">{[1,2,3,4].map((x) => <div className="market-skeleton" key={x} />)}</div> : !filtered.length ? <div className="market-empty"><div>🌾</div><h2>No suitable open requirements right now</h2><p>Create or publish an active lot, then AARTH will continuously re-check buyer requirements.</p></div> : (
          <div className="market-grid">
            {filtered.map((item, index) => {
              const req = item.requirement;
              return <article className="market-card" key={item.requirement_id}>
                <header className="market-card-top"><div><span className="rank-badge">#{index + 1} AARTH MATCH</span><h2>{req.commodity_name}</h2><p>{req.variety || "Any variety"} · {req.delivery_district || req.delivery_city || "Maharashtra"} · Posted {timeAgo(req.created_at)}</p></div><MarketStatus value={req.market_status} /></header>
                <div className="match-score"><div><span>Suitability</span><strong>{item.score_percent}%</strong></div><div className="score-track"><i style={{ width: `${item.score_percent}%` }} /></div><small>{item.match_status === "FEASIBLE" ? "Your lot can cover the requirement" : "Suitable as part of an aggregation"}</small></div>
                <div className="market-facts">
                  <div><span>Requirement</span><b>{quantity(req)}</b></div>
                  <div><span>Buying range</span><b>{req.price_mode === "MARKET_LINKED" ? "Market linked" : req.target_price_min != null ? `${money(req.target_price_min)}–${money(req.target_price_max ?? req.target_price_min)} / ${req.target_price_unit?.replace("INR_PER_", "")}` : req.target_price ? `${money(req.target_price)} / ${req.target_price_unit?.replace("INR_PER_", "")}` : "Negotiable"}</b></div>
                  <div><span>Delivery</span><b>{date(req.delivery_start_date)} – {date(req.delivery_end_date)}</b></div>
                  <div><span>Buyer</span><b>{item.buyer?.business_name || "Verified buyer"}</b></div>
                </div>
                <div className="match-reasons">{item.explanations?.slice(0, 3).map((x) => <span key={x.label}>✓ {x.label}: {x.value}</span>)}</div>
                <footer><button className="market-primary" onClick={() => setSelected(item)}>View more</button><span>Match engine {item.engine_version || "MATCH_V1"}</span></footer>
              </article>;
            })}
          </div>
        )}
      </main>
      {selected && <div className="market-modal-backdrop" onClick={() => setSelected(null)}><div className="market-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setSelected(null)}>×</button>
        <span className="market-kicker">MATCH EXPLANATION</span><h2>{selected.requirement?.commodity_name} · {selected.requirement?.requirement_id}</h2>
        <div className="modal-match"><strong>{selected.score_percent}%</strong><span>match suitability</span><MarketStatus value={selected.requirement?.market_status} /></div>
        <div className="modal-grid">{Object.entries(selected.factors || {}).map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><b>{Math.round(value * 100)}%</b></div>)}</div>
        <h3>Why AARTH matched this</h3><ul>{selected.explanations?.map((x) => <li key={`${x.label}-${x.value}`}><b>{x.label}:</b> {x.value}</li>)}</ul>
        <div className="modal-note">Buyer: <b>{selected.buyer?.business_name || "Verified buyer"}</b> · {selected.buyer?.buyer_type || "Buyer"}<br />Delivery: {selected.requirement?.delivery_location || selected.requirement?.delivery_district || "—"}</div>
      </div></div>}
    </div>
  );
}
