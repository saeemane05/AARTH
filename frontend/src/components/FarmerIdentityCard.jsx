import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { identityApi } from "../api/identity";
import logo from "../assets/aarth-logo.png";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function FarmerIdentityCard({ profile, onScan }) {
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState("");
  const cardRef = useRef(null);
  const data = profile.profile_data || {};
  const name = data.full_name || profile.username || "AARTH Farmer";
  const farmerId = profile.role_id || "Not assigned";
  const location = data.district || "Maharashtra";

  useEffect(() => {
    let active = true;
    identityApi.credential().then((value) => active && setCredential(value)).catch((reason) => active && setError(reason.message));
    return () => { active = false; };
  }, [farmerId]);

  const share = async () => {
    const text = `AARTH Farmer Card\n${name}\nFARMER\n${farmerId}\n${location}`;
    if (navigator.share) await navigator.share({ title: "AARTH Farmer Card", text });
    else await navigator.clipboard?.writeText(`${name} | ${farmerId}`);
  };

  const download = () => {
    const canvas = cardRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${farmerId}-aarth-card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return <section className="farmer-identity-section" aria-label="AARTH Farmer Card">
    <div className="farmer-identity-heading"><div><span>YOUR DIGITAL IDENTITY</span><h2>AARTH Farmer Card</h2></div><button type="button" className="identity-scan-link" onClick={onScan}>Open AARTH Scan</button></div>
    <div className="farmer-card-actions" ref={cardRef}>
      <article className="farmer-identity-card">
        <div className="farmer-card-top"><img src={logo} alt="AARTH" /><span>Connecting Farmers to Better Markets</span></div>
        <div className="farmer-card-leaf">☘</div>
        <div className="farmer-card-avatar">{data.profile_photo ? <img src={data.profile_photo} alt="" /> : initials(name)}</div>
        <h3>{name}</h3><strong className="farmer-card-role">FARMER</strong>
        <div className="farmer-card-location"><span>⌖</span>{location}<i /> <span>☘</span> AARTH Network</div>
        <div className="farmer-card-qr">{credential ? <QRCodeCanvas value={JSON.stringify(credential)} size={142} level="M" includeMargin /> : <span>{error ? "QR unavailable" : "Preparing secure QR..."}</span>}</div>
        <span className="farmer-card-id-label">AARTH FARMER ID</span><b className="farmer-card-id">{farmerId}</b>
        <small className="farmer-card-tagline">PROUD TO FEED A BETTER TOMORROW</small>
      </article>
      <div className="farmer-card-button-row"><button type="button" onClick={onScan}>Show QR</button><button type="button" onClick={share}>Share Card</button><button type="button" onClick={download}>Download Card</button></div>
    </div>
    {error && <p className="farmer-card-error">{error}</p>}
  </section>;
}