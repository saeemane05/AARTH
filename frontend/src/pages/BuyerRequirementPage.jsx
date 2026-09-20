import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, buyerRequirementApi, locationApi } from "../api/auth";
import { ALL_AARTH_CROPS } from "../data/farmerCropMaster";
import { hasVarietyChoices, varietiesForCrop } from "../data/cropVarieties";
import logo from "../assets/aarth-logo.png";
import "./BuyerRequirementPage.css";

const empty = {
  commodity_key: "",
  commodity_name: "",
  variety: "",
  quantity: "",
  quantity_unit: "ton",
  quality_grade: "Any",
  size_calibre: "",
  quality_requirements: "",
  delivery_location: "",
  delivery_district: "",
  delivery_taluka: "",
  delivery_city: "",
  delivery_latitude: null,
  delivery_longitude: null,
  delivery_start_date: "",
  delivery_end_date: "",
  packaging_requirement: "No specific requirement",
  target_price: "",
  target_price_unit: "INR_PER_QUINTAL",
  open_to_market_pricing: false,
  additional_requirements: "",
};
const steps = [
  "Produce",
  "Quantity & Quality",
  "Delivery",
  "Preferences",
  "Review & Publish",
];
const displayUnit = (unit) =>
  ({ kg: "Kg", quintal: "Quintals", ton: "Tonnes" })[unit] || unit;
