import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, buyerRequirementApi, locationApi } from "../api/auth";
import MarketPriceAdvisor from "../components/MarketPriceAdvisor";
import { ALL_AARTH_CROPS } from "../data/farmerCropMaster";
import { hasVarietyChoices, varietiesForCrop } from "../data/cropVarieties";
import logo from "../assets/aarth-logo.png";
import "./BuyerRequirementPage.css";
import { demoRequirements } from "../data/prototypeData";

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
  location_source: "MANUAL_SEARCH",
  location_verified: false,
  location_verified_at: null,
  location_accuracy_m: null,
  delivery_start_date: "",
  delivery_end_date: "",
  packaging_requirement: "No specific requirement",
  target_price: "",
  target_price_min: "",
  target_price_max: "",
  target_price_unit: "INR_PER_QUINTAL",
  price_mode: "PREFERRED_RANGE",
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
const todayDate = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};
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
      setItems((result.requirements || []).length ? result.requirements : demoRequirements.map((r) => ({
        requirement_id: r.id, commodity_name: r.crop, variety: r.variety, quantity: r.quantity, quantity_unit: "ton", quality_grade: r.grade, size_calibre: r.size, delivery_location: r.location, delivery_end_date: r.deadline, status: "ACTIVE", target_price: 0,
      })));
    } catch (reason) {
      setItems(demoRequirements.map((r) => ({ requirement_id: r.id, commodity_name: r.crop, variety: r.variety, quantity: r.quantity, quantity_unit: "ton", quality_grade: r.grade, size_calibre: r.size, delivery_location: r.location, delivery_end_date: r.deadline, status: "ACTIVE", target_price: 0 })));
      setError("Live requirement service unavailable — showing SIH prototype requirements.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  /*
   * Buyer delivery location uses the same verification model as Farmer Lot.
   * A typed string is NOT considered verified until AARTH resolves it through
   * the location service, or the buyer captures current device location.
   */
  useEffect(() => {
    if (
      locationSearch.trim().length < 2 ||
      form.location_verified
    ) {
      setLocations([]);
      return undefined;
    }

    const timer = setTimeout(() => {
      locationApi
        .search(
          locationSearch,
          form.delivery_district,
          form.delivery_taluka,
        )
        .then((r) => setLocations(r.suggestions || []))
        .catch(() => setLocations([]));
    }, 350);

    return () => clearTimeout(timer);
  }, [
    locationSearch,
    form.delivery_district,
    form.delivery_taluka,
    form.location_verified,
  ]);

  /*
   * If Buyer Profile already contains an operating location, resolve it to
   * coordinates instead of silently treating plain text as verified.
   */
  useEffect(() => {
    let active = true;

    async function resolveProfileLocation() {
      const data = profile.profile_data || {};
      const text = data.operating_location_text || "";

      if (
        !text ||
        form.delivery_location ||
        form.location_verified
      ) {
        return;
      }

      if (
        data.operating_latitude != null &&
        data.operating_longitude != null
      ) {
        try {
          const verified = await locationApi.reverse(
            Number(data.operating_latitude),
            Number(data.operating_longitude),
          );

          if (!active) return;

          setForm((current) => ({
            ...current,
            delivery_location:
              verified.display_name || text,
            delivery_district:
              verified.district ||
              data.operating_district ||
              current.delivery_district,
            delivery_taluka:
              verified.taluka ||
              data.operating_taluka ||
              current.delivery_taluka,
            delivery_city:
              verified.village ||
              data.operating_city ||
              current.delivery_city,
            delivery_latitude:
              verified.latitude ??
              Number(data.operating_latitude),
            delivery_longitude:
              verified.longitude ??
              Number(data.operating_longitude),
            location_source: "PROFILE_DEFAULT",
            location_verified: true,
            location_verified_at: new Date().toISOString(),
            location_accuracy_m:
              verified.accuracy_m || null,
          }));

          setLocationSearch(
            verified.display_name || text,
          );
        } catch {
          // Keep the profile text visible, but DO NOT mark it verified.
          setLocationSearch(text);
        }
      } else {
        setLocationSearch(text);
      }
    }

    resolveProfileLocation();

    return () => {
      active = false;
    };
  }, [profile]);

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
    setForm((old) => {
      const next = {
        ...old,
        [key]: value,
      };

      /* Changing the typed location invalidates the previous verification. */
      if (key === "delivery_location") {
        next.location_verified = false;
        next.location_verified_at = null;
        next.location_source = "MANUAL_SEARCH";
        next.delivery_latitude = null;
        next.delivery_longitude = null;
        next.location_accuracy_m = null;
      }

      if (key === "delivery_start_date") {
        if (
          value &&
          (!old.delivery_end_date ||
            old.delivery_end_date < value)
        ) {
          next.delivery_end_date = value;
        }
      }

      return next;
    });
    setError("");
  };

  const selectLocation = async (item) => {
    try {
      const place = await locationApi.reverse(
        item.latitude,
        item.longitude,
      );

      setForm((old) => ({
        ...old,
        delivery_location:
          place.display_name || item.display_name,
        delivery_district:
          place.district || old.delivery_district,
        delivery_taluka:
          place.taluka || old.delivery_taluka,
        delivery_city:
          place.village ||
          place.taluka ||
          old.delivery_city,
        delivery_latitude:
          place.latitude ?? item.latitude,
        delivery_longitude:
          place.longitude ?? item.longitude,
        location_source: "MANUAL_SEARCH",
        location_verified: true,
        location_verified_at: new Date().toISOString(),
        location_accuracy_m: place.accuracy_m || null,
      }));

      setLocationSearch(
        place.display_name || item.display_name,
      );
      setLocations([]);
      setError("");
      return true;
    } catch (reason) {
      setError(
        reason.message ||
          "Unable to verify that delivery location.",
      );
      return false;
    }
  };

  const verifyEnteredLocation = async () => {
    if (
      form.location_verified &&
      form.delivery_latitude != null &&
      form.delivery_longitude != null
    ) {
      return true;
    }

    const query = (
      locationSearch ||
      form.delivery_location ||
      ""
    ).trim();

    if (query.length < 2) {
      setError(
        "Enter a village, market or area and verify the delivery location before continuing.",
      );
      return false;
    }

    try {
      setError("Verifying delivery location...");

      const result = await locationApi.search(
        query,
        form.delivery_district,
        form.delivery_taluka,
      );

      const suggestion = result.suggestions?.[0];

      if (!suggestion) {
        setError(
          "AARTH could not verify this location. Select a search result or use live location.",
        );
        return false;
      }

      return await selectLocation(suggestion);
    } catch (reason) {
      setError(
        reason.message ||
          "Unable to verify the delivery location.",
      );
      return false;
    }
  };

  const captureLiveLocation = () => {
    if (!navigator.geolocation) {
      setError(
        "Live location is not supported by this browser.",
      );
      return;
    }

    setError("Acquiring live location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const verified = await locationApi.reverse(
            position.coords.latitude,
            position.coords.longitude,
          );

          setForm((old) => ({
            ...old,
            delivery_location:
              verified.display_name || old.delivery_location,
            delivery_district:
              verified.district || old.delivery_district,
            delivery_taluka:
              verified.taluka || old.delivery_taluka,
            delivery_city:
              verified.village ||
              verified.taluka ||
              old.delivery_city,
            delivery_latitude:
              position.coords.latitude,
            delivery_longitude:
              position.coords.longitude,
            location_source: "CURRENT_DEVICE",
            location_verified: true,
            location_verified_at: new Date().toISOString(),
            location_accuracy_m:
              position.coords.accuracy,
          }));

          setLocationSearch(
            verified.display_name ||
              `${position.coords.latitude}, ${position.coords.longitude}`,
          );
          setLocations([]);
          setError("");
        } catch (reason) {
          setError(
            reason.message ||
              "Unable to verify your current location.",
          );
        }
      },
      (reason) =>
        setError(
          reason.code === 1
            ? "Location permission was denied. Allow location access in the browser, then try again."
            : "Unable to capture your current location. Move to an open area and try again.",
        ),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const validDates =
    Boolean(form.delivery_start_date) &&
    Boolean(form.delivery_end_date) &&
    form.delivery_start_date <= form.delivery_end_date &&
    form.delivery_start_date >= todayDate();

  const validPriceRange =
    !form.target_price_min ||
    !form.target_price_max ||
    Number(form.target_price_max) >=
      Number(form.target_price_min);

  const valid = () =>
    Boolean(
      form.commodity_key &&
        Number(form.quantity) > 0 &&
        form.quantity_unit &&
        form.delivery_location &&
        form.delivery_district &&
        form.location_verified &&
        form.delivery_latitude !== null &&
        form.delivery_longitude !== null &&
        validDates &&
        validPriceRange,
    );

  const validateStep = async (currentStep) => {
    if (currentStep === 0) {
      if (!form.commodity_key) {
        setError("Select the commodity before continuing.");
        return false;
      }
    }

    if (currentStep === 1) {
      if (!(Number(form.quantity) > 0)) {
        setError("Enter a required quantity greater than zero.");
        return false;
      }
    }

    if (currentStep === 2) {
      const verified = await verifyEnteredLocation();
      if (!verified) return false;

      if (!form.delivery_start_date) {
        setError("Select the delivery-from date.");
        return false;
      }

      if (!form.delivery_end_date) {
        setError("Select the delivery-by date.");
        return false;
      }

      if (form.delivery_start_date < todayDate()) {
        setError("Delivery-from date cannot be in the past.");
        return false;
      }

      if (form.delivery_end_date < form.delivery_start_date) {
        setError(
          "Delivery-by date must be on or after the delivery-from date.",
        );
        return false;
      }
    }

    if (currentStep === 3 && !validPriceRange) {
      setError(
        "Maximum / preferred ceiling cannot be lower than the minimum buying price.",
      );
      return false;
    }

    setError("");
    return true;
  };

  const goNext = async () => {
    const okay = await validateStep(step);
    if (okay) setStep((value) => value + 1);
  };

  const payload = () => {
    const min =
      form.target_price_min === ""
        ? null
        : Number(form.target_price_min);
    const max =
      form.target_price_max === ""
        ? null
        : Number(form.target_price_max);

    let targetPrice =
      form.target_price === ""
        ? null
        : Number(form.target_price);

    if (targetPrice == null) {
      if (form.price_mode === "MAXIMUM") {
        targetPrice = max;
      } else if (max != null) {
        targetPrice = max;
      } else if (min != null) {
        targetPrice = min;
      }
    }

    return {
      commodity_key: form.commodity_key,
      commodity_name: form.commodity_name,
      variety: form.variety || null,
      quantity:
        form.quantity === ""
          ? null
          : Number(form.quantity),
      quantity_unit: form.quantity_unit,
      quality_grade:
        form.quality_grade || null,
      size_calibre:
        form.size_calibre || null,
      quality_requirements:
        form.quality_requirements || null,
      delivery_location:
        form.delivery_location || null,
      delivery_district:
        form.delivery_district || null,
      delivery_taluka:
        form.delivery_taluka || null,
      delivery_city:
        form.delivery_city || null,
      delivery_latitude:
        form.delivery_latitude,
      delivery_longitude:
        form.delivery_longitude,
      delivery_start_date:
        form.delivery_start_date || null,
      delivery_end_date:
        form.delivery_end_date || null,
      packaging_requirement:
        form.packaging_requirement || null,
      target_price: targetPrice,
      target_price_min: min,
      target_price_max: max,
      target_price_unit:
        form.target_price_unit,
      price_mode:
        form.price_mode,
      open_to_market_pricing:
        form.price_mode === "MARKET_LINKED",
      additional_requirements:
        form.additional_requirements || null,
    };
  };

  const save = async (publish = false) => {
    if (publish) {
      const locationOkay = await verifyEnteredLocation();
      if (!locationOkay) return;

      if (!valid()) {
        setError(
          !validDates
            ? "Delivery dates are invalid. Delivery-from must be today or later and delivery-by must be on or after delivery-from."
            : !validPriceRange
              ? "Maximum / preferred ceiling cannot be lower than the minimum buying price."
              : "Complete all required fields before publishing the requirement.",
        );
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const saved = editing
        ? await buyerRequirementApi.update(
            editing.requirement_id,
            payload(),
          )
        : await buyerRequirementApi.create(
            payload(),
          );

      if (publish) {
        await buyerRequirementApi.publish(
          saved.requirement_id,
        );
      }

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
            ? "Requirement could not be published. Please review the required fields."
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
  const start = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({
        ...empty,
        commodity_key: item.commodity_key || "",
        commodity_name: item.commodity_name || "",
        variety: item.variety || "",
        quantity: item.quantity ?? "",
        quantity_unit: item.quantity_unit || "ton",
        quality_grade: item.quality_grade || "Any",
        size_calibre: item.size_calibre || "",
        quality_requirements: item.quality_requirements || "",
        delivery_location: item.delivery_location || "",
        delivery_district: item.delivery_district || "",
        delivery_taluka: item.delivery_taluka || "",
        delivery_city: item.delivery_city || "",
        delivery_latitude: item.delivery_latitude ?? null,
        delivery_longitude: item.delivery_longitude ?? null,
        location_source: item.location_source || "MANUAL_SEARCH",
        location_verified: Boolean(item.location_verified),
        location_verified_at: item.location_verified_at || null,
        location_accuracy_m: item.location_accuracy_m || null,
        delivery_start_date: item.delivery_start_date || "",
        delivery_end_date: item.delivery_end_date || "",
        packaging_requirement: item.packaging_requirement || "No specific requirement",
        target_price: item.target_price ?? "",
        target_price_min: item.target_price_min ?? "",
        target_price_max: item.target_price_max ?? "",
        target_price_unit: item.target_price_unit || "INR_PER_QUINTAL",
        price_mode: item.price_mode || "PREFERRED_RANGE",
        open_to_market_pricing: Boolean(item.open_to_market_pricing),
        additional_requirements: item.additional_requirements || "",
      });
      setLocationSearch(item.delivery_location || "");
    } else {
      setEditing(null);
      setForm({ ...empty });
      setCropSearch("");
      setLocationSearch("");
      setLocations([]);
    }
    setError("");
    setNotice("");
    setStep(0);
  };

  const nav = (item) =>
    item === "Home"
      ? navigate("/buyer")
      : item === "Profile"
        ? navigate("/buyer")
        : item === "My Requirements"
        ? null
        : item === "Discover Lots"
          ? navigate("/buyer/discover-lots")
          : setNotice(`${item} will be available in the next Buyer workspace release.`);
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
            "Discover Lots",
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
            verifyEnteredLocation={verifyEnteredLocation}
            captureLiveLocation={captureLiveLocation}
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
    verifyEnteredLocation,
    captureLiveLocation,
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
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    update("delivery_location", e.target.value);
                  }}
                  placeholder="Village, market or area"
                />
                <div className="req-location-actions">
                  <button
                    type="button"
                    className="req-location-action"
                    onClick={verifyEnteredLocation}
                  >
                    Verify location
                  </button>
                  <button
                    type="button"
                    className="req-location-action live"
                    onClick={captureLiveLocation}
                  >
                    Use my live location
                  </button>
                </div>
                {locations.map((item) => (
                  <button
                    type="button"
                    className="req-location"
                    key={`${item.display_name}-${item.latitude}-${item.longitude}`}
                    onClick={() => selectLocation(item)}
                  >
                    {item.display_name}
                  </button>
                ))}
              </label>
              {form.delivery_location && (
                <div className={`req-verified ${form.location_verified ? "verified" : "unverified"}`}>
                  <strong>{form.location_verified ? "✓ Location verified" : "⚠ Location not yet verified"}</strong>
                  <span>{form.delivery_location}</span>
                  {form.location_verified && form.location_source === "CURRENT_DEVICE" && (
                    <small>Verified from current device location{form.location_accuracy_m ? ` · ±${Math.round(form.location_accuracy_m)} m` : ""}.</small>
                  )}
                </div>
              )}
              <div className="req-fields req-date-fields">
                <label>
                  Delivery from *
                  <input
                    type="date"
                    min={todayDate()}
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
                    min={form.delivery_start_date || todayDate()}
                    value={form.delivery_end_date}
                    onChange={(e) =>
                      update("delivery_end_date", e.target.value)
                    }
                  />
                </label>
              </div>
              {form.delivery_start_date && form.delivery_end_date && form.delivery_end_date < form.delivery_start_date && (
                <p className="req-date-error">Delivery by must be on or after Delivery from.</p>
              )}
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
                    onChange={(e) => update("packaging_requirement", e.target.value)}
                  >
                    {["No specific requirement", "Bulk / Loose", "Bags", "Crates", "Other"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>
                  Price mode
                  <select
                    value={form.price_mode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      update("price_mode", mode);
                      update("open_to_market_pricing", mode === "MARKET_LINKED");
                    }}
                  >
                    <option value="PREFERRED_RANGE">Preferred range</option>
                    <option value="MAXIMUM">Maximum buying price</option>
                    <option value="MARKET_LINKED">Use market-linked pricing</option>
                  </select>
                </label>
                <label>
                  Price unit
                  <select value={form.target_price_unit} onChange={(e) => update("target_price_unit", e.target.value)}>
                    <option value="INR_PER_KG">per Kg</option>
                    <option value="INR_PER_QUINTAL">per Quintal</option>
                    <option value="INR_PER_TON">per MT</option>
                  </select>
                </label>
                <label>
                  Minimum buying price
                  <input disabled={form.price_mode === "MARKET_LINKED"} type="number" min="0" value={form.target_price_min} onChange={(e) => update("target_price_min", e.target.value)} placeholder="Optional" />
                </label>
                <label>
                  Maximum / preferred ceiling
                  <input disabled={form.price_mode === "MARKET_LINKED"} type="number" min="0" value={form.target_price_max} onChange={(e) => update("target_price_max", e.target.value)} placeholder="Optional" />
                </label>
              </div>
              <MarketPriceAdvisor
                cropKey={form.commodity_key}
                latitude={form.delivery_latitude}
                longitude={form.delivery_longitude}
                selectedUnit={form.target_price_unit}
                onUseRange={({ min, max, modal }) => {
                  update("target_price_min", String(Math.round(min * 100) / 100));
                  update("target_price_max", String(Math.round(max * 100) / 100));
                  update("target_price", String(Math.round(modal * 100) / 100));
                  update("price_mode", "PREFERRED_RANGE");
                  update("open_to_market_pricing", false);
                }}
              />
              <p className="req-price-note">AARTH shows live MSAMB/APMC observations as a reference. You decide whether to use the suggested range, enter your own range, set a maximum, or use market-linked pricing.</p>
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
            <button className="req-primary" onClick={goNext} disabled={saving}>
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
                disabled={saving}
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
    ["Delivery location", `${form.delivery_location || "Not set"}${form.location_verified ? " · Verified" : " · Not verified"}`],
    [
      "Delivery window",
      `${dateText(form.delivery_start_date)} – ${dateText(form.delivery_end_date)}`,
    ],
    ["Packaging", form.packaging_requirement],
    [
      "Target buying price",
      form.price_mode === "MARKET_LINKED" || form.open_to_market_pricing
        ? "Market-linked pricing"
        : form.target_price_min || form.target_price_max
          ? `₹${form.target_price_min || form.target_price_max} – ₹${form.target_price_max || form.target_price_min} / ${form.target_price_unit?.replace("INR_PER_", "")}`
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
