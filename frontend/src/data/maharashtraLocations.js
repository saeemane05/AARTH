// ============================================================

// AARTH — Maharashtra Location Master

// ============================================================

//

// Maharashtra-first implementation for AARTH Farmer Profiles.

//

// District list and taluka mapping are maintained separately

// so the UI can implement:

//

// District → Taluka → Village

//

// IMPORTANT:

// Do NOT hard-code tens of thousands of villages into the

// React bundle. The village selector should use a searchable

// official Maharashtra / LGD / Common Village Master source.

//

// ============================================================



export const MAHARASHTRA_DISTRICTS = [

  {

    name: "Ahilyanagar",

    marathi: "अहिल्यानगर",

  },

  {

    name: "Akola",

    marathi: "अकोला",

  },

  {

    name: "Amravati",

    marathi: "अमरावती",

  },

  {

    name: "Chhatrapati Sambhajinagar",

    marathi: "छत्रपती संभाजीनगर",

  },

  {

    name: "Beed",

    marathi: "बीड",

  },

  {

    name: "Bhandara",

    marathi: "भंडारा",

  },

  {

    name: "Buldhana",

    marathi: "बुलढाणा",

  },

  {

    name: "Chandrapur",

    marathi: "चंद्रपूर",

  },

  {

    name: "Dhule",

    marathi: "धुळे",

  },

  {

    name: "Gadchiroli",

    marathi: "गडचिरोली",

  },

  {

    name: "Gondia",

    marathi: "गोंदिया",

  },

  {

    name: "Hingoli",

    marathi: "हिंगोली",

  },

  {

    name: "Jalgaon",

    marathi: "जळगाव",

  },

  {

    name: "Jalna",

    marathi: "जालना",

  },

  {

    name: "Kolhapur",

    marathi: "कोल्हापूर",

  },

  {

    name: "Latur",

    marathi: "लातूर",

  },

  {

    name: "Mumbai",

    marathi: "मुंबई",

  },

  {

    name: "Mumbai Suburban",

    marathi: "मुंबई उपनगर",

  },

  {

    name: "Nagpur",

    marathi: "नागपूर",

  },

  {

    name: "Nanded",

    marathi: "नांदेड",

  },

  {

    name: "Nandurbar",

    marathi: "नंदूरबार",

  },

  {

    name: "Nashik",

    marathi: "नाशिक",

  },

  {

    name: "Dharashiv",

    marathi: "धाराशिव",

  },

  {

    name: "Parbhani",

    marathi: "परभणी",

  },

  {

    name: "Pune",

    marathi: "पुणे",

  },

  {

    name: "Raigad",

    marathi: "रायगड",

  },

  {

    name: "Ratnagiri",

    marathi: "रत्नागिरी",

  },

  {

    name: "Sangli",

    marathi: "सांगली",

  },

  {

    name: "Satara",

    marathi: "सातारा",

  },

  {

    name: "Sindhudurg",

    marathi: "सिंधुदुर्ग",

  },

  {

    name: "Solapur",

    marathi: "सोलापूर",

  },

  {

    name: "Thane",

    marathi: "ठाणे",

  },

  {

    name: "Wardha",

    marathi: "वर्धा",

  },

  {

    name: "Washim",

    marathi: "वाशिम",

  },

  {

    name: "Yavatmal",

    marathi: "यवतमाळ",

  },

  {

    name: "Palghar",

    marathi: "पालघर",

  },

];





// ============================================================

// TALUKAS

// ============================================================



