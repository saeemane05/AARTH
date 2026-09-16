import RoleProfileDashboard from "./RoleProfileDashboard";

const farmerConfig = {
  slug: "farmer",

  role: "FARMER",
  roleLabel: "FARMER",

  welcome: "Farmer",

  accent: "#08723d",
  deep: "#064c29",
  soft: "#eaf7ef",

  icon: "🌾",

  tagline: [
    "Stronger Farmers",
    "Brighter Markets",
  ],

  subtitle:
    "Let's set up your profile to get started.",

  formDescription:
    "Tell us about yourself and your farm so AARTH can connect you with relevant market opportunities.",

  sectionTitle:
    "Basic Information",

  sectionIcon: "👨‍🌾",

  steps: [
    "Profile Details",
    "Farm & Production",
    "Review",
    "Submit",
  ],

  nameFields: [
    "full_name",
  ],

  nav: [
    {
      label: "Profile",
      icon: "●",
    },
    {
      label: "Market Insights",
      icon: "⌁",
    },
    {
      label: "My Lots",
      icon: "▤",
    },
    {
      label: "Advisories",
      icon: "✦",
    },
    {
      label: "Weather",
      icon: "☼",
    },
    {
      label: "Support",
      icon: "?",
    },
  ],

  fields: [
    {
      key: "full_name",
      label: "Full name",
      placeholder:
        "Enter your full name",
      required: true,
    },

    {
      key: "phone_number",
      label: "Phone number",
      placeholder:
        "+91 XXXXX XXXXX",
      required: true,
      type: "tel",
    },

    {
      key: "district",
      label: "District",
      placeholder:
        "Select district",
      required: true,
      type: "select",
      options: [
        "Nashik",
        "Pune",
        "Ahmednagar",
        "Jalgaon",
        "Dhule",
        "Nandurbar",
        "Sangli",
        "Satara",
        "Kolhapur",
        "Solapur",
        "Other",
      ],
    },

    {
      key: "taluka",
      label: "Taluka",
      placeholder:
        "Select taluka",
      required: true,
      type: "select",
      options: [
        "Dindori",
        "Niphad",
        "Sinnar",
        "Yeola",
        "Malegaon",
        "Other",
      ],
    },

    {
      key: "village",
      label: "Village",
      placeholder:
        "Enter village name",
      required: true,
    },

    {
      key: "crops_grown",
      label: "Crops grown",
      placeholder:
        "e.g. Onion, Grapes, Tomato",
      required: true,
      wide: true,
    },

    {
      key: "land_production_info",
      label:
        "Land / Production information",
      placeholder:
        "e.g. 5 acres / seasonal production",
      required: true,
      wide: true,
    },
  ],

  tipIcon: "💡",

  tip:
    "Your basic farm information helps AARTH understand your location and production context.",

  visualClass:
    "visual-farmer",

  visualIcon: "🌾",

  visualLines: [
    "Your Farm",
    "Our Support",
    "A Brighter Tomorrow",
  ],

  quickIcon: "🌱",

  quickTitle:
    "Build your farmer profile",

  quickText:
    "Complete your basic details before creating lots and exploring market opportunities.",
};

export default function FarmerDashboard() {
  return (
    <RoleProfileDashboard
      config={farmerConfig}
    />
  );
}