import RoleProfileDashboard from "./RoleProfileDashboard";

const fpoConfig = {
  slug: "fpo",
  role: "FPO",
  roleLabel: "FPO",
  welcome: "FPO",
  accent: "#8a6f5a",
  deep: "#5f4b3d",
  soft: "#f4eee8",
  icon: "🌾",

  tagline: [
    "Collective Strength",
    "Better Market Access",
  ],

  subtitle:
    "Build your FPO profile to manage aggregation and market linkages.",

  formDescription:
    "Create your FPO identity so AARTH can connect your member supply with suitable buyers and market opportunities.",

  sectionTitle: "FPO Information",
  sectionIcon: "🏛️",

  steps: [
    "FPO Details",
    "Location",
    "Operations",
    "Review",
  ],

  nameFields: ["fpo_name"],

  nav: [
    { label: "Profile", icon: "●" },
    { label: "Member Supply", icon: "♧" },
    { label: "Create Lots", icon: "▤" },
    { label: "Buyer Requests", icon: "⌕" },
    { label: "Market Insights", icon: "⌁" },
    { label: "Support", icon: "?" },
  ],

  fields: [
    {
      key: "fpo_name",
      label: "FPO name",
      placeholder: "Enter registered FPO name",
      required: true,
      wide: true,
    },
    {
      key: "registration_number",
      label: "Registration number",
      placeholder: "Enter FPO registration number",
      required: true,
    },
    {
      key: "registration_date",
      label: "Registration date",
      placeholder: "Select registration date",
      required: true,
      type: "date",
    },
    {
      key: "member_count",
      label: "Number of members",
      placeholder: "Enter member count",
      required: true,
      type: "number",
    },
    {
      key: "district",
      label: "District",
      placeholder: "Select district",
      required: true,
      type: "select",
      options: [
        "Nashik", "Pune", "Ahmednagar", "Jalgaon",
        "Sangli", "Satara", "Kolhapur", "Nagpur",
        "Amravati", "Akola", "Yavatmal", "Other",
      ],
    },
    {
      key: "taluka",
      label: "Taluka",
      placeholder: "Enter taluka",
      required: true,
    },
    {
      key: "headquarters_village",
      label: "Headquarters / village",
      placeholder: "Enter headquarters village or town",
      required: true,
      wide: true,
    },
    {
      key: "crops_handled",
      label: "Crops handled",
      placeholder: "e.g. Onion, Grapes, Soybean",
      required: true,
      wide: true,
    },
  ],

  tipIcon: "🤝",
  tip:
    "A complete FPO profile helps AARTH understand your aggregation capacity and connect collective supply with suitable demand.",

  visualClass: "visual-fpo",
  visualIcon: "🌾",
  visualLines: [
    "Collective Supply",
    "Stronger Negotiation",
    "Better Market Linkages",
  ],

  quickIcon: "📦",
  quickTitle: "FPO market foundation",
  quickText:
    "Member supply, lot aggregation and buyer matching can build on this verified FPO identity.",
};

export default function FpoDashboard() {
  return <RoleProfileDashboard config={fpoConfig} />;
}
