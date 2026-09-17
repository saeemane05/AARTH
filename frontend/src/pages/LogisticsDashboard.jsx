import RoleProfileDashboard from "./RoleProfileDashboard";

const logisticsConfig = {
  slug: "logistics",
  role: "LOGISTICS_PARTNER",
  roleLabel: "LOGISTICS PARTNER",
  welcome: "Logistics Partner",
  accent: "#737783",
  deep: "#555862",
  soft: "#f0f1f3",
  icon: "🚚",

  tagline: [
    "Reliable Movement",
    "Connected Supply Chains",
  ],

  subtitle:
    "Set up your logistics profile to support agricultural movement.",

  formDescription:
    "Create your logistics identity so AARTH can consider your service area, vehicle capacity and availability during transaction coordination.",

  sectionTitle: "Logistics Information",
  sectionIcon: "🚚",

  steps: [
    "Business Details",
    "Service Area",
    "Vehicle Capacity",
    "Review",
  ],

  nameFields: ["business_name"],

  nav: [
    { label: "Profile", icon: "●" },
    { label: "Transport Requests", icon: "⌕" },
    { label: "My Vehicles", icon: "▣" },
    { label: "Active Trips", icon: "➜" },
    { label: "History", icon: "◷" },
    { label: "Support", icon: "?" },
  ],

  fields: [
    {
      key: "business_name",
      label: "Business name",
      placeholder: "Enter business or operator name",
      required: true,
      wide: true,
    },
    {
      key: "phone_number",
      label: "Phone number",
      placeholder: "+91 XXXXX XXXXX",
      required: true,
      type: "tel",
    },
    {
      key: "district",
      label: "District",
      placeholder: "Select district",
      required: true,
      type: "select",
      options: [
        "Pune", "Nashik", "Ahmednagar", "Jalgaon",
        "Mumbai", "Nagpur", "Sangli", "Satara",
        "Solapur", "Amravati", "Other",
      ],
    },
    {
      key: "city",
      label: "City / town",
      placeholder: "Enter city or town",
      required: true,
    },
    {
      key: "service_area",
      label: "Service area",
      placeholder: "e.g. Nashik–Pune, Nashik–Mumbai",
      required: true,
      wide: true,
    },
    {
      key: "vehicle_details",
      label: "Vehicle details",
      placeholder: "e.g. 2 trucks, 10 MT each",
      required: true,
      wide: true,
    },
    {
      key: "capacity",
      label: "Typical capacity",
      placeholder: "e.g. 10 MT",
      required: true,
    },
  ],

  tipIcon: "🛣️",
  tip:
    "Accurate service and capacity information helps AARTH consider feasible transport options alongside agricultural sourcing decisions.",

  visualClass: "visual-logistics",
  visualIcon: "🚚",
  visualLines: [
    "Farm Pickup",
    "Reliable Movement",
    "Timely Delivery",
  ],

  quickIcon: "📍",
  quickTitle: "Logistics foundation",
  quickText:
    "Vehicle, capacity and service-area details can later support route and transport matching.",
};

export default function LogisticsDashboard() {
  return <RoleProfileDashboard config={logisticsConfig} />;
}
