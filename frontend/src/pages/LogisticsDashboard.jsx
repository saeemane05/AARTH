import { useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { MAHARASHTRA_DISTRICTS } from "../data/maharashtraLocations";
import "./BuyerRequirementPage.css";

const blank = {
  business_name: "",
  partner_type: "",
  contact_person_name: "",
  phone_number: "",
  email_address: "",
  business_address: "",
  district: "",
  city: "",
  pin_code: "",
  primary_operating_district: "",
  service_coverage: "",
  districts_served: [],
  common_routes: "",
  operating_availability: "",
  notice_period: "",
  vehicle_types: [],
  typical_capacity_value: "",
  typical_capacity_unit: "ton",
  commodities_handled: "",
  cargo_types: "",
  special_handling: "",
  loading_unloading_support: "",
  gstin: "",
  gstin_status: "NOT_VERIFIED",
};
const types = [
    "Fleet Owner",
    "Transport Company",
    "Individual Truck Owner",
    "Transport Operator",
    "Broker / Transport Agent",
    "Cooperative / FPO Transport Unit",
    "Other",
  ],
  vehicles = [
    "Mini Truck",
    "Pickup",
    "LCV",
    "Medium Goods Vehicle",
    "Heavy Goods Vehicle",
    "Truck",
    "Trailer",
    "Refrigerated Vehicle",
    "Insulated Vehicle",
    "Other",
  ];
const api = async (path, options = {}) => {
  const session = authApi.getSession();
  const res = await fetch(
    `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
      },
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || "Request failed.");
  return body;
};
export default function LogisticsDashboard() {
  const [profile, setProfile] = useState(null),
    [form, setForm] = useState(blank),
    [step, setStep] = useState(0),
    [notice, setNotice] = useState(""),
    [vehiclesList, setVehicles] = useState([]),
    [vehicle, setVehicle] = useState({
      registration_number: "",
      vehicle_type: "",
      capacity_value: "",
      capacity_unit: "ton",
    });
  useEffect(() => {
    authApi
      .me()
      .then((p) => {
        setProfile(p);
        setForm({
          ...blank,
          ...p.profile_data,
          phone_number: p.profile_data?.phone_number || p.phone || "",
          email_address: p.profile_data?.email_address || p.email || "",
        });
        return api("/api/logistics/vehicles");
      })
      .then((r) => setVehicles(r.vehicles || []))
      .catch((e) => setNotice(e.message));
  }, []);
  const update = (key, value) => setForm((x) => ({ ...x, [key]: value }));
  const toggle = (key, value) =>
    update(
      key,
      (form[key] || []).includes(value)
        ? form[key].filter((x) => x !== value)
        : [...(form[key] || []), value],
    );
  const required = [
    [
      "business_name",
      "partner_type",
      "contact_person_name",
      "phone_number",
      "email_address",
      "business_address",
      "district",
      "city",
      "pin_code",
    ],
    ["primary_operating_district", "service_coverage"],
    ["vehicle_types", "typical_capacity_value"],
  ];
  const ready = useMemo(
    () =>
      required
        .flat()
        .filter((k) =>
          Array.isArray(form[k])
            ? !form[k].length
            : !String(form[k] || "").trim(),
        ).length,
    [form],
  );
  const save = async (next = false) => {
    try {
      await authApi.saveProfile(form);
      setNotice(
        next
          ? "Saved. Continue with the next section."
          : "Logistics profile draft saved.",
      );
      if (next) setStep((s) => Math.min(3, s + 1));
    } catch (e) {
      setNotice(e.message || "Could not save profile.");
    }
  };
  const addVehicle = async () => {
    try {
      const saved = await api("/api/logistics/vehicles", {
        method: "POST",
        body: JSON.stringify({
          ...vehicle,
          capacity_value: Number(vehicle.capacity_value),
        }),
      });
      setVehicles((x) => [saved, ...x]);
      setVehicle({
        registration_number: "",
        vehicle_type: "",
        capacity_value: "",
        capacity_unit: "ton",
      });
    } catch (e) {
      setNotice(e.message || "Could not save vehicle.");
    }
  };
  if (!profile)
    return (
      <div className="requirements-shell">
        <main className="requirements-main">Loading logistics profile…</main>
      </div>
    );
  return (
    <div className="requirements-shell">
      <header className="requirements-nav">
        <button className="requirements-brand">AARTH</button>
        <nav>
          {[
            "Home",
            "Profile",
            "Transport Requests",
            "My Vehicles",
            "Active Trips",
            "History",
            "Support",
          ].map((x) => (
            <button className={x === "Profile" ? "active" : ""} key={x}>
              {x}
            </button>
          ))}
        </nav>
      </header>
      <main className="requirements-main">
        <section className="requirements-hero">
          <div>
            <small>AARTH · LOGISTICS PARTNER</small>
            <h1>Logistics Profile</h1>
            <p>
              Set up your agricultural transport capability, service network and
              vehicles.
            </p>
          </div>
          <b>
            {ready
              ? `${ready} required details pending`
              : "Business profile complete"}
          </b>
        </section>
        <section className="req-form">
          <div className="req-steps">
            {[
              "Business identity",
              "Service network",
              "Transport capability",
              "GST & review",
            ].map((x, i) => (
              <button
                onClick={() => setStep(i)}
                className={step === i ? "active" : ""}
                key={x}
              >
                <i>{i + 1}</i>
                {x}
              </button>
            ))}
          </div>
          <div className="req-body">
            {step === 0 && (
              <>
                <h2>Business identity</h2>
                <Fields
                  values={form}
                  update={update}
                  fields={[
                    "business_name",
                    "contact_person_name",
                    "phone_number",
                    "email_address",
                    "business_address",
                    "city",
                    "pin_code",
                  ]}
                />
                <label>
                  Partner type *
                  <select
                    value={form.partner_type}
                    onChange={(e) => update("partner_type", e.target.value)}
                  >
                    <option value="">Select type</option>
                    {types.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  District *
                  <select
                    value={form.district}
                    onChange={(e) => update("district", e.target.value)}
                  >
                    <option value="">Select district</option>
                    {MAHARASHTRA_DISTRICTS.map((x) => (
                      <option key={x.name || x}>{x.name || x}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <h2>Service network</h2>
                <label>
                  Primary operating district *
                  <select
                    value={form.primary_operating_district}
                    onChange={(e) =>
                      update("primary_operating_district", e.target.value)
                    }
                  >
                    <option value="">Select district</option>
                    {MAHARASHTRA_DISTRICTS.map((x) => (
                      <option key={x.name || x}>{x.name || x}</option>
                    ))}
                  </select>
                </label>
                <Fields
                  values={form}
                  update={update}
                  fields={[
                    "service_coverage",
                    "common_routes",
                    "operating_availability",
                    "notice_period",
                  ]}
                />
              </>
            )}
            {step === 2 && (
              <>
                <h2>Transport capability</h2>
                <label>
                  Vehicle types *
                  <div className="req-chips">
                    {vehicles.map((x) => (
                      <button
                        type="button"
                        key={x}
                        className={
                          form.vehicle_types.includes(x) ? "selected" : ""
                        }
                        onClick={() => toggle("vehicle_types", x)}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                </label>
                <Fields
                  values={form}
                  update={update}
                  fields={[
                    "typical_capacity_value",
                    "commodities_handled",
                    "cargo_types",
                    "special_handling",
                    "loading_unloading_support",
                  ]}
                />
                <label>
                  Capacity unit
                  <select
                    value={form.typical_capacity_unit}
                    onChange={(e) =>
                      update("typical_capacity_unit", e.target.value)
                    }
                  >
                    <option value="kg">Kg</option>
                    <option value="quintal">Quintal</option>
                    <option value="ton">Tonne</option>
                  </select>
                </label>
              </>
            )}
            {step === 3 && (
              <>
                <h2>GSTIN verification</h2>
                <label>
                  GSTIN (optional)
                  <input
                    value={form.gstin}
                    maxLength="15"
                    onChange={(e) =>
                      update("gstin", e.target.value.toUpperCase())
                    }
                    placeholder="15-character GSTIN"
                  />
                </label>
                <p className="req-verified">
                  {form.gstin_status === "VERIFIED"
                    ? "GSTIN Verified"
                    : "GSTIN Not Verified"}
                </p>
                <h2>My vehicles</h2>
                <Fields
                  values={vehicle}
                  update={(k, v) => setVehicle((x) => ({ ...x, [k]: v }))}
                  fields={[
                    "registration_number",
                    "vehicle_type",
                    "capacity_value",
                  ]}
                />
                <button className="req-primary" onClick={addVehicle}>
                  Add vehicle
                </button>
                {vehiclesList.map((x) => (
                  <p key={x.id}>
                    {x.registration_number} · {x.vehicle_type} ·{" "}
                    {x.capacity_value} {x.capacity_unit} · {x.document_status}
                  </p>
                ))}
              </>
            )}
          </div>
          <footer className="req-footer">
            <button onClick={() => save(false)}>Save as Draft</button>
            <button
              className="req-primary"
              onClick={() => (step < 3 ? save(true) : save(false))}
            >
              {step < 3 ? "Save & Continue" : "Complete Profile"}
            </button>
          </footer>
        </section>
        {notice && <div className="req-message error">{notice}</div>}
      </main>
    </div>
  );
}
function Fields({ values, update, fields }) {
  return (
    <div className="req-fields">
      {fields.map((key) => (
        <label key={key}>
          {key.replaceAll("_", " ")}
          <input
            value={values[key] || ""}
            type={key.includes("capacity") ? "number" : "text"}
            onChange={(e) => update(key, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