export const MAHARASHTRA_TALUKAS = {

  Ahilyanagar: [

    "Ahilyanagar",

    "Akole",

    "Jamkhed",

    "Karjat",

    "Kopargaon",

    "Nevasa",

    "Parner",

    "Pathardi",

    "Rahata",

    "Rahuri",

    "Sangamner",

    "Shevgaon",

    "Shrigonda",

    "Shrirampur",

  ],



  Akola: [

    "Akola",

    "Akot",

    "Balapur",

    "Barshitakli",

    "Murtizapur",

    "Patur",

    "Telhara",

  ],



  Amravati: [

    "Achalpur",

    "Amravati",

    "Anjangaon Surji",

    "Bhatkuli",

    "Chandur Railway",

    "Chandurbazar",

    "Chikhaldara",

    "Daryapur",

    "Dhamangaon Railway",

    "Dharni",

    "Morshi",

    "Nandgaon-Khandeshwar",

    "Teosa",

    "Warud",

  ],



  "Chhatrapati Sambhajinagar": [

    "Chhatrapati Sambhajinagar",

    "Gangapur",

    "Kannad",

    "Khuldabad",

    "Paithan",

    "Phulambri",

    "Sillod",

    "Soegaon",

    "Vaijapur",

  ],



  Beed: [

    "Ambejogai",

    "Ashti",

    "Beed",

    "Dharur",

    "Georai",

    "Kaij",

    "Majalgaon",

    "Parli",

    "Patoda",

    "Shirur (Kasar)",

    "Wadwani",

  ],



  Bhandara: [

    "Bhandara",

    "Mohadi",

    "Pauni",

    "Tumsar",

    "Sakoli",

    "Lakhani",

    "Lakhandur",

  ],



  Buldhana: [

    "Buldhana",

    "Chikhli",

    "Deulgaon Raja",

    "Jalgaon (Jamod)",

    "Khamgaon",

    "Lonar",

    "Malkapur",

    "Mehkar",

    "Motala",

    "Nandura",

    "Sangrampur",

    "Shegaon",

    "Sindkhed Raja",

  ],



  Chandrapur: [

    "Ballarpur",

    "Bhadravati",

    "Brahmapuri",

    "Chandrapur",

    "Chimur",

    "Gondpipri",

    "Jiwati",

    "Korpana",

    "Mul",

    "Nagbhir",

    "Pombhurna",

    "Rajura",

    "Sawali",

    "Sindewahi",

    "Warora",

  ],



  Dhule: [

    "Dhule",

    "Sakri",

    "Shirpur",

    "Sindkheda",

  ],



  Gadchiroli: [

    "Aheri",

    "Armori",

    "Bhamragad",

    "Chamorshi",

    "Desaiganj (Vadasa)",

    "Dhanora",

    "Etapalli",

    "Gadchiroli",

    "Korchi",

    "Kurkheda",

    "Mulchera",

    "Sironcha",

  ],



  Gondia: [

    "Amgaon",

    "Arjuni Morgaon",

    "Deori",

    "Gondia",

    "Goregaon",

    "Sadak-Arjuni",

    "Salekasa",

    "Tirora",

  ],



  Hingoli: [

    "Aundha (Nagnath)",

    "Basmath",

    "Hingoli",

    "Kalamnuri",

    "Sengaon",

  ],



  Jalgaon: [

    "Amalner",

    "Bhadgaon",

    "Bhusawal",

    "Bodvad",

    "Chalisgaon",

    "Chopda",

    "Dharangaon",

    "Erandol",

    "Jalgaon",

    "Jamner",

    "Muktainagar",

    "Pachora",

    "Parola",

    "Raver",

    "Yawal",

  ],



  Jalna: [

    "Ambad",

    "Badnapur",

    "Bhokardan",

    "Ghansawangi",

    "Jafferabad",

    "Jalna",

    "Mantha",

    "Partur",

  ],



  Kolhapur: [

    "Ajra",

    "Gaganbavda",

    "Bhudargad",

    "Chandgad",

    "Gadhinglaj",

    "Hatkanangle",

    "Kagal",

    "Karvir",

    "Panhala",

    "Radhanagari",

    "Shahuwadi",

    "Shirol",

  ],



  Latur: [

    "Ahmadpur",

    "Ausa",

    "Chakur",

    "Deoni",

    "Jalkot",

    "Latur",

    "Nilanga",

    "Renapur",

    "Shirur-Anantpal",

    "Udgir",

  ],



  Mumbai: [],



  "Mumbai Suburban": [

    "Andheri",

    "Borivali",

    "Kurla",

  ],



  Nagpur: [

    "Bhiwapur",

    "Hingna",

    "Kalameshwar",

    "Kamptee",

    "Katol",

    "Kuhi",

    "Mauda",

    "Nagpur (Rural)",

    "Nagpur (Urban)",

    "Narkhed",

    "Parseoni",

    "Ramtek",

    "Savner",

    "Umred",

  ],



  Nanded: [

    "Ardhapur",

    "Bhokar",

    "Biloli",

    "Deglur",

    "Dharmabad",

    "Hadgaon",

    "Himayatnagar",

    "Kandhar",

    "Kinwat",

    "Loha",

    "Mahoor",

    "Mudkhed",

    "Mukhed",

    "Naigaon (Khairgaon)",

    "Nanded",

    "Umri",

  ],



  Nandurbar: [

    "Akkalkuwa",

    "Akrani",

    "Nandurbar",

    "Nawapur",

    "Shahade",

    "Talode",

  ],



  Nashik: [

    "Baglan",

    "Chandwad",

    "Deola",

    "Dindori",

    "Igatpuri",

    "Kalwan",

    "Malegaon",

    "Nandgaon",

    "Nashik",

    "Niphad",

    "Peint",

    "Sinnar",

    "Surgana",

    "Trimbakeshwar",

    "Yeola",

  ],



  Dharashiv: [

    "Bhum",

    "Kalamb",

    "Lohara",

    "Dharashiv",

    "Paranda",

    "Tuljapur",

    "Umarga",

    "Washi",

  ],



  Parbhani: [

    "Gangakhed",

    "Jintur",

    "Manwath",

    "Palam",

    "Parbhani",

    "Pathri",

    "Purna",

    "Sailu",

    "Sonpeth",

  ],



  Pune: [

    "Ambegaon",

    "Baramati",

    "Bhor",

    "Daund",

    "Haveli",

    "Indapur",

    "Junnar",

    "Khed",

    "Mawal",

    "Mulshi",

    "Pune City",

    "Purandhar",

    "Shirur",

    "Velhe",

  ],



  Raigad: [

    "Alibag",

    "Karjat",

    "Khalapur",

    "Mahad",

    "Mangaon",

    "Mhasla",

    "Murud",

    "Panvel",

    "Pen",

    "Poladpur",

    "Roha",

    "Shrivardhan",

    "Sudhagad",

    "Tala",

    "Uran",

  ],



  Ratnagiri: [

    "Chiplun",

    "Dapoli",

    "Guhagar",

    "Khed",

    "Lanja",

    "Mandangad",

    "Rajapur",

    "Ratnagiri",

    "Sangameshwar",

  ],



  Sangli: [

    "Atpadi",

    "Jat",

    "Kadegaon",

    "Kavathemahankal",

    "Khanapur",

    "Miraj",

    "Palus",

    "Shirala",

    "Tasgaon",

    "Walwa",

  ],



  Satara: [

    "Jaoli",

    "Karad",

    "Khandala",

    "Khatav",

    "Koregaon",

    "Mahabaleshwar",

    "Man",

    "Patan",

    "Phaltan",

    "Satara",

    "Wai",

  ],



  Sindhudurg: [

    "Devgad",

    "Dodamarg",

    "Kankavli",

    "Kudal",

    "Malwan",

    "Sawantwadi",

    "Vaibhavwadi",

    "Vengurla",

  ],



  Solapur: [

    "Akkalkot",

    "Barshi",

    "Karmala",

    "Madha",

    "Malshiras",

    "Mangalvedhe",

    "Mohol",

    "Pandharpur",

    "Sangole",

    "Solapur North",

    "Solapur South",

  ],



  Thane: [

    "Ambarnath",

    "Bhiwandi",

    "Kalyan",

    "Murbad",

    "Shahapur",

    "Thane",

    "Ulhasnagar",

  ],



  Wardha: [

    "Arvi",

    "Ashti",

    "Deoli",

    "Hinganghat",

    "Karanja",

    "Samudrapur",

    "Seloo",

    "Wardha",

  ],



  Washim: [

    "Karanja",

    "Malegaon",

    "Mangrulpir",

    "Manora",

    "Risod",

    "Washim",

  ],



  Yavatmal: [

    "Arni",

    "Babulgaon",

    "Darwha",

    "Digras",

    "Ghatanji",

    "Kalamb",

    "Kelapur",

    "Mahagaon",

    "Maregaon",

    "Ner",

    "Pusad",

    "Ralegaon",

    "Umarkhed",

    "Wani",

    "Yavatmal",

    "Zari-Jamani",

  ],



  Palghar: [

    "Dahanu",

    "Jawhar",

    "Mokhada",

    "Palghar",

    "Talasari",

    "Vasai",

    "Vikramgad",

    "Wada",

  ],

};





