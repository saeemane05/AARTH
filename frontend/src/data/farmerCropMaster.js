// ============================================================
// AARTH — FARMER CROP MASTER
// ============================================================
//
// This is the farmer-profile crop vocabulary.
//
// IMPORTANT:
// Keep the same commodity vocabulary across:
// Farmer Profile
// Lot Creation
// Market Intelligence
// Matching
//
// The crop names/codes below are based on the existing
// AARTH Market Intelligence crop master.
//
// ============================================================

export const FARMER_CROP_CATEGORIES = {

  // ==========================================================
  // CEREALS & GRAINS
  // ==========================================================

  "Cereals & Grains": [
    {
      key: "sugarcane",
      name: "उस",
      code: "06003",
    },
    {
      key: "khapli_wheat",
      name: "खपली",
      code: "02012",
    },
    {
      key: "wheat",
      name: "गहू",
      code: "02009",
    },
    {
      key: "jowar",
      name: "ज्वारी",
      code: "02011",
    },
    {
      key: "rice",
      name: "तांदूळ",
      code: "02023",
    },
    {
      key: "ragi",
      name: "नाचणी/ नागली",
      code: "02016",
    },
    {
      key: "bajra",
      name: "बाजरी",
      code: "02002",
    },
    {
      key: "paddy",
      name: "भात - धान",
      code: "02007",
    },
    {
      key: "maize",
      name: "मका",
      code: "02015",
    },
  ],

  // ==========================================================
  // PULSES & LEGUMES
  // ==========================================================

  "Pulses & Legumes": [
    {
      key: "black_gram",
      name: "उडीद",
      code: "03022",
    },
    {
      key: "black_gram_dal",
      name: "उडीद डाळ",
      code: "03023",
    },
    {
      key: "horse_gram",
      name: "कुलथी",
      code: "03010",
    },
    {
      key: "cowpea_seed",
      name: "चवळी बी",
      code: "03003",
    },
    {
      key: "tur",
      name: "तूर",
      code: "03020",
    },
    {
      key: "tur_dal",
      name: "तूर डाळ",
      code: "03021",
    },
    {
      key: "peas",
      name: "मटार",
      code: "08074",
    },
    {
      key: "lentil",
      name: "मसूर",
      code: "03012",
    },
    {
      key: "lentil_dal",
      name: "मसूर डाळ",
      code: "03013",
    },
    {
      key: "green_gram",
      name: "मूग",
      code: "03016",
    },
    {
      key: "green_gram_dal",
      name: "मूग डाळ",
      code: "03017",
    },
    {
      key: "amaranth",
      name: "राजगिरा",
      code: "03019",
    },
    {
      key: "peas_dry",
      name: "वाटाणा",
      code: "03025",
    },
    {
      key: "chickpea",
      name: "हरभरा",
      code: "03006",
    },
    {
      key: "chickpea_dal",
      name: "हरभरा डाळ",
      code: "03007",
    },
  ],

  // ==========================================================
  // OILSEEDS
  // ==========================================================

  "Oilseeds": [
    {
      key: "castor",
      name: "एरंडी",
      code: "04005",
    },
    {
      key: "safflower",
      name: "करडई",
      code: "04008",
    },
    {
      key: "sesame",
      name: "तील",
      code: "04019",
    },
    {
      key: "groundnut_green",
      name: "भुईमुग शेंग (ओली)",
      code: "08085",
    },
    {
      key: "groundnut_dry",
      name: "भुईमुग शेंग (सुकी)",
      code: "04003",
    },
    {
      key: "mustard",
      name: "मोहरी",
      code: "10015",
    },
    {
      key: "groundnut",
      name: "शेंगदाणे",
      code: "04016",
    },
    {
      key: "mustard_seed",
      name: "सरसव",
      code: "02021",
    },
    {
      key: "sunflower",
      name: "सुर्यफुल",
      code: "04018",
    },
    {
      key: "soybean",
      name: "सोयाबिन",
      code: "04017",
    },
  ],

  // ==========================================================
  // VEGETABLES
  // ==========================================================

  "Vegetables": [
    {
      key: "ambadi_leaves",
      name: "अंबाडी भाजी",
      code: "08003",
    },
    {
      key: "taro",
      name: "अर्वी",
      code: "08005",
    },
    {
      key: "sorrel_leaves",
      name: "आंबट चुका",
      code: "08004",
    },
    {
      key: "iceberg_lettuce",
      name: "आईसबर्ग",
      code: "18003",
    },
    {
      key: "yam",
      name: "कंद",
      code: "08034",
    },
    {
      key: "safflower_leaves",
      name: "करडई (भाजी)",
      code: "08038",
    },
    {
      key: "onion",
      name: "कांदा",
      code: "08035",
    },
    {
      key: "onion_leaves",
      name: "कांदा पात",
      code: "08036",
    },
    {
      key: "cucumber",
      name: "काकडी",
      code: "08033",
    },
    {
      key: "bottle_gourd",
      name: "कागडा",
      code: "16015",
    },
    {
      key: "bitter_gourd",
      name: "कारली",
      code: "08039",
    },
    {
      key: "raw_banana",
      name: "केळी (कच्ची)",
      code: "08040",
    },
    {
      key: "coriander",
      name: "कोथिंबिर",
      code: "08044",
    },
    {
      key: "cabbage",
      name: "कोबी",
      code: "08041",
    },
    {
      key: "pumpkin",
      name: "कोहळा",
      code: "08043",
    },
    {
      key: "cluster_beans",
      name: "गवार",
      code: "08024",
    },
    {
      key: "carrot",
      name: "गाजर",
      code: "08022",
    },
    {
      key: "beans",
      name: "घेवडा",
      code: "08025",
    },
    {
      key: "beans_seed",
      name: "घेवडा बी",
      code: "03005",
    },
    {
      key: "ridge_gourd",
      name: "घोसाळी (भाजी)",
      code: "08026",
    },
    {
      key: "cowpea_leaves",
      name: "चवळी (पाला)",
      code: "08016",
    },
    {
      key: "cowpea_pods",
      name: "चवळी (शेंगा)",
      code: "08015",
    },
    {
      key: "cherry_tomato",
      name: "चेरी टोमॅटो",
      code: "18011",
    },
    {
      key: "zucchini",
      name: "झुचीनी",
      code: "18010",
    },
    {
      key: "tomato",
      name: "टोमॅटो",
      code: "08071",
    },
    {
      key: "capsicum",
      name: "ढोवळी मिरची",
      code: "08049",
    },
    {
      key: "ivy_gourd",
      name: "तोंडली",
      code: "08072",
    },
    {
      key: "bottle_gourd_alt",
      name: "दुधी भोपळा",
      code: "08012",
    },
    {
      key: "snake_gourd",
      name: "पडवळ",
      code: "08054",
    },
    {
      key: "spinach",
      name: "पालक",
      code: "08055",
    },
    {
      key: "mint",
      name: "पुदिना",
      code: "08060",
    },
    {
      key: "cauliflower",
      name: "फ्लॉवर",
      code: "08021",
    },
    {
      key: "potato",
      name: "बटाटा",
      code: "08007",
    },
    {
      key: "beetroot",
      name: "बीट",
      code: "08008",
    },
    {
      key: "baby_corn",
      name: "बेबी कॉर्न",
      code: "18009",
    },
    {
      key: "broccoli",
      name: "ब्रोकोली",
      code: "18004",
    },
    {
      key: "okra",
      name: "भेडी",
      code: "08009",
    },
    {
      key: "green_chilli",
      name: "मिरची (हिरवी)",
      code: "10013",
    },
    {
      key: "radish",
      name: "मुळा",
      code: "08051",
    },
    {
      key: "fenugreek_leaves",
      name: "मेथी भाजी",
      code: "08048",
    },
    {
      key: "sweet_potato",
      name: "रताळी",
      code: "08063",
    },
    {
      key: "garlic",
      name: "लसूण",
      code: "08045",
    },
    {
      key: "dry_garlic",
      name: "लसूण (सुका)",
      code: "10011",
    },
    {
      key: "brinjal",
      name: "वांगी",
      code: "08078",
    },
    {
      key: "dill",
      name: "शेपू",
      code: "08066",
    },
    {
      key: "drumstick",
      name: "शेवगा",
      code: "08067",
    },
    {
      key: "yam_elephant",
      name: "सुरण",
      code: "08069",
    },
    {
      key: "salad",
      name: "सॅलड",
      code: "08064",
    },
  ],

  // ==========================================================
  // FRUITS
  // ==========================================================

  "Fruits": [
    {
      key: "fig",
      name: "अंजीर",
      code: "07003",
    },
    {
      key: "fig_dry",
      name: "अंजीर (सुके)",
      code: "10027",
    },
    {
      key: "pineapple",
      name: "अननस",
      code: "07002",
    },
    {
      key: "avocado",
      name: "अवाकाडो",
      code: "18008",
    },
    {
      key: "mango",
      name: "आंबा",
      code: "07001",
    },
    {
      key: "amla",
      name: "आवळा",
      code: "07042",
    },
    {
      key: "watermelon",
      name: "कलिंगड",
      code: "07011",
    },
    {
      key: "cashew",
      name: "काजू",
      code: "10010",
    },
    {
      key: "raw_mango",
      name: "कालवड",
      code: "09020",
    },
    {
      key: "banana",
      name: "केळी",
      code: "07014",
    },
    {
      key: "kairi",
      name: "कैरी",
      code: "08032",
    },
    {
      key: "muskmelon",
      name: "खरबुज",
      code: "07044",
    },
    {
      key: "chickoo",
      name: "चिकु",
      code: "07006",
    },
    {
      key: "pomegranate",
      name: "डाळींब",
      code: "07007",
    },
    {
      key: "grapes",
      name: "द्राक्ष",
      code: "07008",
    },
    {
      key: "coconut",
      name: "नारळ",
      code: "04013",
    },
    {
      key: "papaya",
      name: "पपई",
      code: "07018",
    },
    {
      key: "pear",
      name: "पेअर",
      code: "07019",
    },
    {
      key: "guava",
      name: "पेरु",
      code: "07020",
    },
    {
      key: "plum",
      name: "प्लम",
      code: "07024",
    },
    {
      key: "jackfruit",
      name: "फणस",
      code: "07022",
    },
    {
      key: "almond",
      name: "बदाम",
      code: "10023",
    },
    {
      key: "raisins",
      name: "बेदाणा",
      code: "10025",
    },
    {
      key: "ber",
      name: "बोर",
      code: "07004",
    },
    {
      key: "sweet_lime",
      name: "मोसंबी",
      code: "07016",
    },
    {
      key: "custard_apple",
      name: "रामफळ",
      code: "07025",
    },
    {
      key: "lemon",
      name: "लिंबू",
      code: "07015",
    },
    {
      key: "coconut_water",
      name: "शहाळे",
      code: "07047",
    },
    {
      key: "orange",
      name: "संत्री",
      code: "07027",
    },
    {
      key: "apple",
      name: "सफरचंद",
      code: "07026",
    },
    {
      key: "custard_apple_alt",
      name: "सिताफळ",
      code: "07028",
    },
    {
      key: "betel_nut",
      name: "सुपारी",
      code: "10017",
    },
    {
      key: "strawberry",
      name: "स्ट्रॉबेरी",
      code: "07029",
    },
  ],

  // ==========================================================
  // SPICES & CONDIMENTS
  // ==========================================================

  "Spices & Condiments": [
    {
      key: "ginger",
      name: "आले",
      code: "08002",
    },
    {
      key: "dry_ginger",
      name: "आले (सुंठ)",
      code: "10001",
    },
    {
      key: "carom",
      name: "ओवा",
      code: "04014",
    },
    {
      key: "curry_leaves",
      name: "कढिपत्ता",
      code: "08031",
    },
    {
      key: "cumin",
      name: "जिरे",
      code: "10009",
    },
    {
      key: "cinnamon",
      name: "दालचिनी",
      code: "10022",
    },
    {
      key: "coriander_seed",
      name: "धने",
      code: "10005",
    },
    {
      key: "fennel",
      name: "बडिशेप",
      code: "04002",
    },
    {
      key: "red_chilli",
      name: "मिरची (लाल)",
      code: "10014",
    },
    {
      key: "black_pepper",
      name: "मिरे",
      code: "10020",
    },
    {
      key: "fenugreek_seed",
      name: "मेथी बी",
      code: "10012",
    },
    {
      key: "cardamom",
      name: "वेलची",
      code: "10018",
    },
    {
      key: "turmeric",
      name: "हळद/ हळकुंड",
      code: "10006",
    },
  ],

  // ==========================================================
  // FLOWERS
  // ==========================================================

  "Flowers": [
    {
      key: "aster",
      name: "अस्टर",
      code: "16001",
    },
    {
      key: "carnation",
      name: "कार्नेशन",
      code: "16035",
    },
    {
      key: "rose",
      name: "गुलाब",
      code: "16003",
    },
    {
      key: "gladiolus",
      name: "ग्लॅडीओ",
      code: "16025",
    },
    {
      key: "marigold",
      name: "झेंडू",
      code: "16009",
    },
    {
      key: "jasmine",
      name: "मोगरा",
      code: "16014",
    },
    {
      key: "chrysanthemum",
      name: "शेवंती",
      code: "16007",
    },
  ],

  // ==========================================================
  // OTHER MARKET COMMODITIES
  // ==========================================================

  "Other Market Commodities": [
    {
      key: "cotton",
      name: "कापूस",
      code: "01001",
    },
    {
      key: "jaggery",
      name: "गुळ",
      code: "06001",
    },
    {
      key: "sugar",
      name: "साखर",
      code: "06002",
    },
    {
      key: "sago",
      name: "साबुदाणा",
      code: "02006",
    },
  ],
};


