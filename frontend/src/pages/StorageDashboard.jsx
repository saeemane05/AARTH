import RoleProfileDashboard from "./RoleProfileDashboard";

const buyerConfig = {
  slug: "buyer",

  role: "BUYER",
  roleLabel: "BUYER",

  welcome: "Buyer",

  accent: "#0957d5",
  deep: "#073578",
  soft: "#edf4ff",

  icon: "🏢",

  tagline: [
    "Reliable Partnerships",
    "Stronger Supply Chains",
  ],

  subtitle:
    "Let's set up your profile to start sourcing.",

  formDescription:
    "Create your business identity so AARTH can connect your organization with relevant agricultural suppliers.",

  sectionTitle:
    "Business Information",

  sectionIcon: "🏢",

  steps: [
    "Business Details",
    "Location",
    "Organization",
    "Review",
  ],

  nameFields: [
    "business_name",
  ],

  nav: [
    {
      label: "Profile",
      icon: "●",
    },
    {
      label: "Search Produce",
      icon: "⌕",
    },
    {
      label: "My Requirements",
      icon: "▤",
    },
    {
      label: "Orders",
      icon: "□",
    },
    {
      label: "Supplier Network",
      icon: "♧",
    },
    {
      label: "Support",
      icon: "?",
    },
  ],

  fields: [
    {
      key: "business_name",
      label: "Business name",
      placeholder:
        "Enter registered business name",
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
      key: "buyer_type",
      label: "Buyer type",
      placeholder: "Select buyer type",
      required: true,
      type: "select",
      options: [
        "Processor / Manufacturer",
        "Wholesaler",
        "Retailer",
        "Exporter",
        "Institutional Buyer",
        "Other",
      ],
    },

    {
      key: "gst_number",
      label: "GST number",
      placeholder:
        "GST number (optional)",
      required: false,
    },

    {
      key: "district",
      label: "District",
      placeholder: "Select district",
      required: true,
      type: "select",
      options: [
        "Pune",
        "Nashik",
        "Ahmednagar",
        "Mumbai",
        "Nagpur",
        "Aurangabad",
        "Jalgaon",
        "Other",
      ],
    },

    {
      key: "city",
      label: "City",
      placeholder: "Enter city",
      required: true,
    },
  ],

  tipIcon: "🔎",

  tip:
    "A complete buyer profile makes it easier to discover relevant suppliers and build reliable sourcing relationships.",

  visualClass: "visual-buyer",

  visualIcon: "🤝",

  visualLines: [
    "Quality Supply",
    "Stronger Businesses",
    "Thriving Together",
  ],

  quickIcon: "📦",

  quickTitle:
    "Buyer profile foundation",

  quickText:
    "Requirements, orders and supplier matching can build on this verified business identity.",

  dashboardPathForRole: (role) => {
    const paths = {
      FARMER: "/farmer",
      FPO: "/fpo",
      BUYER: "/buyer",
      LOGISTICS_PARTNER:
        "/logistics-partner",
      STORAGE_PARTNER:
        "/storage-partner",
    };

    return paths[role] || "/login";
  },
};

export default function BuyerDashboard() {
  return (
    <RoleProfileDashboard
      config={buyerConfig}
    />
  );
}