// ============================================================

// HELPER FUNCTIONS

// ============================================================



/**

 * Get all talukas belonging to a district.

 */

export function getTalukasForDistrict(district) {

  if (!district) {

    return [];

  }



  return MAHARASHTRA_TALUKAS[district] || [];

}





/**

 * Get the Marathi name of a district.

 */

export function getDistrictMarathiName(district) {

  const found = MAHARASHTRA_DISTRICTS.find(

    (item) => item.name === district

  );



  return found?.marathi || "";

}





/**

 * Search Maharashtra districts.

 *

 * Example:

 * searchMaharashtraDistricts("nash")

 */

export function searchMaharashtraDistricts(searchTerm = "") {

  const query = searchTerm.trim().toLowerCase();



  if (!query) {

    return MAHARASHTRA_DISTRICTS;

  }



  return MAHARASHTRA_DISTRICTS.filter((district) => {

    return (

      district.name.toLowerCase().includes(query) ||

      district.marathi.includes(searchTerm.trim())

    );

  });

}





/**

 * Search talukas inside a selected district.

 */

export function searchTalukas(

  district,

  searchTerm = ""

) {

  const talukas = getTalukasForDistrict(district);



  const query = searchTerm.trim().toLowerCase();



  if (!query) {

    return talukas;

  }



  return talukas.filter((taluka) =>

    taluka.toLowerCase().includes(query)

  );

}





