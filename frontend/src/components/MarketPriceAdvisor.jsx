import { useEffect, useMemo, useState } from "react";
import { matchingEngineApi } from "../api/matchingEngine";
import "./MarketPriceAdvisor.css";

const unitFactor = { INR_PER_KG: 1, INR_PER_QUINTAL: 100, INR_PER_TON: 1000 };
const convert = (value, from, to) => value == null ? null : Number(value) * (unitFactor[to] / unitFactor[from]);

export default function MarketPriceAdvisor({ cropKey, latitude, longitude, selectedUnit, onUseRange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cropKey) { setData(null); setError(""); return; }
    let active = true;
    setLoading(true); setError("");
    const timer = setTimeout(() => {
      matchingEngineApi.marketPrices({ cropKey, latitude, longitude, topN: 8 })
        .then((result) => active && setData(result))
        .catch((reason) => active && setError(reason.message || "Live APMC price data is unavailable."))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [cropKey, latitude, longitude]);

  const converted = useMemo(() => {
    if (!data?.summary) return null;
    return {
      min: convert(data.summary.min_price_per_quintal, "INR_PER_QUINTAL", selectedUnit),
      max: convert(data.summary.max_price_per_quintal, "INR_PER_QUINTAL", selectedUnit),
      modal: convert(data.summary.representative_modal_per_quintal, "INR_PER_QUINTAL", selectedUnit),
    };
  }, [data, selectedUnit]);

  if (!cropKey) return <aside className="price-advisor muted"><span>LIVE APMC PRICE CHECK</span><strong>Select a crop to compare current market prices.</strong></aside>;
  return <aside className="price-advisor">
    <div className="price-advisor-head"><div><span>LIVE APMC PRICE CHECK</span><h3>{data?.crop_name || "Selected crop"}</h3></div><b className="price-live">● LIVE</b></div>
    {loading && <div className="price-loading">Checking nearby Maharashtra APMCs…</div>}
    {error && !loading && <div className="price-error">{error}<small>You can still enter your own buying range.</small></div>}
    {converted && !loading && <>
      <div className="price-range"><div><span>Observed range</span><b>₹{converted.min.toLocaleString("en-IN")} – ₹{converted.max.toLocaleString("en-IN")}</b><small>per {selectedUnit === "INR_PER_KG" ? "kg" : selectedUnit === "INR_PER_TON" ? "MT" : "quintal"}</small></div><div><span>Representative modal</span><b>₹{converted.modal.toLocaleString("en-IN")}</b></div></div>
      <div className="price-apmc-list">{data.apmcs.slice(0, 5).map((x) => <div key={`${x.apmc_code}-${x.apmc_name}`}><span>{x.apmc_name}{x.distance_km != null ? ` · ${x.distance_km} km` : ""}</span><b>₹{convert(x.modal_price, "INR_PER_QUINTAL", selectedUnit).toLocaleString("en-IN")}</b></div>)}</div>
      <button className="price-use" type="button" onClick={() => onUseRange?.({ min: converted.min, max: converted.max, modal: converted.modal })}>Use this APMC range</button>
      <small className="price-source">Source: MSAMB APMC price information · values may reflect the latest reported market day, not necessarily today's arrival.</small>
    </>}
  </aside>;
}