// ============================================================
// FLAT CROP LIST
// ============================================================

export const ALL_AARTH_CROPS =
  Object.values(FARMER_CROP_CATEGORIES).flat();


// ============================================================
// CATEGORY LIST
// ============================================================

export const AARTH_CROP_CATEGORIES =
  Object.keys(FARMER_CROP_CATEGORIES);


// ============================================================
// FIND CROP
// ============================================================

export function findAarthCrop(cropKey) {
  return ALL_AARTH_CROPS.find(
    (crop) => crop.key === cropKey
  );
}


// ============================================================
// SEARCH CROPS
// ============================================================

export function searchAarthCrops(searchTerm = "") {

  const query = searchTerm
    .trim()
    .toLowerCase();

  if (!query) {
    return ALL_AARTH_CROPS;
  }

  return ALL_AARTH_CROPS.filter((crop) => {

    return (
      crop.name.toLowerCase().includes(query) ||
      crop.key.toLowerCase().includes(query) ||
      crop.code.includes(query)
    );

  });
}


// ============================================================
// GET CATEGORY
// ============================================================

export function getAarthCropCategory(cropKey) {

  for (const [category, crops] of Object.entries(
    FARMER_CROP_CATEGORIES
  )) {

    if (
      crops.some(
        (crop) => crop.key === cropKey
      )
    ) {
      return category;
    }
  }

  return null;
}