import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authApi, locationApi, lotApi } from "../api/auth";
import { FARMER_CROP_CATEGORIES } from "../data/farmerCropMaster";
import { hasVarietyChoices, varietiesForCrop } from "../data/cropVarieties";
import {
  MAHARASHTRA_DISTRICTS,
  getTalukasForDistrict,
} from "../data/maharashtraLocations";
import logo from "../assets/aarth-logo.png";
import LotEvidenceCapture from "../components/LotEvidenceCapture";
import "./FarmerLotPage.css";
import "./BuyerEnhancements.css";
import { demoLots, demoTransactions, tracking } from "../data/prototypeData";

const crops = Object.values(FARMER_CROP_CATEGORIES).flat();
const initial = {
  commodity_key: "",
  commodity_name: "",
  variety: "",
  quantity: "",
  quantity_unit: "quintal",
  partial_sale_allowed: false,
  minimum_sale_quantity: "",
  harvest_duration_min_days: "",
  harvest_duration_max_days: "",
  grade: "",
  size_calibre: "",
  quality_measurements: {},
  pickup_district: "",
  pickup_taluka: "",
  pickup_village: "",
  pickup_location_text: "",
  pickup_latitude: null,
  pickup_longitude: null,
  location_source: "MANUAL_SEARCH",
  location_verified: false,
  location_verified_at: null,
  location_accuracy_m: null,
  available_from: "",
  pickup_until: "",
  expected_price: 0,
  price_negotiable: true,
  payment_needed_by: "",
  open_to_aggregation: false,
};
const steps = ["Produce", "Quantity", "Quality", "Location", "Review"];

