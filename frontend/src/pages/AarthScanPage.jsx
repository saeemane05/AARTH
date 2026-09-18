import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { verifyAsync } from "@noble/ed25519";
import { identityApi } from "../api/identity";
import { useNavigate } from "react-router-dom";

function parseCredential(raw) {
  try { const value = JSON.parse(raw); return value?.type === "AARTH_FARMER" ? value : null; } catch { return null; }
}

function bytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===";
  const decoded = atob(padded.slice(0, padded.length - (padded.length % 4)));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function verifyCredential(credential) {
  const publicKey = credential.public_key || import.meta.env.VITE_AARTH_FARMER_PUBLIC_KEY;
  if (!publicKey) return false;
  const { signature, ...payload } = credential;
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return verifyAsync(bytes(signature), new TextEncoder().encode(canonical), bytes(publicKey));
}

export default function AarthScanPage() {
  const navigate = useNavigate();
  const scanner = useRef(null);
  const [farmerId, setFarmerId] = useState("");
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => () => { scanner.current?.stop().catch(() => {}); }, []);

  useEffect(() => {
    const sync = () => {
      const records = JSON.parse(localStorage.getItem("aarth_pending_onboarding") || "[]");
      records.forEach((record) => identityApi.syncOnboarding(record).then(() => {
        const remaining = JSON.parse(localStorage.getItem("aarth_pending_onboarding") || "[]").filter((item) => item.local_id !== record.local_id);
        localStorage.setItem("aarth_pending_onboarding", JSON.stringify(remaining));
      }).catch(() => {}));
    };
    window.addEventListener("online", sync);
    sync();
    return () => window.removeEventListener("online", sync);
  }, []);

  const identify = async (value) => {
    const credential = parseCredential(value);
    if (!credential) { setNotice("Unable to verify AARTH credential."); return; }
    try {
      const credentialVerified = await verifyCredential(credential);
      if (!credentialVerified) { setNotice("Unable to verify AARTH credential. Configure the operator public key or use the manual fallback."); return; }
      const farmer = await identityApi.lookupFarmer(credential.farmer_id);
      setResult({ ...farmer, credentialVerified, status: "PENDING_SYNC" });
      setNotice("AARTH credential verified. Real-world identity still requires operator verification.");
    }
    catch (error) { setNotice(error.message); }
  };

  const startScan = async () => {
    setNotice(""); setScanning(true);
    const next = new Html5Qrcode("aarth-scan-reader"); scanner.current = next;
    try { await next.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, identify, () => {}); }
    catch (error) { setNotice(error.message || "Camera access was unavailable. Enter the Farmer ID manually."); setScanning(false); }
  };

  const search = async () => {
    if (!farmerId.trim()) return;
    try { const farmer = await identityApi.lookupFarmer(farmerId); setResult({ ...farmer, credentialVerified: false, status: "PENDING_SYNC" }); setNotice("Farmer identified. Real-world identity verification remains with the authorized operator."); }
    catch (error) { setNotice(error.message); }
  };

  const continueOnboarding = () => {
    const record = { local_id: crypto.randomUUID(), farmer_id: result.farmer_id, onboarding_data: {}, status: "PENDING_SYNC" };
    const records = JSON.parse(localStorage.getItem("aarth_pending_onboarding") || "[]");
    localStorage.setItem("aarth_pending_onboarding", JSON.stringify([...records, record]));
    setNotice("Assisted onboarding saved as PENDING_SYNC. It will sync when internet returns.");
    if (navigator.onLine) identityApi.syncOnboarding(record).then(() => setNotice("Assisted onboarding is SYNCED with AARTH.")).catch(() => {});
  };

  return <main className="aarth-scan-page"><button className="scan-back" type="button" onClick={() => navigate(-1)}>← Back</button><section className="aarth-scan-panel"><span className="scan-kicker">AARTH SCAN</span><h1>Identify a Farmer</h1><p>Scan a signed AARTH Farmer Card or enter the Farmer ID.</p><div id="aarth-scan-reader" /><button type="button" className="scan-primary" onClick={startScan} disabled={scanning}>{scanning ? "Camera active" : "Scan AARTH QR"}</button><div className="scan-divider">OR</div><div className="manual-scan"><input value={farmerId} onChange={(event) => setFarmerId(event.target.value)} placeholder="FRM-MH-00000" /><button type="button" onClick={search}>Search</button></div>{result && <div className="scan-result"><span>{result.credentialVerified ? "AARTH credential verified" : "Farmer identified"}</span><strong>{result.full_name}</strong><b>{result.farmer_id}</b><small>{result.status}: operator verification still required</small><div><button type="button" onClick={continueOnboarding}>Continue Onboarding</button><button type="button" onClick={() => setNotice("View Profile is available after operator verification.")}>View Profile</button></div></div>}{notice && <p className="scan-notice">{notice}</p>}</section></main>;
}