const dateText = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`))
    : "Not set";

export default function BuyerRequirementPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [step, setStep] = useState(-1);
  const [editing, setEditing] = useState(null);
  const [cropSearch, setCropSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      const [me, result] = await Promise.all([
        authApi.me(),
        buyerRequirementApi.list(),
      ]);
      setProfile(me);
      setItems(result.requirements || []);
    } catch (reason) {
      setError(
        reason.message?.includes("503")
          ? "Buyer requirement service is temporarily unavailable. Please try again."
          : "Unable to load your requirements. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  // Mirrors the Farmer Lot location pattern: a verified/default location is not re-searched,
  // while typing a different location opens the same shared location search.
  useEffect(() => {
    if (
      locationSearch.trim().length < 2 ||
      (form.delivery_latitude !== null &&
        form.delivery_longitude !== null &&
        locationSearch === form.delivery_location)
    )
      return setLocations([]);
    const timer = setTimeout(
      () =>
        locationApi
          .search(locationSearch, form.delivery_district, form.delivery_taluka)
          .then((r) => setLocations(r.suggestions || []))
          .catch(() => setLocations([])),
      350,
    );
    return () => clearTimeout(timer);
  }, [
    locationSearch,
    form.delivery_district,
    form.delivery_taluka,
    form.delivery_latitude,
    form.delivery_longitude,
    form.delivery_location,
  ]);
  const suggestions = useMemo(
    () =>
      ALL_AARTH_CROPS.filter((crop) =>
        (profile.profile_data?.sourcing_commodities || []).includes(crop.key),
      ),
    [profile],
  );
  const crops = useMemo(
    () =>
      ALL_AARTH_CROPS.filter((crop) =>
        `${crop.name} ${crop.key}`
          .toLowerCase()
          .includes(cropSearch.toLowerCase()),
      ),
    [cropSearch],
  );
  const update = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
    setError("");
  };
  const start = (item = null) => {
    const d = profile.profile_data || {};
    setEditing(item);
    setForm(
      item
        ? {
            ...empty,
            ...item,
            quantity: item.quantity ?? "",
            target_price: item.target_price ?? "",
          }
        : {
            ...empty,
            delivery_location: d.operating_location_text || "",
            delivery_district: d.operating_district || "",
            delivery_taluka: d.operating_taluka || "",
            delivery_city: d.operating_city || "",
            delivery_latitude: d.operating_latitude || null,
            delivery_longitude: d.operating_longitude || null,
          },
    );
    setLocationSearch(
      item?.delivery_location || d.operating_location_text || "",
    );
    setStep(0);
    setError("");
    setNotice("");
  };
  const selectLocation = async (item) => {
    try {
      const place = await locationApi.reverse(item.latitude, item.longitude);
      setForm((old) => ({
        ...old,
        delivery_location: place.display_name,
        delivery_district: place.district || "",
        delivery_taluka: place.taluka || "",
        delivery_city: place.village || place.taluka || "",
        delivery_latitude: place.latitude,
        delivery_longitude: place.longitude,
      }));
      setLocationSearch(place.display_name);
      setLocations([]);
    } catch {
      setError("Unable to verify that location. Please try another location.");
    }
  };
  const valid = () =>
    form.commodity_key &&
    Number(form.quantity) > 0 &&
    form.quantity_unit &&
    form.delivery_location &&
    form.delivery_district &&
    form.delivery_latitude !== null &&
    form.delivery_longitude !== null &&
    form.delivery_start_date &&
    form.delivery_end_date &&
    form.delivery_start_date <= form.delivery_end_date;
  const payload = () => ({
    ...form,
    quantity: form.quantity === "" ? null : Number(form.quantity),
    target_price: form.target_price === "" ? null : Number(form.target_price),
  });
  const save = async (publish = false) => {
    if (publish && !valid()) {
      setError(
        "Complete all required produce, quantity, delivery location and delivery date fields before publishing.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = editing
        ? await buyerRequirementApi.update(editing.requirement_id, payload())
        : await buyerRequirementApi.create(payload());
      if (publish) await buyerRequirementApi.publish(saved.requirement_id);
      setNotice(
        publish
          ? "Requirement published successfully."
          : "Requirement saved as draft.",
      );
      setStep(-1);
      setEditing(null);
      await load();
    } catch (reason) {
      setError(
        reason.message ||
          (publish
            ? "Requirement could not be published. Please review the highlighted fields."
            : "Unable to save this requirement. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };
  const status = async (id, next) => {
    try {
      await buyerRequirementApi.transition(id, next);
      await load();
    } catch {
      setError("Unable to update this requirement. Please try again.");
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this draft requirement? This cannot be undone.")) return;
    try { await buyerRequirementApi.delete(id); setItems((current) => current.filter((item) => item.requirement_id !== id)); setNotice("Draft requirement deleted."); }
    catch (reason) { setError(reason.message || "Unable to delete this requirement."); }
  };
  const nav = (item) =>
    item === "Home"
      ? navigate("/buyer")
      : item === "Profile"
        ? navigate("/buyer")
        : item === "My Requirements"
          ? null
          : setNotice(
              `${item} will be available in the next Buyer workspace release.`,
            );
  return (
    <div className="requirements-shell">
      <header className="requirements-nav">
        <button
          className="requirements-brand"
          onClick={() => navigate("/buyer")}
        >
          <img src={logo} alt="AARTH" />
          AARTH
        </button>
        <nav>
          {[
            "Home",
            "Profile",
            "Search Produce",
            "My Requirements",
            "Orders",
            "Supplier Network",
            "Market Insights",
            "Support",
          ].map((item) => (
            <button
              key={item}
              className={item === "My Requirements" ? "active" : ""}
              onClick={() => nav(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>
      <main className="requirements-main">
        {step < 0 ? (
          <List
            items={items}
            loading={loading}
            start={start}
            status={status}
            remove={remove}
            profile={profile}
          />
        ) : (
          <Form
            form={form}
            update={update}
            step={step}
            setStep={setStep}
            suggestions={suggestions}
            crops={crops}
            cropSearch={cropSearch}
            setCropSearch={setCropSearch}
            locations={locations}
            selectLocation={selectLocation}
            locationSearch={locationSearch}
            setLocationSearch={setLocationSearch}
            valid={valid}
            save={save}
            saving={saving}
            editing={editing}
          />
        )}
        {error && <div className="req-message error">{error}</div>}
        {notice && <div className="req-message success">✓ {notice}</div>}
      </main>
    </div>
  );
}

function List({ items, loading, start, status, remove, profile }) {
  const groups = ["ACTIVE", "DRAFT", "PAUSED", "FULFILLED", "CANCELLED"]
    .map((key) => [key, items.filter((item) => item.status === key)])
    .filter(([, values]) => values.length);
  const gstVerified =
    profile.profile_data?.verification_status === "GSTIN_VERIFIED";
  return (
    <>
      <section className="requirements-hero">
        <div>
          <small>AARTH · BUYER WORKSPACE</small>
          <h1>My Requirements</h1>
          <p>
            Manage your active sourcing requirements and create new requirements
            for agricultural produce.
          </p>
        </div>
        <button className="req-primary" onClick={() => start()}>
          + Create Requirement
        </button>
      </section>
      {loading ? (
        <div className="req-skeleton">
          <i />
          <i />
          <i />
        </div>
      ) : !items.length ? (
        <section className="req-empty">
          <h2>No active requirements yet.</h2>
          <p>Create a requirement to tell AARTH what produce you need.</p>
          <button className="req-primary" onClick={() => start()}>
            + Create Requirement
          </button>
        </section>
      ) : (
        groups.map(([title, values]) => (
          <section className="req-group" key={title}>
            <h2>{title}</h2>
            <div className="req-cards">
              {values.map((item) => (
                <article className="req-card" key={item.requirement_id}>
                  <header>
                    <b>{item.requirement_id}</b>
                    <span className={`req-status ${item.status.toLowerCase()}`}>
                      ● {item.status}
                    </span>
                  </header>
                  <h3>{item.commodity_name || "Produce not selected"}</h3>
                  <p className="req-variety">{item.variety || "Any variety"}</p>
                  <dl className="req-card-details">
                    <dt>Required quantity</dt>
                    <dd>
                      {item.quantity
                        ? `${item.quantity} ${displayUnit(item.quantity_unit)}`
                        : "Not set"}
                    </dd>
                    <dt>Quality grade</dt>
                    <dd>{item.quality_grade || "Any grade"}</dd>
                    <dt>Delivery</dt>
                    <dd>{item.delivery_location || "Not set"}</dd>
                    <dt>Delivery window</dt>
                    <dd>
                      {dateText(item.delivery_start_date)} –{" "}
                      {dateText(item.delivery_end_date)}
                    </dd>
                    <dt>Target price</dt>
                    <dd>
                      {item.open_to_market_pricing
                        ? "Open to market pricing"
                        : item.target_price
                          ? `₹${item.target_price}`
                          : "Not specified"}
                    </dd>
                  </dl>
                  <span
                    className={`gst-badge ${gstVerified ? "verified" : "pending"}`}
                  >
                    {gstVerified ? "GSTIN Verified" : "GSTIN Not Verified"}
                  </span>
                  <footer>
                    {["DRAFT", "ACTIVE", "PAUSED"].includes(item.status) && (
                      <button onClick={() => start(item)}>Edit</button>
                    )}
                    {item.status === "DRAFT" && (
                      <button
                        onClick={() => status(item.requirement_id, "ACTIVE")}
                      >
                        Publish
                      </button>
                    )}
                    {item.status === "DRAFT" && <button className="req-delete" onClick={() => remove(item.requirement_id)}>Delete draft</button>}
                    {item.status === "ACTIVE" && (
                      <button
                        onClick={() => status(item.requirement_id, "PAUSED")}
                      >
                        Pause
                      </button>
                    )}
                    {item.status === "PAUSED" && (
                      <button
                        onClick={() => status(item.requirement_id, "ACTIVE")}
                      >
                        Resume
                      </button>
                    )}
                    {["DRAFT", "ACTIVE", "PAUSED"].includes(item.status) && (
                      <button
                        onClick={() => status(item.requirement_id, "CANCELLED")}
                      >
                        Cancel
                      </button>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

function Form(props) {
  const {
    form,
    update,
    step,
    setStep,
    suggestions,
    crops,
    cropSearch,
    setCropSearch,
    locations,
    selectLocation,
    locationSearch,
    setLocationSearch,
    valid,
    save,
    saving,
    editing,
  } = props;
  const [otherVariety, setOtherVariety] = useState(false);
  const varieties = varietiesForCrop(form.commodity_key);
  return (
    <>
      <section className="requirements-hero compact">
        <div>
          <small>AARTH · BUYER REQUIREMENT</small>
          <h1>
            {editing ? `Edit ${editing.requirement_id}` : "Create Requirement"}
          </h1>
          <p>
            Your business identity is securely reused from your Buyer Profile.
          </p>
        </div>
      </section>
      <section className="req-form">
        <div className="req-steps">
          {steps.map((label, index) => (
            <button
              key={label}
              className={step === index ? "active" : ""}
              onClick={() => index <= step && setStep(index)}
            >
              <i>{index + 1}</i>
              {label}
            </button>
          ))}
        </div>
        <div className="req-body">
          {step === 0 && (
            <>
              <h2>Produce</h2>
              {suggestions.length > 0 && (
                <>
                  <p>Suggested from your sourcing profile</p>
                  <div className="req-chips">
                    {suggestions.map((crop) => (
                      <button
                        className={
                          form.commodity_key === crop.key ? "selected" : ""
                        }
                        key={crop.key}
                        onClick={() => {
                          update("commodity_key", crop.key);
                          update("commodity_name", crop.name);
                          update("variety", "");
                          setOtherVariety(false);
                        }}
                      >
                        {crop.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <label>
                Commodity *
                <input
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  placeholder="Search all commodities"
                />
              </label>
              <div className="req-crops">
                {crops.map((crop) => (
                  <button
                    className={
                      form.commodity_key === crop.key ? "selected" : ""
                    }
                    key={crop.key}
                    onClick={() => {
                      update("commodity_key", crop.key);
                      update("commodity_name", crop.name);
                      update("variety", "");
                      setOtherVariety(false);
                    }}
                  >
                    {crop.name}
                  </button>
                ))}
              </div>
              {hasVarietyChoices(form.commodity_key) && !otherVariety ? <label>Variety<select value={form.variety} onChange={(e) => e.target.value === "__other__" ? (setOtherVariety(true), update("variety", "")) : update("variety", e.target.value)}><option value="">Select variety (optional)</option>{varieties.map((value) => <option key={value} value={value}>{value}</option>)}<option value="__other__">Other — type variety</option></select></label> : <label>Variety<input value={form.variety} onChange={(e) => update("variety", e.target.value)} placeholder="Type variety (optional)" disabled={!form.commodity_key} />{hasVarietyChoices(form.commodity_key) && <button type="button" className="req-text-button" onClick={() => { setOtherVariety(false); update("variety", ""); }}>Choose from list</button>}</label>}
            </>
          )}
          {step === 1 && (
            <>
              <h2>Quantity & Quality</h2>
              <div className="req-fields">
                <label>
                  Required quantity *
                  <input
                    type="number"
                    min="0.001"
                    value={form.quantity}
                    onChange={(e) => update("quantity", e.target.value)}
                  />
                </label>
                <label>
                  Unit *
                  <select
                    value={form.quantity_unit}
                    onChange={(e) => update("quantity_unit", e.target.value)}
                  >
                    <option value="kg">Kilogram</option>
                    <option value="quintal">Quintal</option>
                    <option value="ton">Tonne</option>
                  </select>
                </label>
                <label>
                  Quality grade
                  <select
                    value={form.quality_grade}
                    onChange={(e) => update("quality_grade", e.target.value)}
                  >
                    <option>Any</option>
                    <option>Grade A</option>
                    <option>Grade B</option>
                    <option>FAQ / Standard</option>
                  </select>
                </label>
                <label>
                  Preferred size / calibre
                  <input
                    value={form.size_calibre}
                    onChange={(e) => update("size_calibre", e.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>
              <label>
                Other quality requirements
                <textarea
                  value={form.quality_requirements}
                  onChange={(e) =>
                    update("quality_requirements", e.target.value)
                  }
                  placeholder="Fresh, uniform size, no visible damage."
                />
              </label>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Delivery / Receiving Location</h2>
              <p>
                Using your procurement location from Buyer Profile where
                available. You can change it for this requirement.
              </p>
              <label>
                Search and verify delivery location *
                <input
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Village, market or area"
                />
                {locations.map((item) => (
                  <button
                    className="req-location"
                    key={item.display_name}
                    onClick={() => selectLocation(item)}
                  >
                    {item.display_name}
                  </button>
                ))}
              </label>
              {form.delivery_location && (
                <p className="req-verified">✓ {form.delivery_location}</p>
              )}
              <div className="req-fields">
                <label>
                  Delivery from *
                  <input
                    type="date"
                    value={form.delivery_start_date}
                    onChange={(e) =>
                      update("delivery_start_date", e.target.value)
                    }
                  />
                </label>
                <label>
                  Delivery by *
                  <input
                    type="date"
                    value={form.delivery_end_date}
                    onChange={(e) =>
                      update("delivery_end_date", e.target.value)
                    }
                  />
                </label>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Preferences</h2>
              <div className="req-fields">
                <label>
                  Packaging requirement
                  <select
                    value={form.packaging_requirement}
                    onChange={(e) =>
                      update("packaging_requirement", e.target.value)
                    }
                  >
                    {[
                      "No specific requirement",
                      "Bulk / Loose",
                      "Bags",
                      "Crates",
                      "Other",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Target buying price
                  <input
                    disabled={form.open_to_market_pricing}
                    type="number"
                    min="0"
                    value={form.target_price}
                    onChange={(e) => update("target_price", e.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Price unit
                  <select
                    value={form.target_price_unit}
                    onChange={(e) =>
                      update("target_price_unit", e.target.value)
                    }
                  >
                    <option value="INR_PER_KG">per Kg</option>
                    <option value="INR_PER_QUINTAL">per Quintal</option>
                    <option value="INR_PER_TON">per Tonne</option>
                  </select>
                </label>
              </div>
              <label className="req-check">
                <input
                  type="checkbox"
                  checked={form.open_to_market_pricing}
                  onChange={(e) =>
                    update("open_to_market_pricing", e.target.checked)
                  }
                />{" "}
                Open to market-based pricing
              </label>
              <label>
                Additional requirements
                <textarea
                  value={form.additional_requirements}
                  onChange={(e) =>
                    update("additional_requirements", e.target.value)
                  }
                  placeholder="Prefer consistent quality suitable for retail distribution."
                />
              </label>
            </>
          )}
          {step === 4 && <Review form={form} />}
        </div>
        <footer className="req-footer">
          <button onClick={() => (step > 0 ? setStep(step - 1) : save(false))}>
            {step > 0 ? "Back" : "Save as Draft"}
          </button>
          {step < 4 ? (
            <button className="req-primary" onClick={() => setStep(step + 1)}>
              Continue
            </button>
          ) : (
            <>
              <button onClick={() => save(false)} disabled={saving}>
                Save as Draft
              </button>
              <button
                className="req-primary"
                onClick={() => save(true)}
                disabled={saving || !valid()}
              >
                {saving ? "Publishing..." : "Publish Requirement"}
              </button>
            </>
          )}
        </footer>
      </section>
    </>
  );
}
function Review({ form }) {
  const fields = [
    ["Produce", form.commodity_name],
    ["Variety", form.variety || "Any variety"],
    [
      "Required quantity",
      form.quantity
        ? `${form.quantity} ${displayUnit(form.quantity_unit)}`
        : "Not set",
    ],
    ["Quality grade", form.quality_grade || "Any"],
    ["Size / calibre", form.size_calibre || "Any"],
    ["Delivery location", form.delivery_location],
    [
      "Delivery window",
      `${dateText(form.delivery_start_date)} – ${dateText(form.delivery_end_date)}`,
    ],
    ["Packaging", form.packaging_requirement],
    [
      "Target buying price",
      form.open_to_market_pricing
        ? "Open to market-based pricing"
        : form.target_price
          ? `₹${form.target_price} / ${form.target_price_unit?.replace("INR_PER_", "")}`
          : "Not specified",
    ],
    ["Additional requirements", form.additional_requirements || "None"],
  ];
  return (
    <section className="req-review">
      <h2>Review Requirement</h2>
      <dl>
        {fields.flatMap(([label, value]) => [
          <dt key={`${label}-label`}>{label}</dt>,
          <dd key={`${label}-value`}>{value || "Not set"}</dd>,
        ])}
      </dl>
    </section>
  );
}
