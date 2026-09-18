import RoleProfileDashboard from "./RoleProfileDashboard";

import { FARMER_CROP_CATEGORIES } from "../data/farmerCropMaster";
import {
  MAHARASHTRA_DISTRICTS,
  MAHARASHTRA_TALUKAS,
} from "../data/maharashtraLocations";

const farmerConfig = {
  slug: "farmer",

  role: "FARMER",
  roleLabel: "FARMER",

  welcome: "Farmer",

  accent: "#159c91",
  deep: "#0b5d58",
  soft: "#e9f7f5",

  icon: "🌿",

  tagline: [
    "Farmers",
    "Markets",
    "Opportunities",
  ],

  subtitle:
    "Build your farmer profile to connect with relevant AARTH opportunities.",

  formDescription:
    "Tell us about yourself and your farm. This profile is visible to relevant AARTH participants and helps them understand your agricultural background before you create a lot.",

  sectionTitle:
    "Basic Information",

  sectionIcon: "👨‍🌾",

  steps: [
    "Personal & Location",
    "Farm Profile",
    "Review & Publish",
  ],

  nameFields: [
    "full_name",
  ],

  nav: [
    {
      label: "Home",
      icon: "home",
    },
    {
      label: "Profile",
      icon: "user",
    },
    {
      label: "Market Insights",
      icon: "chart",
    },
    {
      label: "My Lots",
      icon: "box",
    },
    {
      label: "Buyers",
      icon: "users",
    },
    {
      label: "Advisories",
      icon: "book",
    },
    {
      label: "Weather",
      icon: "cloud",
    },
    {
      label: "Support",
      icon: "headset",
    },
  ],

  fields: [
    {
      key: "full_name",
      label: "Full name",
      placeholder:
        "Enter your full name",
      required: true,
      step: 0,
    },

    {
      key: "phone_number",
      label: "Phone number",
      placeholder:
        "+91 XXXXX XXXXX",
      required: true,
      type: "tel",
      step: 0,
    },

    {
      key: "district",
      label: "District",
      placeholder:
        "Select district",
      required: true,
      type: "select",
      step: 0,
      options: [
        ...MAHARASHTRA_DISTRICTS.map(
          (item) => item.name
        ),
      ],
    },

    {
      key: "taluka",
      label: "Taluka",
      placeholder:
        "Select taluka",
      required: true,
      type: "select",
      step: 0,
      optionsByParent: MAHARASHTRA_TALUKAS,
      dependsOn: "district",
      icon: "map-pin",
    },

    {
      key: "village",
      label: "Village",
      placeholder:
        "Enter village name",
      required: true,
      step: 0,
      type: "village-search",
      icon: "landmark",
      wide: true,
    },

    {
      key: "crops_grown",
      label: "Crops grown",
      placeholder:
        "e.g. Onion, Grapes, Tomato",
      required: true,
      wide: true,
      step: 1,
      type: "crop-multi-select",
      icon: "sprout",
      categories: FARMER_CROP_CATEGORIES,
    },

    {
      key: "land_size",
      label: "Farm / land size (hectares)",
      placeholder: "Select farm size",
      required: true,
      type: "select",
      step: 1,
      options: [
        "Less than 0.5 hectare",
        "0.5 – 2 hectares",
        "2 – 5 hectares",
        "5 – 10 hectares",
        "10+ hectares",
      ],
      icon: "land",
      wide: true,
    },

    {
      key: "cultivation_type",
      label: "Cultivation type",
      placeholder: "Select cultivation type",
      required: true,
      type: "select",
      step: 1,
      options: ["Irrigated", "Rainfed", "Both"],
      icon: "droplets",
    },

    {
      key: "fpo_membership",
      label: "FPO / Cooperative association",
      placeholder: "Select",
      required: false,
      type: "select",
      step: 1,
      options: ["Yes", "No"],
      icon: "users",
    },

    {
      key: "storage_access",
      label: "Storage access",
      placeholder: "Select storage access",
      required: true,
      type: "select",
      step: 1,
      options: ["Available", "Not Available"],
      icon: "warehouse",
    },
  ],

  tipIcon: "💡",

  tip:
    "Your farmer profile works like an agricultural resume. Other relevant AARTH participants can understand your farm background before interacting with your lots.",

  visualClass:
    "visual-farmer",

  visualImage:
    "/farmer-apmc-market.png",

  visualIcon: "🌾",

  visualLines: [
    "Maharashtra Farmers",
    "Better Market Linkages",
    "AARTH",
  ],

  quickIcon: "sprout",

  quickTitle:
    "Maharashtra-first farmer profile",

  quickText:
    "District, taluka, village and agricultural profile are structured around Maharashtra's administrative and market context.",
};

export default function FarmerDashboard() {
  return (
    <RoleProfileDashboard
      config={farmerConfig}
    />
  );
}