// ============================================================

// VILLAGE DATA

// ============================================================

//

// IMPORTANT:

// AARTH should NOT put the complete Maharashtra village master

// inside this JS file.

//

// The Maharashtra administrative master contains a very large

// number of village records.

//

// Recommended UI:

//

// District

//      ↓

// Taluka

//      ↓

// Search Village

//      ↓

// API / official master

//

// This avoids thousands of DOM options and keeps the dashboard

// fast.

//

// The following configuration tells the UI that village search

// is an asynchronous/searchable field.

// ============================================================



export const MAHARASHTRA_VILLAGE_CONFIG = {

  searchable: true,

  async: true,

  minSearchCharacters: 2,



  placeholder:

    "Search your village",



  noResultsMessage:

    "No village found. Try another spelling.",



  selectDistrictFirst:

    "Select district first",



  selectTalukaFirst:

    "Select taluka first",



  source:

    "Maharashtra Common Village Master / LGD",

};





// ============================================================

// AARTH MAHARASHTRA PROFILE CONFIG

// ============================================================



export const AARTH_MAHARASHTRA_PROFILE_CONFIG = {

  state: "Maharashtra",



  stateCode: "MH",



  districts: MAHARASHTRA_DISTRICTS,



  talukas: MAHARASHTRA_TALUKAS,



  village: MAHARASHTRA_VILLAGE_CONFIG,



  locationHierarchy: [

    "District",

    "Taluka",

    "Village",

  ],

};