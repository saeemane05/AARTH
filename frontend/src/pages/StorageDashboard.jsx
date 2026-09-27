import RoleProfileDashboard from "./RoleProfileDashboard";

const storageConfig = {
  slug: "storage",
  role: "STORAGE_PARTNER",
  roleLabel: "STORAGE PARTNER",
  welcome: "Storage Partner",
  accent: "#7b6a91",
  deep: "#51435f",
  soft: "#f1edf5",
  icon: "🏬",

  tagline: [
    "Secure Storage",
    "Smarter Selling Windows",
  ],

  subtitle:
    "Set up your storage profile to support farm-to-market movement.",

  formDescription:
    "Create your storage identity so AARTH can consider available facilities when comparing sell-now and storage-linked market pathways.",

  sectionTitle: "Storage Information",
  sectionIcon: "🏬",

  steps: [
    "Facility Details",
    "Location",
    "Capacity",
    "Review",
  ],

  nameFields: ["facility_name"],

  nav: [
    { label: "Profile", icon: "●" },
    { label: "Storage Requests", icon: "⌕" },
    { label: "My Facilities", icon: "▤" },
    { label: "Capacity", icon: "◫" },
    { label: "Bookings", icon: "□" },
    { label: "Operations", icon: "▦" },
    { label: "Support", icon: "?" },
  ],

  fields: [
    {
      key: "facility_name",
      label: "Facility name",
      placeholder: "Enter storage facility name",
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
        "Nashik", "Pune", "Ahmednagar", "Jalgaon",
        "Nagpur", "Amravati", "Akola", "Sangli",
        "Solapur", "Other",
      ],
    },
    {
      key: "taluka",
      label: "Taluka",
      placeholder: "Enter taluka",
      required: true,
    },
    {
      key: "village_area",
      label: "Village / area",
      placeholder: "Enter facility village or area",
      required: true,
      wide: true,
    },
    {
      key: "storage_type",
      label: "Storage type",
      placeholder: "Select storage type",
      required: true,
      type: "select",
      options: [
        "Warehouse",
        "Cold Storage",
        "Controlled Atmosphere",
        "Dry Storage",
        "Other",
      ],
    },
    {
      key: "total_capacity",
      label: "Total capacity",
      placeholder: "e.g. 100 MT",
      required: true,
    },
    {
      key: "supported_commodities",
      label: "Supported commodities",
      placeholder: "e.g. Onion, Potato, Grapes",
      required: true,
      wide: true,
    },
  ],

  tipIcon: "🌾",
  tip:
    "Accurate facility and capacity information helps AARTH evaluate storage-linked pathways without assuming that storing is always better than selling immediately.",

  visualClass: "visual-storage",
  visualImage: "https://2.wlimg.com/product_images/bc-full/2022/9/1589933/vegetable-cold-storage-services-1663758415-6550907.jpeg",
  visualIcon: "🏬",
  visualLines: [
    "Secure Storage",
    "Flexible Timing",
    "Better Coordination",
  ],

  quickIcon: "📦",
  quickTitle: "Storage foundation",
  quickText:
    "Facility, capacity, supported commodities, verification and availability can support storage matching and sell-vs-store calculations. SIH26193 demo data is used for presentation only.",
};

export default function StorageDashboard() {
  return <RoleProfileDashboard config={storageConfig} />;
}