export default function FarmerLotPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { lotId } = useParams();
  const [profile, setProfile] = useState(
    () => authApi.getSession()?.profile || {},
  );
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [lots, setLots] = useState([]);
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [evidence, setEvidence] = useState([]);
  const [createdLotId, setCreatedLotId] = useState("");
  const [lotDetail, setLotDetail] = useState(null);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadFarmerDefaults() {
      try {
        const value = await authApi.me();
        if (!active) return;
        setProfile(value);
        const data = value.profile_data || {};
        const profileLocation = [data.village, data.taluka, data.district]
          .filter(Boolean)
          .join(", ");
        setForm((current) => ({
          ...current,
          pickup_district: current.pickup_district || data.district || "",
          pickup_taluka: current.pickup_taluka || data.taluka || "",
          pickup_village: current.pickup_village || data.village || "",
          pickup_location_text: current.pickup_location_text || profileLocation,
        }));
        if (data.village && data.district && !form.location_verified) {
          const result = await locationApi.search(
            profileLocation,
            data.district,
            data.taluka || "",
          );
          const suggestion = result.suggestions?.[0];
          if (suggestion && active) {
            const verified = await locationApi.reverse(
              suggestion.latitude,
              suggestion.longitude,
            );
            if (active)
              setForm((current) => ({
                ...current,
                pickup_district: verified.district || current.pickup_district,
                pickup_taluka: verified.taluka || current.pickup_taluka,
                pickup_village: verified.village || current.pickup_village,
                pickup_location_text:
                  verified.display_name || current.pickup_location_text,
                pickup_latitude: verified.latitude,
                pickup_longitude: verified.longitude,
                location_source: "PROFILE_DEFAULT",
                location_verified: true,
                location_verified_at: new Date().toISOString(),
                location_accuracy_m: verified.accuracy_m || null,
              }));
          } else if (active)
            setLocationError(
              "We could not find coordinates for the profile village. Use live location or search for a nearby village.",
            );
        }
      } catch {
        if (active)
          setLocationError(
            "Profile location could not be loaded. Use live location to verify this lot.",
          );
      }
    }
    loadFarmerDefaults();
    return () => {
      active = false;
    };
  }, [navigate]);
  useEffect(() => {
    if (mode === "list")
      lotApi
        .list()
        .then((value) => setLots(value.lots?.length ? value.lots : demoLots.slice(0, 7).map((lot) => ({
          lot_id: lot.id, commodity_name: lot.commodity, variety: lot.variety, quantity: lot.qty, quantity_unit: lot.unit.toLowerCase(), pickup_village: lot.farmer.village, pickup_district: lot.district, expected_price: lot.price, evidence: Array.from({ length: Number(lot.evidence?.split("/")[0] || 0) }, (_, i) => ({ id: `${lot.id}-e-${i}`, sequence_number: i + 1 })), verification_status: lot.evidence === "5/5" ? "VERIFIED" : "PENDING", evidence_status: "SUBMITTED", status: lot.status === "MATCHED" ? "MATCHED" : "OPEN"
        }))))
        .catch(() => setLots(demoLots.slice(0, 7).map((lot) => ({
          lot_id: lot.id, commodity_name: lot.commodity, variety: lot.variety, quantity: lot.qty, quantity_unit: lot.unit.toLowerCase(), pickup_village: lot.farmer.village, pickup_district: lot.district, expected_price: lot.price, evidence: [], verification_status: "VERIFIED", evidence_status: "SUBMITTED", status: "OPEN"
        }))));
  }, [mode]);
  useEffect(() => {
    if (mode === "detail" && lotId)
      lotApi
        .get(lotId)
        .then((value) => setLotDetail(value || demoLots.find((lot) => lot.id === lotId)))
        .catch(() => {
          const mock = demoLots.find((lot) => lot.id === lotId) || demoLots[0];
          setLotDetail(mock ? { ...mock, lot_id: mock.id, commodity_name: mock.commodity, quantity: mock.qty, quantity_unit: mock.unit.toLowerCase(), pickup_village: mock.farmer.village, pickup_district: mock.district, expected_price: mock.price, evidence: [] } : null);
        });
  }, [mode, lotId]);
  useEffect(() => {
    if (locationSearch.trim().length < 2 || form.location_verified) {
      setSuggestions([]);
      return undefined;
    }
    const timer = setTimeout(
      () =>
        locationApi
          .search(locationSearch, form.pickup_district, form.pickup_taluka)
          .then((value) => {
            setSuggestions(value.suggestions || []);
            setLocationError(
              value.suggestions?.length
                ? ""
                : "No map location found. Try a nearby village or use live location.",
            );
          })
          .catch((reason) => {
            setSuggestions([]);
            setLocationError(
              reason.message ||
                "Location search is unavailable. Use live location.",
            );
          }),
      350,
    );
    return () => clearTimeout(timer);
  }, [
    locationSearch,
    form.location_verified,
    form.pickup_district,
    form.pickup_taluka,
  ]);

  const visibleCrops = useMemo(
    () =>
      crops.filter((crop) =>
        `${crop.name} ${crop.key} ${crop.code}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  );
  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "pickup_district"
        ? { pickup_taluka: "", pickup_village: "" }
        : {}),
      ...(key === "pickup_taluka" ? { pickup_village: "" } : {}),
      ...(["pickup_district", "pickup_taluka", "pickup_village"].includes(key)
        ? {
            location_verified: false,
            pickup_latitude: null,
            pickup_longitude: null,
            pickup_location_text: key === "pickup_village" ? value : "",
          }
        : {}),
    }));
    setError("");
    setLocationError("");
  };
  const selectLocation = async (item) => {
    try {
      const verified = await locationApi.reverse(item.latitude, item.longitude);
      setForm((current) => ({
        ...current,
        pickup_district: verified.district || current.pickup_district,
        pickup_taluka: verified.taluka || current.pickup_taluka,
        pickup_village: verified.village || current.pickup_village,
        pickup_location_text: verified.display_name,
        pickup_latitude: verified.latitude,
        pickup_longitude: verified.longitude,
        location_source: "MANUAL_SEARCH",
        location_verified: true,
        location_verified_at: new Date().toISOString(),
      }));
      setLocationSearch(verified.display_name);
      setSuggestions([]);
      setLocationError("");
    } catch (value) {
      setLocationError(value.message);
    }
  };
  const verifyEnteredLocation = async () => {
    if (form.location_verified) return true;
    const query = (locationSearch || form.pickup_location_text || form.pickup_village || "").trim();
    if (!query || query.length < 2) {
      setLocationError("Enter a village, market or area and verify the pickup location before continuing.");
      return false;
    }
    try {
      setLocationError("Verifying pickup location...");
      const result = await locationApi.search(
        query,
        form.pickup_district,
        form.pickup_taluka,
      );
      const suggestion = result.suggestions?.[0];
      if (!suggestion) {
        setLocationError("AARTH could not find this location. Select a search result or use live location.");
        return false;
      }
      await selectLocation(suggestion);
      return true;
    } catch (reason) {
      setLocationError(reason.message || "Unable to verify the pickup location.");
      return false;
    }
  };
  const captureLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Live location is not supported by this browser.");
      return;
    }
    setLocationError("Acquiring live location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const verified = await locationApi.reverse(
            position.coords.latitude,
            position.coords.longitude,
          );
          setForm((current) => ({
            ...current,
            pickup_district: verified.district || current.pickup_district,
            pickup_taluka: verified.taluka || current.pickup_taluka,
            pickup_village: verified.village || current.pickup_village,
            pickup_location_text: verified.display_name,
            pickup_latitude: position.coords.latitude,
            pickup_longitude: position.coords.longitude,
            location_source: "CURRENT_DEVICE",
            location_verified: true,
            location_verified_at: new Date().toISOString(),
            location_accuracy_m: position.coords.accuracy,
          }));
          setLocationSearch(verified.display_name);
          setLocationError("");
        } catch (reason) {
          setLocationError(reason.message);
        }
      },
      (reason) =>
        setLocationError(
          reason.code === 1
            ? "Location permission was denied. Allow location access in the browser, then try again."
            : "Unable to capture your current location. Move to an open area and try again.",
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };
  const complete = (index) =>
    index === 0
      ? Boolean(
          form.commodity_key &&
            Number(form.harvest_duration_min_days) > 0 &&
            Number(form.harvest_duration_max_days) >=
              Number(form.harvest_duration_min_days) &&
            Number(form.harvest_duration_max_days) <= 365,
        )
      : index === 1
        ? Number(form.quantity) > 0 &&
          (!form.partial_sale_allowed || Number(form.minimum_sale_quantity) > 0)
        : index === 2
          ? Boolean(
              form.grade &&
                evidence.filter((item) => item.media_type !== "video").length >= 4 &&
                evidence.filter((item) => item.media_type !== "video").length <= 5,
            )
          : index === 3
            ? Boolean(
                form.pickup_district &&
                  form.pickup_village &&
                  form.pickup_location_text &&
                  form.location_verified &&
                  form.pickup_latitude !== null &&
                  form.pickup_longitude !== null &&
                  form.available_from &&
                  form.pickup_until &&
                  form.payment_needed_by &&
                  form.available_from <= form.pickup_until,
              )
            : index === 4
              ? true
              : [0, 1, 2, 3].every(complete);

  const missingForStep = (index) => {
    const missing = [];
    if (index === 0) {
      if (!form.commodity_key) missing.push("crop");
      if (!(Number(form.harvest_duration_min_days) > 0)) missing.push("harvest duration from");
      if (!(Number(form.harvest_duration_max_days) >= Number(form.harvest_duration_min_days))) missing.push("valid harvest duration to");
    } else if (index === 1) {
      if (!(Number(form.quantity) > 0)) missing.push("quantity");
      if (form.partial_sale_allowed && !(Number(form.minimum_sale_quantity) > 0)) missing.push("minimum sale quantity");
    } else if (index === 2) {
      if (!form.grade) missing.push("grade");
      const photos = evidence.filter((item) => item.media_type !== "video").length;
      if (photos < 4) missing.push(`4 lot photos (currently ${photos})`);
    } else if (index === 3) {
      if (!form.pickup_district) missing.push("district");
      if (!form.pickup_village) missing.push("village");
      if (!form.pickup_location_text) missing.push("pickup location");
      if (!form.location_verified || form.pickup_latitude === null || form.pickup_longitude === null) missing.push("verified pickup coordinates");
      if (!form.available_from) missing.push("available-from date");
      if (!form.pickup_until) missing.push("pickup-until date");
      if (form.available_from && form.pickup_until && form.available_from > form.pickup_until) missing.push("pickup date after availability date");
      if (!form.payment_needed_by) missing.push("payment-needed-by date");
    }
    return missing;
  };

  const submit = async () => {
    if (!complete(0) || !complete(1) || !complete(2) || !complete(3)) {
      const missing = [0, 1, 2, 3].flatMap((index) => missingForStep(index));
      setError(`Complete the following before publishing: ${missing.join(", ")}.`);
      return;
    }
    const photos = evidence.filter((item) => item.media_type !== "video");
    if (photos.length < 4 || photos.length > 5) {
      setError("Add four to five verified lot photos before publishing.");
      return;
    }
    setSaving(true);
    try {
      const result = createdLotId
        ? { lot_id: createdLotId }
        : await lotApi.create({
            ...form,
            harvest_duration_min_days: Number(form.harvest_duration_min_days),
            harvest_duration_max_days: Number(form.harvest_duration_max_days),
            quantity: Number(form.quantity),
            minimum_sale_quantity: form.partial_sale_allowed
              ? Number(form.minimum_sale_quantity)
              : null,
            expected_price: Number(form.expected_price) || 0,
            quality_measurements: form.quality_measurements,
            status: "DRAFT",
          });
      setCreatedLotId(result.lot_id);
      await lotApi.submitEvidence(result.lot_id, evidence);
      setMessage(`Lot ${result.lot_id} published with verified evidence.`);
      navigate("/farmer/lots");
    } catch (value) {
      setError(value.message);
    } finally {
      setSaving(false);
    }
  };
  const displayName =
    profile.profile_data?.full_name || profile.username || "Farmer";

  return (
    <div className="lot-page-shell">
      <header className="lot-topbar">
        <button className="lot-brand" onClick={() => navigate("/farmer")}>
          <img src={logo} alt="AARTH" />
            <span>
              <strong>AARTH</strong>
            </span>
        </button>
        <nav>
          <button onClick={() => navigate("/farmer")}>Profile</button>
          <button
            className={mode === "create" ? "active" : ""}
            onClick={() => navigate("/farmer/lots/new")}
          >
            Create Lot
          </button>
          <button
            className={mode === "list" ? "active" : ""}
            onClick={() => navigate("/farmer/lots")}
          >
            My Lots
          </button>
        </nav>
        <span className="lot-account">{displayName}</span>
      </header>
      <main className="lot-main">
        {mode === "list" ? (
          <LotList lots={lots} error={error} navigate={navigate} setLots={setLots} setError={setError} />
        ) : mode === "detail" ? (
          <LotDetail lot={lotDetail} error={error} navigate={navigate} />
        ) : (
          <>
            <div className="lot-page-heading">
              <div>
                <span className="lot-eyebrow">AARTH · FARMER LOT</span>
                <h1>Create a new lot</h1>
                <p>
                  Describe the produce you are ready to sell. Verified location
                  and farmer-declared quality remain separate.
                </p>
              </div>
              <button
                className="lot-secondary-button"
                onClick={() => navigate("/farmer/lots")}
              >
                My lots
              </button>
            </div>
            <section className="lot-form-card">
              <div className="lot-stepper">
                {steps.map((title, index) => (
                  <button
                    key={title}
                    className={
                      index === step
                        ? "current"
                        : complete(index)
                          ? "completed"
                          : ""
                    }
                    onClick={() => index <= step && setStep(index)}
                  >
                    <i>{complete(index) ? "✓" : index + 1}</i>
                    <span>{title}</span>
                  </button>
                ))}
              </div>
              <div className="lot-form-body">
                {step === 0 && (
                  <Produce
                    form={form}
                    update={update}
                    crops={visibleCrops}
                    search={search}
                    setSearch={setSearch}
                  />
                )}
                {step === 1 && <Quantity form={form} update={update} />}
                {step === 2 && (
                  <Quality
                    form={form}
                    update={update}
                    evidence={evidence}
                    setEvidence={setEvidence}
                  />
                )}
                {step === 3 && (
                  <Location
                    form={form}
                    update={update}
                    search={locationSearch}
                    setSearch={setLocationSearch}
                    suggestions={suggestions}
                    select={selectLocation}
                    onUseLiveLocation={captureLiveLocation}
                    locationError={locationError}
                  />
                )}
                {step === 4 && <Review form={form} update={update} />}
              </div>
              {error && <div className="lot-error">{error}</div>}
              {message && <div className="lot-success">{message}</div>}
              <footer className="lot-form-footer">
                {step > 0 && (
                  <button
                    className="lot-secondary-button"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </button>
                )}
                {step < 4 ? (
                  <button
                    className="lot-primary-button"
                    onClick={async () => {
                      if (step === 3 && !form.location_verified) {
                        const verified = await verifyEnteredLocation();
                        if (!verified) {
                          setError("AARTH still needs a verified pickup location before you can continue.");
                          return;
                        }
                      }
                      if (complete(step)) {
                        setError("");
                        setStep(step + 1);
                      } else {
                        const missing = missingForStep(step);
                        setError(`Complete: ${missing.join(", ") || "the required information"}.`);
                      }
                    }}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    className="lot-primary-button"
                    disabled={saving}
                    onClick={submit}
                  >
                    {saving ? "Publishing..." : "Publish lot"}
                  </button>
                )}
              </footer>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function LotList({ lots, error, navigate, setLots, setError }) {
  const remove = async (event, lot) => {
    event.stopPropagation();
    if (!window.confirm(`Delete draft lot ${lot.lot_id}? This cannot be undone.`)) return;
    try { await lotApi.delete(lot.lot_id); setLots((items) => items.filter((item) => item.lot_id !== lot.lot_id)); }
    catch (reason) { setError(reason.message); }
  };
  return (
    <>
      <div className="lot-page-heading">
        <div>
          <span className="lot-eyebrow">FARMER · SUPPLY</span>
          <h1>My Lots</h1>
          <p>Review the produce lots created from your Farmer account.</p>
        </div>
        <button
          className="lot-primary-button"
          onClick={() => navigate("/farmer/lots/new")}
        >
          Create new lot
        </button>
      </div>
      {error && <div className="lot-error">{error}</div>}
      <section className="lot-table-card">
        {lots.length ? (
          <table className="lot-table">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Produce</th>
                <th>Quantity</th>
                <th>Pickup</th>
                <th>Price</th>
                <th>Evidence</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr
                  key={lot.lot_id}
                  onClick={() => navigate(`/farmer/lots/${lot.lot_id}`)}
                >
                  <td>
                    <strong>{lot.lot_id}</strong>
                  </td>
                  <td>
                    {lot.commodity_name}
                    <small>{lot.variety || "Variety not specified"}</small>
                  </td>
                  <td>
                    {lot.quantity} {lot.quantity_unit}
                  </td>
                  <td>
                    {lot.pickup_village}
                    <small>{lot.pickup_district}</small>
                  </td>
                  <td>₹{Number(lot.expected_price).toLocaleString("en-IN")}</td>
                  <td>
                    <small>{lot.evidence?.length || 0} photos</small>
                    <span
                      className={`lot-verification ${lot.verification_status === "VERIFIED" ? "verified" : "not-verified"}`}
                    >
                      {lot.verification_status === "VERIFIED"
                        ? "✓ VERIFIED"
                        : "⚠ NOT VERIFIED"}
                    </span>
                  </td>
                  <td>
                    <span className="lot-status">{lot.status}</span>
                  </td>
                  <td>{lot.status === "DRAFT" ? <button className="lot-delete-button" onClick={(event) => remove(event, lot)}>Delete</button> : <small>Cancellation retains audit history</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="lot-empty">
            <h2>No lots created yet</h2>
            <p>
              Create your first lot to prepare produce for future market
              matching.
            </p>
            <button
              className="lot-primary-button"
              onClick={() => navigate("/farmer/lots/new")}
            >
              Create your first lot
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function LotDetail({ lot, error, navigate }) {
  if (error) return <div className="lot-error">{error}</div>;
  if (!lot)
    return (
      <section className="lot-table-card lot-empty">
        <h2>Loading lot details...</h2>
      </section>
    );
  const mock = lot.commodity ? lot : null;
  const transaction = demoTransactions.find((tx) => tx.lot?.id === lot.lot_id || tx.lot?.id === lot.id);
  const txStatus = transaction?.status || (mock?.status === "MATCHED" ? "IN_TRANSIT" : "OPEN");
  return (
    <>
      <section className="lot-table-card lot-detail">
        <button className="lot-secondary-button" onClick={() => navigate("/farmer/lots")}>← Back to my lots</button>
        <div className="lot-page-heading">
          <div>
            <span className="lot-eyebrow">LOT → OFFER → DELIVERY → PAYMENT</span>
            <h1>{lot.commodity_name || lot.commodity}</h1>
            <p>{lot.lot_id || lot.id} · {lot.quantity || lot.qty} {lot.quantity_unit || lot.unit}</p>
          </div>
          <span className={`lot-verification ${lot.verification_status === "VERIFIED" || mock?.evidence === "5/5" ? "verified" : "not-verified"}`}>
            {lot.verification_status === "VERIFIED" || mock?.evidence === "5/5" ? "✓ VERIFIED" : "⚠ DECLARED"}
          </span>
        </div>
        <div className="farmer-lot-detail-grid">
          <div><small>QUALITY</small><strong>{lot.grade || mock?.grade || "Grade A"} · {lot.size_calibre || mock?.size || "55–70 mm"}</strong></div>
          <div><small>PICKUP</small><strong>{lot.pickup_village || mock?.farmer?.village}, {lot.pickup_district || mock?.district}</strong></div>
          <div><small>EXPECTED PRICE</small><strong>₹{Number(lot.expected_price || mock?.price || 0).toLocaleString("en-IN")}/qtl</strong></div>
          <div><small>AARTH MATCH</small><strong>{mock?.match || 92}%</strong></div>
        </div>
        <div className="lot-lifecycle">
          {["Lot created", "Offer received", "Logistics", "Delivery", "Payment"].map((step, index) => <div key={step} className={index <= (txStatus === "OPEN" ? 1 : 4) ? "done" : ""}><i>{index + 1}</i><span>{step}</span></div>)}
        </div>
      </section>
      <section className="farmer-lot-detail-grid farmer-lot-detail-cards">
        <article><small>BUYER / OFFER</small><h3>{transaction?.buyer?.name || "Sahyadri Food Processing Pvt. Ltd."}</h3><p>{transaction ? `Offer amount ${Number(transaction.amount).toLocaleString("en-IN")} · ${transaction.quantity}` : "Top matching buyer · ₹2,875/qtl indicative offer"}</p><button>Review offer</button></article>
        <article><small>PAYMENT HISTORY</small><h3>{transaction?.payment || "PENDING"}</h3><p>{transaction ? `Transaction ${transaction.id}` : "Payment is released after verified delivery."}</p><button>View digital receipt</button></article>
        <article><small>LIVE SHIPPING</small><h3>{tracking.vehicle}</h3><p>{tracking.current} · {tracking.progress}% route complete</p><button onClick={() => document.getElementById("farmer-tracking")?.scrollIntoView({ behavior: "smooth" })}>Track shipment</button></article>
      </section>
      <section className="lot-table-card" id="farmer-tracking">
        <h2>Shipping path & tracking</h2>
        <p className="lot-detail-subtle">{tracking.lastUpdated} · Vehicle {tracking.vehicle} · Driver {tracking.driver}</p>
        <div className="farmer-tracking-timeline">{tracking.route.map((point) => <div className={point.done ? "done" : ""} key={point.label}><i>{point.done ? "✓" : "•"}</i><span><b>{point.label}</b><small>{point.place} · {point.time}</small></span></div>)}</div>
      </section>
      <section className="lot-table-card">
        <div className="lot-detail-action-row"><div><h2>Digital transaction record</h2><p className="lot-detail-subtle">Unique lot/transaction records are retained for traceability.</p></div><button className="lot-primary-button">Download digital receipt</button><button className="lot-secondary-button">Raise grievance</button></div>
      </section>
    </>
  );
}
function Produce({ form, update, crops, search, setSearch }) {
  const [otherVariety, setOtherVariety] = useState(false);
  const varieties = varietiesForCrop(form.commodity_key);
  return (
    <Step
      title="What are you selling?"
      text="Choose a crop and state the expected harvest duration. You do not need to provide an exact harvest date."
    >
      <label>
        Search crop
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search crop name"
        />
      </label>
      <div className="crop-grid">
        {crops.map((crop) => (
          <button
            type="button"
            className={form.commodity_key === crop.key ? "selected" : ""}
            key={crop.key}
            onClick={() => {
            update("commodity_key", crop.key);
            update("commodity_name", crop.name);
            update("variety", "");
            setOtherVariety(false);
            }}
          >
            {crop.name}
            <small>{crop.key}</small>
          </button>
        ))}
      </div>
      <label>
        Selected crop
        <input readOnly value={form.commodity_name || ""} />
      </label>
      {hasVarietyChoices(form.commodity_key) && !otherVariety ? <label>Variety<select value={form.variety} onChange={(event) => event.target.value === "__other__" ? (setOtherVariety(true), update("variety", "")) : update("variety", event.target.value)}><option value="">Select variety (optional)</option>{varieties.map((value) => <option key={value} value={value}>{value}</option>)}<option value="__other__">Other — type variety</option></select></label> : <label>Variety<input value={form.variety} onChange={(event) => update("variety", event.target.value)} placeholder="Enter variety (optional)" disabled={!form.commodity_key} />{hasVarietyChoices(form.commodity_key) && <button type="button" className="lot-text-button" onClick={() => { setOtherVariety(false); update("variety", ""); }}>Choose from list</button>}</label>}
      <div className="lot-duration-fields">
        <label>
          Harvest duration — from (days)
          <input
            type="number"
            min="1"
            max="365"
            value={form.harvest_duration_min_days}
            onChange={(event) =>
              update("harvest_duration_min_days", event.target.value)
            }
          />
        </label>
        <label>
          To (days)
          <input
            type="number"
            min="1"
            max="365"
            value={form.harvest_duration_max_days}
            onChange={(event) =>
              update("harvest_duration_max_days", event.target.value)
            }
          />
        </label>
      </div>
      <p className="lot-duration-help">
        {Number(form.harvest_duration_min_days) > 0 &&
        Number(form.harvest_duration_max_days) >=
          Number(form.harvest_duration_min_days)
          ? `Expected harvest duration: ${form.harvest_duration_min_days}–${form.harvest_duration_max_days} days`
          : "Enter a duration from 1 to 365 days; the end must not be before the start."}
      </p>
    </Step>
  );
}
function Quantity({ form, update }) {
  return (
    <Step
      title="How much do you have?"
      text="Enter the quantity available for this lot."
    >
      <label>
        Quantity
        <input
          type="number"
          min="0.001"
          value={form.quantity}
          onChange={(event) => update("quantity", event.target.value)}
        />
      </label>
      <label>
        Unit
        <select
          value={form.quantity_unit}
          onChange={(event) => update("quantity_unit", event.target.value)}
        >
          <option value="kg">Kilogram</option>
          <option value="quintal">Quintal</option>
          <option value="ton">Tonne</option>
        </select>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={form.partial_sale_allowed}
          onChange={(event) =>
            update("partial_sale_allowed", event.target.checked)
          }
        />{" "}
        Part of this lot may be sold
      </label>
      {form.partial_sale_allowed && (
        <label>
          Minimum sale quantity
          <input
            type="number"
            min="0.001"
            value={form.minimum_sale_quantity}
            onChange={(event) =>
              update("minimum_sale_quantity", event.target.value)
            }
          />
        </label>
      )}
    </Step>
  );
}
function Quality({ form, update, evidence, setEvidence }) {
  return (
    <Step
      title="What is the quality?"
      text="Quality is farmer-declared until later verification."
    >
      <label>
        Grade
        <select
          value={form.grade}
          onChange={(event) => update("grade", event.target.value)}
        >
          <option value="">Select grade</option>
          <option>Grade A</option>
          <option>Grade B</option>
          <option>FAQ / Standard</option>
          <option>Not sure / To be verified</option>
        </select>
      </label>
      <label>
        Size / calibre
        <input
          value={form.size_calibre}
          onChange={(event) => update("size_calibre", event.target.value)}
        />
      </label>
      <div className="lot-evidence-slot">
        <LotEvidenceCapture
          evidence={evidence}
          setEvidence={setEvidence}
          commodityKey={form.commodity_key}
        />
      </div>
    </Step>
  );
}
function Location({
  form,
  update,
  search,
  setSearch,
  suggestions,
  select,
  onUseLiveLocation,
  locationError,
}) {
  return (
    <Step
      title="Where and when is the lot available?"
      text="Select a Maharashtra pickup location so AARTH can verify coordinates."
    >
      <label>
        District
        <select
          value={form.pickup_district}
          onChange={(event) => update("pickup_district", event.target.value)}
        >
          <option value="">Select district</option>
          {MAHARASHTRA_DISTRICTS.map((district) => (
            <option key={district.name}>{district.name}</option>
          ))}
        </select>
      </label>
      <label>
        Taluka
        <select
          value={form.pickup_taluka}
          onChange={(event) => update("pickup_taluka", event.target.value)}
        >
          <option value="">Select taluka</option>
          {getTalukasForDistrict(form.pickup_district).map((taluka) => (
            <option key={taluka}>{taluka}</option>
          ))}
        </select>
      </label>
      <label>
        Village
        <input
          value={form.pickup_village}
          onChange={(event) => update("pickup_village", event.target.value)}
        />
      </label>
      <label>
        Search and verify location
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Village, market or area"
        />
        {suggestions.map((item) => (
          <button
            type="button"
            className="suggestion"
            key={item.display_name}
            onClick={() => select(item)}
          >
            {item.display_name}
          </button>
        ))}
        <button
          type="button"
          className="lot-live-location-button"
          onClick={onUseLiveLocation}
        >
          Use live location
        </button>
      </label>
      {form.location_verified && (
        <p className="verified">
          Location verified: {form.pickup_location_text}
        </p>
      )}
      {locationError && <p className="lot-location-error">{locationError}</p>}
      <label>
        Available from
        <input
          type="date"
          value={form.available_from}
          onChange={(event) => update("available_from", event.target.value)}
        />
      </label>
      <label>
        Pickup until
        <input
          type="date"
          value={form.pickup_until}
          onChange={(event) => update("pickup_until", event.target.value)}
        />
      </label>
      <label>
        Payment needed by
        <input
          type="date"
          value={form.payment_needed_by}
          onChange={(event) => update("payment_needed_by", event.target.value)}
        />
      </label>
    </Step>
  );
}
function Selling({ form, update }) {
  return (
    <Step
      title="How would you like to sell?"
      text="Expected price is an input for negotiation, not a guaranteed market price."
    >
      <label>
        Expected price per quintal
        <input
          type="number"
          min="0"
          value={form.expected_price}
          onChange={(event) => update("expected_price", event.target.value)}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={form.price_negotiable}
          onChange={(event) => update("price_negotiable", event.target.checked)}
        />{" "}
        Price is negotiable
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={form.open_to_aggregation}
          onChange={(event) =>
            update("open_to_aggregation", event.target.checked)
          }
        />{" "}
        Open to aggregation
      </label>
    </Step>
  );
}
function Review({ form, update }) {
  return (
    <Step
      title="Review your lot"
      text="Check the information before creating the lot."
    >
      <div className="review-grid">
        <b>Produce</b>
        <span>
          {form.commodity_name || form.commodity_key || "Not selected"}
        </span>
        <b>Quantity</b>
        <span>
          {form.quantity} {form.quantity_unit}
        </span>
        <b>Grade</b>
        <span>{form.grade}</span>
        <b>Pickup</b>
        <span>{form.pickup_location_text}</span>
        <b>Expected price / quintal</b>
        <span>
          <input
            type="number"
            min="0"
            value={form.expected_price}
            onChange={(event) => update("expected_price", event.target.value)}
            aria-label="Expected price per quintal"
          />
        </span>
      </div>
    </Step>
  );
}
function Step({ title, text, children }) {
  return (
    <div className="lot-step">
      <h2>{title}</h2>
      <p>{text}</p>
      <div className="lot-fields">{children}</div>
    </div>
  );
}
