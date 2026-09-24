// src/pages/ProfitLossPage.tsx
// Uses backend market engine output as the single source of truth.

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import * as maplibregl from 'maplibre-gl'
import { setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

// Vite must bundle MapLibre's worker explicitly; otherwise GeoJSON route layers fail to render.
setWorkerUrl(maplibreWorkerUrl)
import './MarketIntelligence.css'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  MapPin, Truck, TrendingUp, TrendingDown, Navigation,
  IndianRupee, ArrowLeft, Loader2, Target, Zap,
  BarChart2, Info, CheckCircle, ChevronRight, Plus, Minus as MinusIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './MarketIntelligenceFooter'
import { useAuth, useApp } from './compat'
import { API_BASE } from './api'
import {
  fetchMarketCrops,
  getFallbackMarketCrops,
  groupMarketCropsByCategory,
  marketCropEnLabel,
  prioritizeMarketCrops,
  type MarketCrop,
} from './marketData'
import {
  formatCompactCurrency,
  getLocalizedApmcName,
  localizeDistrict,
  localizeRouteStop,
  resolveAppLang,
  trByLang,
  type UiLang,
} from './localization'

// ── Design tokens ──────────────────────────────────────────────────────────
const G = {
  primary:'#1A4D2E', mid:'#2D6B42', accent:'#5BB37F',
  cream:'#F4F8F5', ink:'#0D1A0F', muted:'#4A6655',
  border:'rgba(26,77,46,0.12)', bg8:'rgba(26,77,46,0.08)',
  gold:'#D97706', red:'#DC2626',
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 120000,
}
const PROFIT_STATE_KEY = 'seva_profit_loss_results_v1'
const PROFIT_QUERY_CACHE_KEY = 'seva_profit_loss_query_cache_v1'
const GEO_ADDRESS_CACHE_KEY = 'seva_geo_address_cache_v2'
const CROP_IMAGE_CACHE_KEY = 'seva_crop_image_cache_v2'
const PROFIT_LOCATION_CACHE_KEY = 'seva_profit_loss_location_v2'
const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? ''
const IPINFO_TOKEN = (import.meta as any).env?.VITE_IPINFO_TOKEN ?? ''
const LOCATION_CACHE_MAX_AGE_MS = 30 * 60 * 1000

// ── Constants from travel_expense.py ─────────────────────────────────────
const DIESEL_PRICE = 95
const CNG_PRICE = 75
const ROUND_TRIP = true

const MILEAGE_RANGES: Record<string,[number,number]> = {
  tractor:[3,8], pickup:[5,20], tempo:[6,16], truck:[3,7]
}
const RENT_RANGES: Record<string,[number,number]> = {
  tractor:[10,30], pickup:[10,35], tempo:[15,45], truck:[20,70]
}

// ── All 285 APMCs from apmc_locations_cleaned.xlsx (exact coordinates) ──
type APMC = { code:string; name:string; nameMr?:string; district:string; lat:number; lng:number; conf:'HIGH'|'LOW' }

const APMC_DB: APMC[] = [
  {code:"5320200",name:"Akot",district:"Akola",lat:21.102947,lng:77.049758,conf:"HIGH"},
  {code:"5320100",name:"Akola",district:"Akola",lat:20.719354,lng:76.993087,conf:"HIGH"},
  {code:"5321200",name:"Telhara",district:"Akola",lat:21.028402,lng:76.84444,conf:"HIGH"},
  {code:"5321000",name:"Patur",district:"Akola",lat:20.460788,lng:76.944995,conf:"LOW"},
  {code:"5320400",name:"Barshi Takli",district:"Akola",lat:20.57703,lng:77.063413,conf:"HIGH"},
  {code:"5320300",name:"Balapur",district:"Akola",lat:20.664684,lng:76.781612,conf:"LOW"},
  {code:"5320900",name:"Murtizapur",district:"Akola",lat:20.736741,lng:77.366174,conf:"HIGH"},
  {code:"5330300",name:"Anajngaon Surji",district:"Amravati",lat:21.17034,lng:77.31188,conf:"HIGH"},
  {code:"5330100",name:"Achalpur",district:"Amravati",lat:21.283132,lng:77.518768,conf:"HIGH"},
  {code:"5330200",name:"Amravati",district:"Amravati",lat:20.934154,lng:77.755647,conf:"HIGH"},
  {code:"5330400",name:"Chandur Railway",district:"Amravati",lat:20.815869,lng:77.979667,conf:"LOW"},
  {code:"5330500",name:"Chandur Bajar",district:"Amravati",lat:21.243385,lng:77.738538,conf:"HIGH"},
  {code:"5331100",name:"Tiwasa",district:"Amravati",lat:21.097298,lng:78.067173,conf:"HIGH"},
  {code:"5330600",name:"Daryapur",district:"Amravati",lat:20.921764,lng:77.317469,conf:"HIGH"},
  {code:"5330700",name:"Dhamngaon-Railway",district:"Amravati",lat:20.78252,lng:78.141861,conf:"LOW"},
  {code:"5330800",name:"Dharni",district:"Amravati",lat:21.549457,lng:76.885862,conf:"LOW"},
  {code:"5331000",name:"Nandgaon Khandeshwar",district:"Amravati",lat:20.685548,lng:77.821179,conf:"HIGH"},
  {code:"5330900",name:"Morshi",district:"Amravati",lat:21.325783,lng:78.004469,conf:"HIGH"},
  {code:"5331200",name:"Varud",district:"Amravati",lat:21.469187,lng:78.26065,conf:"HIGH"},
  {code:"2161300",name:"Akole",district:"Ahilyanagar",lat:19.541289,lng:74.005101,conf:"HIGH"},
  {code:"2160100",name:"Ahilyanagar",district:"Ahilyanagar",lat:19.084169,lng:74.741868,conf:"HIGH"},
  {code:"2160300",name:"Karjat(Nager)",district:"Ahilyanagar",lat:18.544161,lng:75.006244,conf:"HIGH"},
  {code:"2160400",name:"Kopargaon",district:"Ahilyanagar",lat:19.894623,lng:74.47998,conf:"HIGH"},
  {code:"2160200",name:"Jamkhed",district:"Ahilyanagar",lat:18.738134,lng:75.314639,conf:"HIGH"},
  {code:"2160500",name:"Newasa",district:"Ahilyanagar",lat:19.545173,lng:74.935182,conf:"HIGH"},
  {code:"2160700",name:"Pathardi",district:"Ahilyanagar",lat:19.173947,lng:75.175807,conf:"HIGH"},
  {code:"2160600",name:"Parner",district:"Ahilyanagar",lat:18.999755,lng:74.440502,conf:"HIGH"},
  {code:"2161400",name:"Rahata",district:"Ahilyanagar",lat:19.735056,lng:74.478105,conf:"HIGH"},
  {code:"2160800",name:"Rahuri",district:"Ahilyanagar",lat:19.389483,lng:74.646757,conf:"HIGH"},
  {code:"2161000",name:"Shevgaon",district:"Ahilyanagar",lat:19.3538,lng:75.220305,conf:"LOW"},
  {code:"2161100",name:"Shrigonda",district:"Ahilyanagar",lat:18.609335,lng:74.694017,conf:"HIGH"},
  {code:"2161200",name:"Shrirampur",district:"Ahilyanagar",lat:19.618079,lng:74.670531,conf:"HIGH"},
  {code:"2160900",name:"Sangamner",district:"Ahilyanagar",lat:19.578144,lng:74.204954,conf:"HIGH"},
  {code:"3200300",name:"Kolhapur",district:"Kolhapur",lat:16.70405,lng:74.267142,conf:"HIGH"},
  {code:"3200100",name:"Gadhinglaj",district:"Kolhapur",lat:16.230382,lng:74.359613,conf:"HIGH"},
  {code:"3200200",name:"Jaysingpur",district:"Kolhapur",lat:16.766847,lng:74.572157,conf:"HIGH"},
  {code:"3200400",name:"Vadgaonpeth",district:"Kolhapur",lat:16.830491,lng:74.317,conf:"HIGH"},
  {code:"6380300",name:"Aheri",district:"Gadchiroli",lat:19.42207,lng:79.982641,conf:"HIGH"},
  {code:"6380100",name:"Armori",district:"Gadchiroli",lat:20.466389,lng:79.989062,conf:"HIGH"},
  {code:"6380200",name:"Gadchiroli",district:"Gadchiroli",lat:20.179146,lng:79.998063,conf:"HIGH"},
  {code:"6380400",name:"Chamorshi",district:"Gadchiroli",lat:19.872194,lng:80.002972,conf:"HIGH"},
  {code:"6360200",name:"Arjuni morgaon",district:"Gondiya",lat:20.822969,lng:80.031276,conf:"LOW"},
  {code:"6360100",name:"Aamgaon",district:"Gondiya",lat:21.374627,lng:80.379304,conf:"LOW"},
  {code:"6360400",name:"Gondiya",district:"Gondiya",lat:21.449713,lng:80.187733,conf:"HIGH"},
  {code:"6361200",name:"Goregaon",district:"Gondiya",lat:21.345357,lng:80.206377,conf:"HIGH"},
  {code:"6360900",name:"Tiroda",district:"Gondiya",lat:21.406083,lng:79.934561,conf:"LOW"},
  {code:"6431400",name:"Devari",district:"Gondiya",lat:21.072911,lng:80.367574,conf:"LOW"},
  {code:"6431300",name:"Sadak arjuni",district:"Gondiya",lat:21.093702,lng:80.15533,conf:"LOW"},
  {code:"6370900",name:"Gondpimpri",district:"Chandrapur",lat:19.7148,lng:79.684211,conf:"LOW"},
  {code:"6370200",name:"Chandrapur",district:"Chandrapur",lat:19.963677,lng:79.28545,conf:"HIGH"},
  {code:"6370300",name:"Chimur",district:"Chandrapur",lat:20.496055,lng:79.364087,conf:"LOW"},
  {code:"6370500",name:"Nagbhid",district:"Chandrapur",lat:20.584222,lng:79.682288,conf:"LOW"},
  {code:"6371300",name:"Pombhurni",district:"Chandrapur",lat:19.869452,lng:79.632815,conf:"HIGH"},
  {code:"6370100",name:"Brahmpuri",district:"Chandrapur",lat:20.617483,lng:79.8552,conf:"HIGH"},
  {code:"6371000",name:"Bhadrawati",district:"Chandrapur",lat:20.10305,lng:79.111034,conf:"HIGH"},
  {code:"6370400",name:"Mul",district:"Chandrapur",lat:20.063028,lng:79.680605,conf:"HIGH"},
  {code:"6370600",name:"Rajura",district:"Chandrapur",lat:19.780026,lng:79.354913,conf:"HIGH"},
  {code:"6370800",name:"Varora",district:"Chandrapur",lat:20.244987,lng:79.001106,conf:"HIGH"},
  {code:"6371100",name:"Savali",district:"Chandrapur",lat:20.081153,lng:79.783893,conf:"LOW"},
  {code:"6370700",name:"Sindevahi",district:"Chandrapur",lat:20.295559,lng:79.668071,conf:"LOW"},
  {code:"4250300",name:"Kannad",district:"Chhatrapati Sambhajinagar",lat:20.260282,lng:75.13536,conf:"HIGH"},
  {code:"4251000",name:"Khultabad",district:"Chhatrapati Sambhajinagar",lat:20.003339,lng:75.186666,conf:"HIGH"},
  {code:"4250200",name:"Gangapur",district:"Chhatrapati Sambhajinagar",lat:19.70466,lng:75.001516,conf:"HIGH"},
  {code:"4250100",name:"Chhatrapati Sambhajinagar",district:"Chhatrapati Sambhajinagar",lat:19.904403,lng:75.361712,conf:"HIGH"},
  {code:"4250500",name:"Paithan",district:"Chhatrapati Sambhajinagar",lat:19.478259,lng:75.383135,conf:"HIGH"},
  {code:"4250900",name:"Fulmbri",district:"Chhatrapati Sambhajinagar",lat:20.091874,lng:75.428352,conf:"HIGH"},
  {code:"4250400",name:"Lasur Station",district:"Chhatrapati Sambhajinagar",lat:19.92974,lng:74.998748,conf:"HIGH"},
  {code:"4250800",name:"Vaijapur",district:"Chhatrapati Sambhajinagar",lat:19.916007,lng:74.75434,conf:"HIGH"},
  {code:"4250600",name:"Sillod",district:"Chhatrapati Sambhajinagar",lat:20.299933,lng:75.654529,conf:"HIGH"},
  {code:"4250700",name:"Soygaon",district:"Chhatrapati Sambhajinagar",lat:20.5928,lng:75.618475,conf:"LOW"},
  {code:"2180100",name:"Amalner",district:"Jalgaon",lat:21.03646,lng:75.051299,conf:"HIGH"},
  {code:"2180400",name:"Chalisgaon",district:"Jalgaon",lat:20.453572,lng:75.018707,conf:"HIGH"},
  {code:"2180500",name:"Chopda",district:"Jalgaon",lat:21.241173,lng:75.29749,conf:"HIGH"},
  {code:"2180700",name:"Jalgaon",district:"Jalgaon",lat:20.99807,lng:75.578428,conf:"HIGH"},
  {code:"2180800",name:"Jamner",district:"Jalgaon",lat:20.80841,lng:75.780134,conf:"LOW"},
  {code:"2180600",name:"Dharangaon",district:"Jalgaon",lat:21.007321,lng:75.276056,conf:"HIGH"},
  {code:"2180900",name:"Pachora",district:"Jalgaon",lat:20.66629,lng:75.345194,conf:"HIGH"},
  {code:"2181000",name:"Parola",district:"Jalgaon",lat:20.875785,lng:75.11226,conf:"HIGH"},
  {code:"2180300",name:"Bodwad",district:"Jalgaon",lat:20.882811,lng:75.99495,conf:"HIGH"},
  {code:"2180200",name:"Bhusaval",district:"Jalgaon",lat:21.043228,lng:75.777596,conf:"HIGH"},
  {code:"2181200",name:"Yawal",district:"Jalgaon",lat:21.170714,lng:75.701984,conf:"HIGH"},
  {code:"2181100",name:"Raver",district:"Jalgaon",lat:21.241,lng:76.03793,conf:"HIGH"},
  {code:"4270100",name:"Ambad (Vadigodri)",district:"Jalna",lat:19.610324,lng:75.796114,conf:"HIGH"},
  {code:"4270700",name:"Ghansawangi (kumbhar)",district:"Jalna",lat:19.396806,lng:76.059877,conf:"LOW"},
  {code:"4270800",name:"Jafrabad",district:"Jalna",lat:20.19398,lng:76.013428,conf:"HIGH"},
  {code:"4270500",name:"Partur",district:"Jalna",lat:19.581246,lng:76.209831,conf:"HIGH"},
  {code:"4270200",name:"Bhokardan",district:"Jalna",lat:20.25535,lng:75.768808,conf:"HIGH"},
  {code:"4270400",name:"Mantha",district:"Jalna",lat:19.645112,lng:76.380632,conf:"LOW"},
  {code:"1140200",name:"Kalyan",district:"Thane",lat:19.23548,lng:73.119546,conf:"HIGH"},
  {code:"1140300",name:"Murbad",district:"Thane",lat:19.253378,lng:73.391104,conf:"LOW"},
  {code:"1140500",name:"Shahapur",district:"Thane",lat:19.451775,lng:73.331957,conf:"HIGH"},
  {code:"4300700",name:"Umarga",district:"Dharashiv",lat:17.837936,lng:76.621846,conf:"LOW"},
  {code:"4300200",name:"Kalamb (Dharashiv)",district:"Dharashiv",lat:18.574141,lng:76.022073,conf:"HIGH"},
  {code:"4300600",name:"Tuljapur",district:"Dharashiv",lat:18.009004,lng:76.077814,conf:"HIGH"},
  {code:"4300400",name:"Dharashiv",district:"Dharashiv",lat:18.168106,lng:76.047258,conf:"HIGH"},
  {code:"4300500",name:"Paranda",district:"Dharashiv",lat:18.268858,lng:75.459726,conf:"HIGH"},
  {code:"4300100",name:"Bhoom",district:"Dharashiv",lat:18.456953,lng:75.665669,conf:"HIGH"},
  {code:"4300300",name:"Murum",district:"Dharashiv",lat:17.784127,lng:76.476172,conf:"HIGH"},
  {code:"4300900",name:"Lohara",district:"Dharashiv",lat:17.994633,lng:76.331068,conf:"LOW"},
  {code:"4300800",name:"Washi (Dharashiv)",district:"Dharashiv",lat:18.550856,lng:75.775886,conf:"HIGH"},
  {code:"2170200",name:"Dondaicha",district:"Dhule",lat:21.331237,lng:74.559461,conf:"HIGH"},
  {code:"2170100",name:"Dhule",district:"Dhule",lat:20.901016,lng:74.788222,conf:"HIGH"},
  {code:"2170700",name:"Shirpur",district:"Dhule",lat:21.351952,lng:74.884702,conf:"HIGH"},
  {code:"2170500",name:"Sakri",district:"Dhule",lat:20.990164,lng:74.306444,conf:"HIGH"},
  {code:"2170900",name:"Akkalkuwa",district:"Nandurbar",lat:21.555519,lng:74.017797,conf:"LOW"},
  {code:"2170800",name:"Taloda",district:"Nandurbar",lat:21.555405,lng:74.210952,conf:"HIGH"},
  {code:"2171000",name:"Dhadgaon",district:"Nandurbar",lat:21.828681,lng:74.211569,conf:"HIGH"},
  {code:"2170300",name:"Nandurbar",district:"Nandurbar",lat:21.372207,lng:74.250045,conf:"HIGH"},
  {code:"2170400",name:"Navapur",district:"Nandurbar",lat:21.160782,lng:73.791055,conf:"LOW"},
  {code:"2170600",name:"Shahada",district:"Nandurbar",lat:21.542687,lng:74.471167,conf:"HIGH"},
  {code:"4291300",name:"Umari",district:"Nanded",lat:19.038989,lng:77.64237,conf:"HIGH"},
  {code:"4290500",name:"Kandhar",district:"Nanded",lat:18.872767,lng:77.188258,conf:"LOW"},
  {code:"4290600",name:"Kinwat",district:"Nanded",lat:19.632598,lng:78.201045,conf:"HIGH"},
  {code:"4291200",name:"Nanded",district:"Nanded",lat:19.166601,lng:77.315229,conf:"HIGH"},
  {code:"4291100",name:"Naigaon",district:"Nanded",lat:18.848318,lng:77.528575,conf:"HIGH"},
  {code:"4290100",name:"Bhokar",district:"Nanded",lat:19.223246,lng:77.670282,conf:"HIGH"},
  {code:"4291600",name:"Mahur",district:"Nanded",lat:19.854397,lng:77.925439,conf:"LOW"},
  {code:"4291000",name:"Mukhed",district:"Nanded",lat:18.704682,lng:77.370333,conf:"HIGH"},
  {code:"4290900",name:"Mudkhed",district:"Nanded",lat:19.151411,lng:77.504083,conf:"HIGH"},
  {code:"4290800",name:"Loha",district:"Nanded",lat:18.944862,lng:77.112143,conf:"HIGH"},
  {code:"6390900",name:"Umred",district:"Nagpur",lat:20.846491,lng:79.3288,conf:"HIGH"},
  {code:"6390200",name:"Kalmeshwar",district:"Nagpur",lat:21.240196,lng:78.90383,conf:"LOW"},
  {code:"6390300",name:"Katol",district:"Nagpur",lat:21.270596,lng:78.586699,conf:"HIGH"},
  {code:"6391200",name:"Kamthi",district:"Nagpur",lat:21.216632,lng:79.193935,conf:"HIGH"},
  {code:"6390600",name:"Narkhed",district:"Nagpur",lat:21.467623,lng:78.52226,conf:"HIGH"},
  {code:"6390500",name:"Nagpur",district:"Nagpur",lat:21.1645,lng:79.147882,conf:"HIGH"},
  {code:"6391000",name:"Parshiwani",district:"Nagpur",lat:21.385204,lng:78.920095,conf:"HIGH"},
  {code:"6390100",name:"Bhiwapur",district:"Nagpur",lat:20.764235,lng:79.512841,conf:"LOW"},
  {code:"6390400",name:"Mandhal",district:"Nagpur",lat:20.952512,lng:79.464397,conf:"HIGH"},
  {code:"6391300",name:"Mauda",district:"Nagpur",lat:21.148811,lng:79.402402,conf:"HIGH"},
  {code:"6390700",name:"Ramtek",district:"Nagpur",lat:21.395476,lng:79.305717,conf:"HIGH"},
  {code:"2191600",name:"Umrane",district:"Nashik",lat:20.421635,lng:74.36277,conf:"HIGH"},
  {code:"2190300",name:"Kalvan",district:"Nashik",lat:20.49425,lng:74.031315,conf:"HIGH"},
  {code:"2190200",name:"Ghoti",district:"Nashik",lat:19.71471,lng:73.624331,conf:"HIGH"},
  {code:"2190100",name:"Chandvad",district:"Nashik",lat:20.329262,lng:74.235335,conf:"HIGH"},
  {code:"2191200",name:"Dindori",district:"Nashik",lat:20.218424,lng:73.835321,conf:"HIGH"},
  {code:"2191500",name:"Devala",district:"Nashik",lat:20.459373,lng:74.178696,conf:"HIGH"},
  {code:"2190700",name:"Nandgaon",district:"Nashik",lat:20.301429,lng:74.655867,conf:"HIGH"},
  {code:"2191700",name:"Nampur",district:"Nashik",lat:20.710135,lng:74.296659,conf:"HIGH"},
  {code:"2190800",name:"Nashik",district:"Nashik",lat:20.029928,lng:73.792554,conf:"HIGH"},
  {code:"2191300",name:"Pimpalgaon basawant",district:"Nashik",lat:20.16657,lng:73.99556,conf:"HIGH"},
  {code:"2190600",name:"Manmad",district:"Nashik",lat:20.26068,lng:74.436842,conf:"HIGH"},
  {code:"2190500",name:"Malegaon(Nashik)",district:"Nashik",lat:20.562631,lng:74.521758,conf:"HIGH"},
  {code:"2191100",name:"Yeola",district:"Nashik",lat:20.048094,lng:74.480732,conf:"HIGH"},
  {code:"2190400",name:"Lasalgaon",district:"Nashik",lat:20.141749,lng:74.236146,conf:"HIGH"},
  {code:"2190900",name:"Satana",district:"Nashik",lat:20.591906,lng:74.208393,conf:"HIGH"},
  {code:"2191000",name:"Sinner",district:"Nashik",lat:19.846023,lng:74.005624,conf:"HIGH"},
  {code:"2191400",name:"Suragana",district:"Nashik",lat:20.56176,lng:73.637409,conf:"LOW"},
  {code:"4310300",name:"Gangakhed",district:"Parbhani",lat:18.96035,lng:76.726902,conf:"HIGH"},
  {code:"4310500",name:"Jintur",district:"Parbhani",lat:19.615823,lng:76.682069,conf:"HIGH"},
  {code:"4311400",name:"Tadkalas",district:"Parbhani",lat:19.129021,lng:76.942716,conf:"LOW"},
  {code:"4310800",name:"Parbhani",district:"Parbhani",lat:19.263008,lng:76.765326,conf:"HIGH"},
  {code:"4311300",name:"Pathari",district:"Parbhani",lat:19.261472,lng:76.430032,conf:"HIGH"},
  {code:"4311500",name:"Palam",district:"Parbhani",lat:19.012769,lng:76.950609,conf:"LOW"},
  {code:"4311000",name:"Purna",district:"Parbhani",lat:19.183215,lng:77.023563,conf:"HIGH"},
  {code:"4310200",name:"Basmat",district:"Parbhani",lat:19.327715,lng:77.151052,conf:"LOW"},
  {code:"4311800",name:"Bori",district:"Parbhani",lat:19.492943,lng:76.730909,conf:"HIGH"},
  {code:"4310700",name:"Manwat",district:"Parbhani",lat:19.3119,lng:76.500287,conf:"HIGH"},
  {code:"4311100",name:"Selu",district:"Parbhani",lat:19.451508,lng:76.438027,conf:"HIGH"},
  {code:"4311600",name:"Sonpeth",district:"Parbhani",lat:19.028608,lng:76.478668,conf:"HIGH"},
  {code:"1140800",name:"Dahanu",district:"Paghar",lat:19.990241,lng:72.742976,conf:"LOW"},
  {code:"1140400",name:"Palghar(Bevur)",district:"Paghar",lat:19.707666,lng:72.786723,conf:"HIGH"},
  {code:"1140600",name:"Vasai",district:"Paghar",lat:19.36553,lng:72.810357,conf:"LOW"},
  {code:"3210400",name:"Indapur",district:"Pune",lat:18.094304,lng:75.015799,conf:"HIGH"},
  {code:"3210600",name:"Khed",district:"Pune",lat:18.855502,lng:73.887282,conf:"HIGH"},
  {code:"3210500",name:"Junnar",district:"Pune",lat:19.20655,lng:73.870511,conf:"HIGH"},
  {code:"3211100",name:"Talegaon Dabhade",district:"Pune",lat:18.736591,lng:73.668707,conf:"HIGH"},
  {code:"3210300",name:"Dound",district:"Pune",lat:18.468334,lng:74.572214,conf:"HIGH"},
  {code:"3210800",name:"Nira",district:"Pune",lat:18.102328,lng:74.211773,conf:"LOW"},
  {code:"3210900",name:"Pune",district:"Pune",lat:18.487115,lng:73.864438,conf:"HIGH"},
  {code:"3210100",name:"Baramati",district:"Pune",lat:18.149004,lng:74.585393,conf:"HIGH"},
  {code:"3210200",name:"Bhor",district:"Pune",lat:18.145951,lng:73.85209,conf:"HIGH"},
  {code:"3210700",name:"Manchar",district:"Pune",lat:19.003922,lng:73.947083,conf:"HIGH"},
  {code:"3211000",name:"Shirur",district:"Pune",lat:18.82644,lng:74.366874,conf:"HIGH"},
  {code:"4260100",name:"Ambejogai",district:"Beed",lat:18.72975,lng:76.382874,conf:"HIGH"},
  {code:"4260500",name:"Kada",district:"Beed",lat:18.898338,lng:75.079539,conf:"HIGH"},
  {code:"4260300",name:"Kille Dharur",district:"Beed",lat:18.826418,lng:76.11305,conf:"HIGH"},
  {code:"4260900",name:"Kaij",district:"Beed",lat:18.710689,lng:76.063683,conf:"HIGH"},
  {code:"4260400",name:"Gevrai",district:"Beed",lat:19.256662,lng:75.750976,conf:"LOW"},
  {code:"4260700",name:"Parali Vaijyanath",district:"Beed",lat:18.849776,lng:76.529715,conf:"HIGH"},
  {code:"4260800",name:"Patoda",district:"Beed",lat:18.802874,lng:75.482888,conf:"HIGH"},
  {code:"4260200",name:"Beed",district:"Beed",lat:19.019686,lng:75.770632,conf:"HIGH"},
  {code:"4260600",name:"Majalgaon",district:"Beed",lat:19.155273,lng:76.209824,conf:"HIGH"},
  {code:"4261100",name:"Vadvani",district:"Beed",lat:18.992968,lng:76.038315,conf:"HIGH"},
  {code:"5340400",name:"Khamgaon",district:"Buldhana",lat:20.703917,lng:76.574046,conf:"HIGH"},
  {code:"5340100",name:"Chikhali",district:"Buldhana",lat:20.34453,lng:76.257222,conf:"HIGH"},
  {code:"5340300",name:"Jalgaon Jamod",district:"Buldhana",lat:21.047655,lng:76.533589,conf:"LOW"},
  {code:"5340200",name:"Deulgaon Raja",district:"Buldhana",lat:20.018672,lng:76.036124,conf:"LOW"},
  {code:"5340900",name:"Nandura",district:"Buldhana",lat:20.837435,lng:76.460091,conf:"HIGH"},
  {code:"5341200",name:"Buldhana",district:"Buldhana",lat:20.525498,lng:76.172882,conf:"HIGH"},
  {code:"5340600",name:"Malkapur",district:"Buldhana",lat:20.873082,lng:76.246307,conf:"HIGH"},
  {code:"5340700",name:"Mehekar",district:"Buldhana",lat:20.147265,lng:76.567834,conf:"HIGH"},
  {code:"5340800",name:"Motala",district:"Buldhana",lat:20.678242,lng:76.212405,conf:"LOW"},
  {code:"5340500",name:"Lonar",district:"Buldhana",lat:19.98678,lng:76.526012,conf:"HIGH"},
  {code:"5341100",name:"Shegaon",district:"Buldhana",lat:20.795648,lng:76.694532,conf:"HIGH"},
  {code:"5341000",name:"Sangrampur",district:"Buldhana",lat:21.033998,lng:76.682421,conf:"HIGH"},
  {code:"5341300",name:"Sindkhed raja",district:"Buldhana",lat:19.962597,lng:76.120901,conf:"HIGH"},
  {code:"6361000",name:"Tumsar",district:"Bhandara",lat:21.371049,lng:79.731557,conf:"HIGH"},
  {code:"6360800",name:"Pavani",district:"Bhandara",lat:20.79241,lng:79.633144,conf:"HIGH"},
  {code:"6360300",name:"Bhandara",district:"Bhandara",lat:21.164086,lng:79.6563,conf:"HIGH"},
  {code:"6360600",name:"Lakhandur",district:"Bhandara",lat:20.730187,lng:79.885998,conf:"HIGH"},
  {code:"6360700",name:"Lakhani",district:"Bhandara",lat:21.068154,lng:79.840561,conf:"HIGH"},
  {code:"1110100",name:"Mumbai",district:"Mumbai",lat:19.075078,lng:73.009571,conf:"HIGH"},
  {code:"5351600",name:"Aarni",district:"Yewatmal",lat:20.065215,lng:77.949681,conf:"HIGH"},
  {code:"5351100",name:"Umarkhed",district:"Yewatmal",lat:19.601409,lng:77.695879,conf:"LOW"},
  {code:"5351400",name:"Kalamb(yeotmal)",district:"Yewatmal",lat:20.442367,lng:78.327285,conf:"HIGH"},
  {code:"5350400",name:"Ghatanji",district:"Yewatmal",lat:20.135257,lng:78.310595,conf:"HIGH"},
  {code:"5351700",name:"Zari zamani",district:"Yewatmal",lat:19.8631,lng:78.726633,conf:"LOW"},
  {code:"5350200",name:"Darwha",district:"Yewatmal",lat:20.304076,lng:77.768535,conf:"HIGH"},
  {code:"5350300",name:"Digras",district:"Yewatmal",lat:20.106648,lng:77.714623,conf:"HIGH"},
  {code:"5350700",name:"Ner parasopant",district:"Yewatmal",lat:20.481431,lng:77.874631,conf:"HIGH"},
  {code:"5350800",name:"Pandharkawada",district:"Yewatmal",lat:20.025231,lng:78.550176,conf:"LOW"},
  {code:"5350900",name:"Pusad",district:"Yewatmal",lat:19.911398,lng:77.575175,conf:"HIGH"},
  {code:"5351500",name:"Babhulgaon",district:"Yewatmal",lat:20.558026,lng:78.16258,conf:"LOW"},
  {code:"5350100",name:"Bori arab",district:"Yewatmal",lat:20.348851,lng:77.882973,conf:"LOW"},
  {code:"5350500",name:"Mahagaon",district:"Yewatmal",lat:20.215614,lng:77.907679,conf:"LOW"},
  {code:"5350600",name:"Maregaon",district:"Yewatmal",lat:20.105403,lng:78.807057,conf:"LOW"},
  {code:"5351300",name:"Yeotmal",district:"Yewatmal",lat:20.403581,lng:78.133796,conf:"HIGH"},
  {code:"5351000",name:"Ralegaon",district:"Yewatmal",lat:20.420191,lng:78.516139,conf:"HIGH"},
  {code:"5351200",name:"Vani",district:"Yewatmal",lat:20.063435,lng:78.963406,conf:"HIGH"},
  {code:"1130100",name:"Ratnagiri(Nachane)",district:"Ratnagiri",lat:16.988439,lng:73.340717,conf:"HIGH"},
  {code:"1120100",name:"Alibag",district:"Raigad",lat:18.655163,lng:72.868049,conf:"LOW"},
  {code:"1120200",name:"Karjat(Raigad)",district:"Raigad",lat:18.912521,lng:73.331219,conf:"HIGH"},
  {code:"1120300",name:"Khalapur(Shil-Phata)",district:"Raigad",lat:18.831383,lng:73.285509,conf:"LOW"},
  {code:"1120700",name:"Panvel",district:"Raigad",lat:18.980592,lng:73.111497,conf:"HIGH"},
  {code:"1120800",name:"Pen",district:"Raigad",lat:18.734893,lng:73.089037,conf:"HIGH"},
  {code:"1120400",name:"Mahad",district:"Raigad",lat:18.080289,lng:73.418475,conf:"LOW"},
  {code:"1120500",name:"Mangaon(Bhadav)",district:"Raigad",lat:18.227822,lng:73.288783,conf:"LOW"},
  {code:"1120600",name:"Murud",district:"Raigad",lat:18.323251,lng:72.963487,conf:"LOW"},
  {code:"1120900",name:"Roha",district:"Raigad",lat:18.44344,lng:73.106206,conf:"LOW"},
  {code:"4280700",name:"Udgir",district:"Latur",lat:18.389749,lng:77.11489,conf:"HIGH"},
  {code:"4280900",name:"Aurad shahajani",district:"Latur",lat:18.055325,lng:76.929168,conf:"HIGH"},
  {code:"4280200",name:"Ausa",district:"Latur",lat:18.244856,lng:76.503604,conf:"HIGH"},
  {code:"4280800",name:"Chakur",district:"Latur",lat:18.512653,lng:76.874178,conf:"LOW"},
  {code:"4281200",name:"Devani",district:"Latur",lat:18.264319,lng:77.085876,conf:"HIGH"},
  {code:"4280600",name:"Nilanga",district:"Latur",lat:18.129433,lng:76.749715,conf:"LOW"},
  {code:"4281000",name:"Renapur",district:"Latur",lat:18.524657,lng:76.587728,conf:"HIGH"},
  {code:"4280500",name:"Latur",district:"Latur",lat:18.393913,lng:76.58016,conf:"HIGH"},
  {code:"6400200",name:"Ashti (Wardha)",district:"wardha",lat:21.187794,lng:78.182483,conf:"HIGH"},
  {code:"6400100",name:"Arvi",district:"wardha",lat:20.996047,lng:78.225812,conf:"HIGH"},
  {code:"6400400",name:"Pulgaon",district:"wardha",lat:20.727101,lng:78.310719,conf:"HIGH"},
  {code:"6400600",name:"Wardha",district:"wardha",lat:20.73317,lng:78.601021,conf:"HIGH"},
  {code:"6400700",name:"Samudrapur",district:"wardha",lat:20.637465,lng:78.97011,conf:"HIGH"},
  {code:"6400500",name:"Sindi",district:"wardha",lat:20.806054,lng:78.884014,conf:"HIGH"},
  {code:"6400300",name:"Hinganghat",district:"wardha",lat:20.534752,lng:78.832783,conf:"HIGH"},
  {code:"5320500",name:"Karanja",district:"Washim",lat:20.482663,lng:77.472923,conf:"HIGH"},
  {code:"5320700",name:"Mangrulpeer",district:"Washim",lat:20.321111,lng:77.341309,conf:"HIGH"},
  {code:"5320800",name:"Manora",district:"Washim",lat:20.211047,lng:77.561993,conf:"HIGH"},
  {code:"5320600",name:"Malegaon(Washim)",district:"Washim",lat:20.237169,lng:77.005487,conf:"HIGH"},
  {code:"5321100",name:"Risod",district:"Washim",lat:19.976185,lng:76.791946,conf:"HIGH"},
  {code:"5321300",name:"Washim",district:"Washim",lat:20.102235,lng:77.143041,conf:"HIGH"},
  {code:"3220100",name:"Aatpadi",district:"Sangli",lat:17.433016,lng:74.934143,conf:"HIGH"},
  {code:"3220200",name:"Islampur",district:"Sangli",lat:17.051822,lng:74.267105,conf:"HIGH"},
  {code:"3220400",name:"Tasgaon",district:"Sangli",lat:17.038306,lng:74.605822,conf:"LOW"},
  {code:"3220600",name:"Palus",district:"Sangli",lat:17.094677,lng:74.452186,conf:"HIGH"},
  {code:"3220500",name:"Vita",district:"Sangli",lat:17.27339,lng:74.544596,conf:"HIGH"},
  {code:"3220700",name:"Shirala",district:"Sangli",lat:16.987123,lng:74.131331,conf:"HIGH"},
  {code:"3220300",name:"Sangli",district:"Sangli",lat:16.853605,lng:74.585347,conf:"HIGH"},
  {code:"3230300",name:"Karad",district:"Satara",lat:17.276149,lng:74.18739,conf:"HIGH"},
  {code:"3230400",name:"Koregaon",district:"Satara",lat:17.699543,lng:74.155144,conf:"HIGH"},
  {code:"3231100",name:"Jawali",district:"Satara",lat:17.83724,lng:73.917665,conf:"HIGH"},
  {code:"3230100",name:"Dahivadi",district:"Satara",lat:17.704988,lng:74.547588,conf:"LOW"},
  {code:"3230600",name:"Patan",district:"Satara",lat:17.343713,lng:74.007344,conf:"LOW"},
  {code:"3230700",name:"Phaltan",district:"Satara",lat:17.992012,lng:74.443143,conf:"HIGH"},
  {code:"3230500",name:"Lonand",district:"Satara",lat:19.076229,lng:73.007414,conf:"HIGH"},
  {code:"3230900",name:"Vaduj",district:"Satara",lat:17.598327,lng:74.449106,conf:"HIGH"},
  {code:"3231000",name:"Vai",district:"Satara",lat:17.941639,lng:73.892739,conf:"HIGH"},
  {code:"3230800",name:"Satara",district:"Satara",lat:17.689613,lng:74.005286,conf:"HIGH"},
  {code:"1150100",name:"Sindhudurg",district:"Sindhudurg",lat:16.114451,lng:73.70083,conf:"LOW"},
  {code:"3240200",name:"Akluj",district:"Solapur",lat:17.893403,lng:75.013814,conf:"HIGH"},
  {code:"3240100",name:"Akkalkot",district:"Solapur",lat:17.522157,lng:76.194526,conf:"HIGH"},
  {code:"3240400",name:"Karmala",district:"Solapur",lat:18.411224,lng:75.195315,conf:"HIGH"},
  {code:"3240500",name:"Kurdwadi",district:"Solapur",lat:18.092645,lng:75.407254,conf:"HIGH"},
  {code:"3241100",name:"Dudhani",district:"Solapur",lat:17.359886,lng:76.367942,conf:"HIGH"},
  {code:"3240800",name:"Pandharpur",district:"Solapur",lat:17.678148,lng:75.320559,conf:"HIGH"},
  {code:"3240300",name:"Barshi",district:"Solapur",lat:18.233149,lng:75.700691,conf:"HIGH"},
  {code:"3240600",name:"Mangalwedha",district:"Solapur",lat:17.513114,lng:75.446352,conf:"HIGH"},
  {code:"3240700",name:"Mohol",district:"Solapur",lat:17.808098,lng:75.642951,conf:"HIGH"},
  {code:"3240900",name:"Sangola",district:"Solapur",lat:17.446298,lng:75.200452,conf:"HIGH"},
  {code:"3241000",name:"Solapur",district:"Solapur",lat:17.679906,lng:75.926308,conf:"HIGH"},
  {code:"4310100",name:"Akhadabalapur",district:"Hingoli",lat:19.528438,lng:77.413049,conf:"HIGH"},
  {code:"4310600",name:"Kalamnuri",district:"Hingoli",lat:19.67786,lng:77.297879,conf:"HIGH"},
  {code:"4311200",name:"Jawala-Bajar",district:"Hingoli",lat:19.464023,lng:76.987446,conf:"HIGH"},
  {code:"4310900",name:"Sengaon",district:"Hingoli",lat:19.792757,lng:76.890822,conf:"HIGH"},
  {code:"4310400",name:"Hingoli",district:"Hingoli",lat:19.724709,lng:77.145168,conf:"HIGH"},
]

type LatLngPoint = [number, number]

function normalizeName(v:string): string {
  return (v || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getApmcByName(name:string): APMC | undefined {
  const key = normalizeName(name)
  return APMC_DB.find(a => normalizeName(a.name) === key)
}

function sanitizeRoutePath(
  raw:any,
  fallbackStart:LatLngPoint,
  fallbackEnd:LatLngPoint,
): LatLngPoint[] {
  if (Array.isArray(raw)) {
    const points: LatLngPoint[] = raw
      .filter((p:any) => Array.isArray(p) && p.length >= 2)
      .map((p:any) => [Number(p[0]), Number(p[1])] as LatLngPoint)
      .filter((p:LatLngPoint) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
    if (points.length >= 2) return points
  }
  return [fallbackStart, fallbackEnd]
}

function hasRoadShape(path: LatLngPoint[] | undefined | null): boolean {
  return Array.isArray(path) && path.length >= 3
}

async function fetchRoadRouteClient(
  start: LatLngPoint,
  end: LatLngPoint,
): Promise<{ path: LatLngPoint[]; durationMin: number; stops: string[] } | null> {
  const [lat1, lon1] = start
  const [lat2, lon2] = end
  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route) return null
    const coords = route?.geometry?.coordinates
    if (!Array.isArray(coords) || coords.length < 3) return null
    const path: LatLngPoint[] = coords
      .filter((c:any) => Array.isArray(c) && c.length >= 2)
      .map((c:any) => [Number(c[1]), Number(c[0])] as LatLngPoint)
      .filter((p:LatLngPoint) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
    if (path.length < 3) return null
    const stops: string[] = []
    ;(route.legs || []).forEach((leg:any) => {
      ;(leg.steps || []).forEach((step:any) => {
        const name = String(step?.name || step?.destinations || step?.ref || '').trim()
        if (name && (!stops.length || stops[stops.length - 1].toLowerCase() !== name.toLowerCase())) {
          stops.push(name)
        }
      })
    })
    return {
      path,
      durationMin: Number(route.duration || 0) / 60,
      stops,
    }
  } catch {
    return null
  }
}

async function enrichRoutesWithRoadPaths(
  items: MarketResult[],
  farmer: LatLngPoint,
): Promise<MarketResult[]> {
  const enriched = await Promise.all(items.map(async (m) => {
    if (hasRoadShape(m.route_path)) return m
    if (!m.apmc?.lat || !m.apmc?.lng) return m
    const rr = await fetchRoadRouteClient(farmer, [m.apmc.lat, m.apmc.lng])
    if (!rr) return m
    return {
      ...m,
      route_path: rr.path,
      route_duration_min: rr.durationMin > 0 ? rr.durationMin : m.route_duration_min,
      route_stops: rr.stops.length ? rr.stops : m.route_stops,
    }
  }))
  return enriched
}

// ── Haversine — exact copy of travel_expense.py logic ──────────────────────
function haversine(lat1:number,lon1:number,lat2:number,lon2:number):number {
  const R = 6371
  const dlat = (lat2-lat1)*Math.PI/180
  const dlon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dlat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dlon/2)**2
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

// ── Transport cost engine — exact logic from travel_expense.py ─────────────
interface TransportResult {
  apmc: APMC
  aerial_dist: number     // km straight line
  road_dist: number       // aerial as proxy (OSRM runs server-side)
  cost_per_km: number
  transport_cost_min: number
  transport_cost_max: number
  transport_cost_avg: number
}

function calcTransportCost(
  farmerLat:number, farmerLng:number,
  vehicle:string, ownership:string,
  mileageKmpl:number, fuelType:string, rentPerKm:number,
  topN=10
): TransportResult[] {
  // 1. cost_per_km
  let costPerKm: number
  if (ownership === 'own') {
    const fuelPrice = (vehicle==='tractor' || fuelType==='diesel') ? DIESEL_PRICE : CNG_PRICE
    costPerKm = fuelPrice / mileageKmpl
  } else {
    costPerKm = rentPerKm
  }

  // 2. Aerial distance for all 285 APMCs
  const withDist = APMC_DB.map(a => ({
    apmc: a,
    aerial_dist: haversine(farmerLat, farmerLng, a.lat, a.lng)
  }))

  // 3. Take nearest 20 (same as travel_expense.py)
  const nearest20 = withDist.sort((a,b)=>a.aerial_dist-b.aerial_dist).slice(0,20)

  // 4. For each: road_dist = aerial (OSRM runs backend), apply error bands
  const results: TransportResult[] = nearest20.map(({apmc, aerial_dist}) => {
    const road_dist = aerial_dist  // frontend proxy; backend uses real OSRM
    const error = apmc.conf==='HIGH' ? 2 : 4
    let min_dist = Math.max(road_dist - error, 0)
    let max_dist = road_dist + error
    if (ROUND_TRIP) { min_dist*=2; max_dist*=2 }
    const transport_cost_min = Math.round(min_dist * costPerKm)
    const transport_cost_max = Math.round(max_dist * costPerKm)
    return {
      apmc, aerial_dist, road_dist, cost_per_km: costPerKm,
      transport_cost_min, transport_cost_max,
      transport_cost_avg: Math.round((transport_cost_min+transport_cost_max)/2),
    }
  })

  // 5. Sort by road_dist, return top N
  return results.sort((a,b)=>a.road_dist-b.road_dist).slice(0,topN)
}

// ── Market result (profit calculation from profit_loss.py) ─────────────────
interface MarketResult {
  apmc: APMC
  road_dist: number
  route_duration_min: number
  route_path: LatLngPoint[]
  route_stops: string[]
  transport_cost_min: number
  transport_cost_max: number
  transport_cost_avg: number
  min_price: number
  avg_price: number
  max_price: number
  net_profit_min: number
  net_profit_avg: number
  net_profit_max: number
}

// Realistic modal price using seeded pseudo-random based on APMC + crop
function modalPriceFor(apmc:APMC, cropBase:number, qty:number): number {
  const seed = apmc.code.split('').reduce((s,c)=>s+c.charCodeAt(0),0) + cropBase
  const pseudo = (n:number) => ((Math.sin(seed*n*9301+49297)+1)/2)
  return Math.round(cropBase * (0.82 + pseudo(3)*0.36))
}

function buildMarketResults(
  transport: TransportResult[], cropBase:number, qty:number, farmerLat:number, farmerLng:number
): MarketResult[] {
  return transport.map(t => {
    const modal = modalPriceFor(t.apmc, cropBase, qty)
    const minP  = Math.round(modal * 0.86)
    const maxP  = Math.round(modal * 1.14)
    return {
      apmc: t.apmc,
      road_dist: t.road_dist,
      route_duration_min: Math.round((t.road_dist / 38) * 60),
      route_path: [
        [farmerLat, farmerLng] as LatLngPoint,
        [t.apmc.lat, t.apmc.lng] as LatLngPoint,
      ],
      route_stops: ['Farm Start', `${t.apmc.name} APMC`],
      transport_cost_min: t.transport_cost_min,
      transport_cost_max: t.transport_cost_max,
      transport_cost_avg: t.transport_cost_avg,
      min_price: minP,
      avg_price: modal,
      max_price: maxP,
      // profit_loss.py formula:
      net_profit_min: minP*qty - t.transport_cost_max,
      net_profit_avg: modal*qty - t.transport_cost_avg,
      net_profit_max: maxP*qty - t.transport_cost_min,
    }
  }).sort((a,b)=>b.net_profit_avg-a.net_profit_avg)
}

const VEHICLES = [
  {value:'tractor',label:'Tractor',mr:'ट्रॅक्टर',emoji:'🚜',cap:'50 Q'},
  {value:'pickup', label:'Pickup', mr:'पिकअप',   emoji:'🛻',cap:'20 Q'},
  {value:'tempo',  label:'Tempo',  mr:'टेम्पो',  emoji:'🚐',cap:'35 Q'},
  {value:'truck',  label:'Truck',  mr:'ट्रक',    emoji:'🚛',cap:'100 Q'},
]

const fmtINR=(n:number)=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(n)
const fmtL=(n:number)=>formatCompactCurrency(n)

function routeColorFor(i:number, total:number, bestIdx:number, nearestIdx:number): string {
  if (i === bestIdx) return '#0B63F3'   // best APMC
  if (i === nearestIdx) return '#16A34A' // nearest (not necessarily best)

  const others:number[] = []
  for (let idx = 0; idx < total; idx += 1) {
    if (idx !== bestIdx && idx !== nearestIdx) others.push(idx)
  }
  const pos = others.indexOf(i)
  if (pos < 0) return '#0EA5E9'

  // Keep least suggestions visually warm and distinct.
  if (pos === others.length - 1) return '#E11D48' // least suggested
  if (pos === others.length - 2) return '#F59E0B' // lower priority

  const palette = ['#8B5CF6', '#0EA5E9', '#F97316', '#EC4899', '#14B8A6', '#6366F1']
  return palette[pos % palette.length]
}

function hexToRgba(hex:string, alpha:number): string {
  const v = hex.replace('#', '')
  const n = v.length === 3
    ? v.split('').map(c => c + c).join('')
    : v
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type MapMode = 'street' | 'terrain' | 'dark'

const BASE_LAYER_ID: Record<MapMode, string> = {
  street: 'pl-base-street',
  terrain: 'pl-base-terrain',
  dark: 'pl-base-dark',
}

const MAP_MODE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    street_base: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
    terrain_base: {
      type: 'raster',
      tiles: [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenTopoMap contributors',
    },
    dark_base: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    { id: BASE_LAYER_ID.street, type: 'raster', source: 'street_base' },
    { id: BASE_LAYER_ID.terrain, type: 'raster', source: 'terrain_base', layout: { visibility: 'none' } },
    { id: BASE_LAYER_ID.dark, type: 'raster', source: 'dark_base', layout: { visibility: 'none' } },
  ],
}

function applyMapMode(map: maplibregl.Map, mode: MapMode) {
  ;(['street', 'terrain', 'dark'] as MapMode[]).forEach((m) => {
    const id = BASE_LAYER_ID[m]
    if (!map.getLayer(id)) return
    map.setLayoutProperty(id, 'visibility', m === mode ? 'visible' : 'none')
  })
}

function escapePopup(s:string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ProfitMapbox({
  lat,
  lng,
  markets,
  nearestIdx,
  selectedRouteIdx,
  onSelectMarket,
  lang,
}:{
  lat:number
  lng:number
  markets: MarketResult[]
  nearestIdx:number
  selectedRouteIdx:number
  onSelectMarket:(m:MarketResult)=>void
  lang:UiLang
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [mode, setMode] = useState<MapMode>('street')
  const mapMarketName = (market: MarketResult) => getLocalizedApmcName(market.apmc.name, market.apmc.nameMr, lang)
  const tr = (en: string, mr: string, hi: string) => trByLang(lang, en, mr, hi)

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: mapNodeRef.current,
      style: MAP_MODE_STYLE,
      center: [lng, lat],
      zoom: 9,
    })
    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')
    mapRef.current.once('load', () => {
      if (!mapRef.current) return
      applyMapMode(mapRef.current, mode)
      mapRef.current?.resize()
    })
    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const node = mapNodeRef.current
    if (!map || !node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    applyMapMode(map, mode)
    map.resize()
  }, [mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    const render = () => {
      if (cancelled) return
      const routeFeatures = markets
        .filter((m) => m.apmc.lat && m.apmc.lng)
        .map((m, i) => {
          const routePath = m.route_path?.length
            ? m.route_path
            : [[lat, lng] as LatLngPoint, [m.apmc.lat, m.apmc.lng] as LatLngPoint]
          const color = routeColorFor(i, markets.length, 0, nearestIdx)
          const hasSelection = selectedRouteIdx >= 0
          const isSelected = i === selectedRouteIdx
          const isMuted = hasSelection && !isSelected
          const weight = isSelected ? 7 : (i === 0 ? 6 : (i === nearestIdx ? 5 : 4))
          const opacity = isSelected ? 1 : (isMuted ? 0.25 : 0.85)
          return {
            type: 'Feature' as const,
            properties: {
              idx: i,
              color,
              halo: isSelected ? hexToRgba(color, 0.75) : 'rgba(15,23,42,0.26)',
              width: weight,
              opacity,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: routePath.map((p) => [p[1], p[0]]),
            },
          }
        })
      const routesData: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features: routeFeatures as any,
      }

      const layerIds = ['pl-route-main', 'pl-route-halo', 'pl-farmer-dot', 'pl-farmer-ring']
      layerIds.forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      if (map.getSource('pl-routes')) map.removeSource('pl-routes')
      if (map.getSource('pl-farmer')) map.removeSource('pl-farmer')

      map.addSource('pl-routes', { type: 'geojson', data: routesData })
      map.addLayer({
        id: 'pl-route-halo',
        type: 'line',
        source: 'pl-routes',
        paint: {
          'line-color': ['get', 'halo'],
          'line-width': ['+', ['get', 'width'], 4],
          'line-opacity': 0.7,
        },
      })
      map.addLayer({
        id: 'pl-route-main',
        type: 'line',
        source: 'pl-routes',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': ['get', 'opacity'],
        },
      })

      map.addSource('pl-farmer', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng, lat] } }],
        },
      })
      map.addLayer({
        id: 'pl-farmer-ring',
        type: 'circle',
        source: 'pl-farmer',
        paint: {
          'circle-radius': 16,
          'circle-color': hexToRgba(G.primary, 0.2),
          'circle-stroke-color': hexToRgba(G.primary, 0.6),
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'pl-farmer-dot',
        type: 'circle',
        source: 'pl-farmer',
        paint: {
          'circle-radius': 5,
          'circle-color': G.primary,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      const prevClick = (map as any).__plRouteClick as ((e:any)=>void) | undefined
      const prevEnter = (map as any).__plRouteEnter as (()=>void) | undefined
      const prevLeave = (map as any).__plRouteLeave as (()=>void) | undefined
      if (prevClick) map.off('click', 'pl-route-main', prevClick)
      if (prevEnter) map.off('mouseenter', 'pl-route-main', prevEnter)
      if (prevLeave) map.off('mouseleave', 'pl-route-main', prevLeave)

      const clickHandler = (e:any) => {
        const idx = Number((e.features?.[0]?.properties as any)?.idx)
        if (Number.isFinite(idx) && markets[idx]) onSelectMarket(markets[idx])
      }
      const enterHandler = () => { map.getCanvas().style.cursor = 'pointer' }
      const leaveHandler = () => { map.getCanvas().style.cursor = '' }
      ;(map as any).__plRouteClick = clickHandler
      ;(map as any).__plRouteEnter = enterHandler
      ;(map as any).__plRouteLeave = leaveHandler

      map.on('click', 'pl-route-main', clickHandler)
      map.on('mouseenter', 'pl-route-main', enterHandler)
      map.on('mouseleave', 'pl-route-main', leaveHandler)

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      const farmerPopup = new maplibregl.Popup({ offset: 14 }).setHTML(
        `<div style="font-size:12px"><strong>${tr('Farmer Location', 'शेतकरी ठिकाण', 'किसान स्थान')}</strong><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`,
      )
      const farmerMarker = new maplibregl.Marker({ color: G.primary }).setLngLat([lng, lat]).setPopup(farmerPopup).addTo(map)
      markersRef.current.push(farmerMarker)

      markets.forEach((m, i) => {
        if (!m.apmc.lat || !m.apmc.lng) return
        const badge = i === 0 ? '🏆 ' : (i === nearestIdx ? '📍 ' : '')
        const marketName = mapMarketName(m)
        const html = [
          `<div style="font-size:12px;min-width:180px">`,
          `<strong>${badge}${escapePopup(marketName)}</strong><br/>`,
          `${tr('Distance', 'अंतर', 'दूरी')}: ${m.road_dist.toFixed(1)} km<br/>`,
          `${tr('Duration', 'कालावधी', 'समय')}: ${Math.round(m.route_duration_min)} min<br/>`,
          `${tr('Price', 'भाव', 'भाव')}: ₹${fmtINR(m.avg_price)}/q<br/>`,
          `<strong>${tr('Profit', 'नफा', 'मुनाफा')}: ${fmtL(m.net_profit_avg)}</strong>`,
          `</div>`,
        ].join('')
        const markerEl = document.createElement('div')
        markerEl.style.width = i === 0 ? '16px' : '13px'
        markerEl.style.height = i === 0 ? '16px' : '13px'
        markerEl.style.borderRadius = '50%'
        markerEl.style.border = '2px solid #ffffff'
        markerEl.style.boxShadow = '0 2px 8px rgba(2,6,23,0.35)'
        markerEl.style.cursor = 'pointer'
        markerEl.style.background = routeColorFor(i, markets.length, 0, nearestIdx)
        markerEl.onclick = () => onSelectMarket(m)
        const popup = new maplibregl.Popup({ offset: 16 }).setHTML(html)
        const marker = new maplibregl.Marker({ element: markerEl }).setLngLat([m.apmc.lng, m.apmc.lat]).setPopup(popup).addTo(map)
        markersRef.current.push(marker)
      })

      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([lng, lat])
      markets.forEach((m) => {
        if (m.apmc.lat && m.apmc.lng) bounds.extend([m.apmc.lng, m.apmc.lat])
      })
      map.resize()
      map.fitBounds(bounds, { padding: 42, duration: 550, maxZoom: 11 })
    }

    if (map.isStyleLoaded()) {
      render()
    } else {
      map.once('load', render)
    }
    return () => { cancelled = true }
  }, [lat, lng, markets, nearestIdx, selectedRouteIdx, onSelectMarket, lang])

  return (
    <div className="relative h-full w-full">
      <div ref={mapNodeRef} className="h-full w-full" />
      <div className="absolute top-3 left-3 z-10 flex gap-1 rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.92)', border: `1px solid ${G.border}` }}>
        {([
          ['street', tr('Street', 'सामान्य', 'सामान्य')],
          ['terrain', tr('Terrain', 'टोपो', 'टोपो')],
          ['dark', tr('Dark', 'डार्क', 'डार्क')],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: mode === id ? G.primary : 'transparent',
              color: mode === id ? '#fff' : G.muted,
            }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Rank badge ─────────────────────────────────────────────────────────────
function RankBadge({rank}:{rank:number}) {
  return <span className="text-[18px]">{['🏆','🥈','🥉','4️⃣','5️⃣'][rank-1]||`${rank}`}</span>
}

// ── Profit range bar ───────────────────────────────────────────────────────
function ProfitBar({min,avg,max,maxV}:{min:number;avg:number;max:number;maxV:number}) {
  const p=(v:number)=>Math.max(0,Math.min(100,(v/maxV)*100))
  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{background:'rgba(26,77,46,0.08)'}}>
      <div className="absolute h-full rounded-full opacity-25"
        style={{left:`${p(min)}%`,width:`${p(max)-p(min)}%`,background:G.primary}}/>
      <div className="absolute h-full w-2.5 rounded-full -translate-x-1/2"
        style={{left:`${p(avg)}%`,background:G.primary,boxShadow:`0 0 5px ${G.primary}`}}/>
    </div>
  )
}

// ── Price tooltip ──────────────────────────────────────────────────────────
const PTip=({active,payload,label}:any)=>{
  if(!active||!payload?.length) return null
  return (
    <div className="rounded-2xl px-4 py-3 text-xs shadow-xl"
      style={{background:G.ink,border:`1px solid ${G.border}`}}>
      <div className="font-semibold mb-0.5" style={{color:'rgba(255,255,255,0.5)'}}>{label}</div>
      <div className="font-black text-[14px]" style={{color:G.primary}}>₹{fmtINR(payload[0].value)}/q</div>
    </div>
  )
}

// ── 7-day trend (seeded per crop) ──────────────────────────────────────────
function trendData(cropEn:string, base:number) {
  const seed=cropEn.charCodeAt(0)
  const p=(n:number)=>((Math.sin(seed*n*9301+49297)+1)/2)
  const trend=p(99)>0.5?5:-4
  let price=base*(0.78+p(7)*0.12)
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>{
    price=Math.max(base*0.5,price+(p(i+1)-0.43)*base*0.04+trend)
    return {date:d,price:Math.round(price)}
  })
}

function roundCoord(v:number, digits = 5): number {
  const d = Math.pow(10, digits)
  return Math.round(v * d) / d
}

function readSessionJson<T>(key:string, fallback:T): T {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeSessionJson<T>(key:string, value:T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore session storage errors.
  }
}

function mapProfitRows(rows:any[], _qty:number, lat:number, lng:number): MarketResult[] {
  return rows
    .map((r:any) => {
      const apmcCode = String(r.apmc_code || '').trim()
      const apmcName = String(r.apmc_name || '').trim()
      const apmcNameMr = String(r.apmc_name_mr || '').trim()
      const fallbackApmc =
        APMC_DB.find((entry) => String(entry.code || '').trim() === apmcCode)
        || getApmcByName(apmcName)
      const apmcLatRaw = Number(r.latitude ?? fallbackApmc?.lat ?? 0)
      const apmcLngRaw = Number(r.longitude ?? fallbackApmc?.lng ?? 0)
      const apmcLat = Number.isFinite(apmcLatRaw) ? apmcLatRaw : 0
      const apmcLng = Number.isFinite(apmcLngRaw) ? apmcLngRaw : 0
      const avg_price = Number(r.avg_price ?? r.modal_price ?? r.price_per_quintal_rs ?? 0)
      const min_price = Number(r.min_price ?? r.min_price_rs ?? 0)
      const max_price = Number(r.max_price ?? r.max_price_rs ?? 0)
      const transport_cost_min = Number(r.transport_cost_min_rs ?? r.transport_cost_min ?? 0)
      const transport_cost_max = Number(r.transport_cost_max_rs ?? r.transport_cost_max ?? 0)
      const transport_cost_avg = Number(r.transport_cost_avg_rs ?? r.transport_cost_avg ?? 0)
      const net_profit_min = Number(r.net_profit_min_rs ?? r.net_profit_min ?? 0)
      const net_profit_avg = Number(r.net_profit_avg_rs ?? r.net_profit_avg ?? 0)
      const net_profit_max = Number(r.net_profit_max_rs ?? r.net_profit_max ?? 0)
      const durationMinRaw = Number(r.route_duration_min ?? 0)
      const route_duration_min = Number.isFinite(durationMinRaw) && durationMinRaw > 0
        ? durationMinRaw
        : 0
      const route_path = sanitizeRoutePath(
        r.route_path,
        [lat, lng],
        [apmcLat, apmcLng],
      )
      const route_stops = Array.isArray(r.route_stops)
        ? r.route_stops.map((s:any) => String(s || '').trim()).filter((s:string) => !!s)
        : []
      const roadDistRaw = Number(r.distance_km ?? r.road_dist ?? 0)
      const road_dist = Number.isFinite(roadDistRaw) ? roadDistRaw : 0

      return {
        apmc: {
          code: apmcCode || String(fallbackApmc?.code || ''),
          name: apmcName || String(fallbackApmc?.name || ''),
          nameMr: apmcNameMr || String(fallbackApmc?.nameMr || ''),
          district: String(r.district || fallbackApmc?.district || ''),
          lat: apmcLat,
          lng: apmcLng,
          conf: String(r.confidence || fallbackApmc?.conf || 'HIGH').toUpperCase() === 'LOW' ? 'LOW' : 'HIGH',
        },
        road_dist,
        route_duration_min,
        route_path,
        route_stops,
        transport_cost_min,
        transport_cost_max,
        transport_cost_avg,
        min_price,
        avg_price,
        max_price,
        net_profit_min,
        net_profit_avg,
        net_profit_max,
      } as MarketResult
    })
    .filter((item) => !!item.apmc.name)
}

type LocationSource = 'google' | 'browser' | 'ipinfo'
type DetectedLocation = { lat: number; lng: number; source: LocationSource; accuracy?: number; address?: string }
type CachedLocation = { lat?: number; lng?: number; address?: string; source?: LocationSource; accuracy?: number; ts?: number }

function pickBetterLocation(current: DetectedLocation | null, next: DetectedLocation): DetectedLocation {
  if (!current) return next
  const currentAccuracy = Number.isFinite(current.accuracy) && Number(current.accuracy) > 0
    ? Number(current.accuracy)
    : (current.source === 'ipinfo' ? 25_000 : Number.POSITIVE_INFINITY)
  const nextAccuracy = Number.isFinite(next.accuracy) && Number(next.accuracy) > 0
    ? Number(next.accuracy)
    : (next.source === 'ipinfo' ? 25_000 : Number.POSITIVE_INFINITY)

  if (current.source === 'ipinfo' && next.source !== 'ipinfo') return next
  if (current.source !== 'ipinfo' && next.source === 'ipinfo' && currentAccuracy <= 20_000) return current
  if (nextAccuracy + 100 < currentAccuracy) return next
  if (currentAccuracy + 100 < nextAccuracy) return current
  if (current.source === 'browser' && next.source === 'google') return current
  if (current.source === 'google' && next.source === 'browser') return next
  return nextAccuracy <= currentAccuracy ? next : current
}

function isReliableCachedLocation(cached: CachedLocation | null | undefined): cached is CachedLocation {
  const lat = Number(cached?.lat)
  const lng = Number(cached?.lng)
  const ts = Number(cached?.ts || 0)
  const accuracy = Number(cached?.accuracy || 0)
  const ageMs = Date.now() - ts
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (cached?.source === 'browser' || cached?.source === 'ipinfo') &&
    Number.isFinite(ts) &&
    ageMs >= 0 &&
    ageMs <= LOCATION_CACHE_MAX_AGE_MS &&
    (cached?.source === 'ipinfo' || !accuracy || accuracy <= 500)
  )
}

function parseIpInfoCoords(payload: any): { lat: number; lng: number } | null {
  const loc = String(payload?.loc || '').trim()
  if (loc.includes(',')) {
    const [latRaw, lngRaw] = loc.split(',')
    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }

  const lat = Number(payload?.geo?.latitude ?? payload?.latitude)
  const lng = Number(payload?.geo?.longitude ?? payload?.longitude)
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  return null
}

async function fetchIpInfoLocation(): Promise<DetectedLocation> {
  const tokenQuery = IPINFO_TOKEN ? `?token=${encodeURIComponent(IPINFO_TOKEN)}` : ''
  const res = await fetch(`https://ipinfo.io/json${tokenQuery}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(3500),
  })
  if (!res.ok) {
    throw new Error(`IPInfo lookup failed (${res.status})`)
  }
  const payload = await res.json().catch(() => ({}))
  const coords = parseIpInfoCoords(payload)
  if (!coords) {
    throw new Error('IPInfo coordinates unavailable')
  }

  const city = String(payload?.city || payload?.geo?.city || '').trim()
  const region = String(payload?.region || payload?.geo?.region || '').trim()
  const country = String(payload?.country || payload?.geo?.country || '').trim()

  return {
    lat: coords.lat,
    lng: coords.lng,
    source: 'ipinfo',
    accuracy: 25000,
    address: joinAddressParts([city, region, country]),
  }
}

function getBrowserGeoLocation(): Promise<DetectedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Number(pos.coords.latitude),
          lng: Number(pos.coords.longitude),
          source: 'browser',
          accuracy: Number(pos.coords.accuracy || 0),
        })
      },
      (err) => reject(err),
      GEO_OPTIONS,
    )
  })
}

function watchBrowserGeoLocation(sampleWindowMs = 3800): Promise<DetectedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    let best: DetectedLocation | null = null
    let settled = false
    let samples = 0
    let lastError: GeolocationPositionError | null = null

    const finish = (value?: DetectedLocation, err?: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      navigator.geolocation.clearWatch(watchId)
      if (value) resolve(value)
      else reject(err || lastError || new Error('Unable to detect accurate location'))
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        samples += 1
        best = pickBetterLocation(best, {
          lat: Number(pos.coords.latitude),
          lng: Number(pos.coords.longitude),
          source: 'browser',
          accuracy: Number(pos.coords.accuracy || 0),
        })
        const accuracy = Number(best?.accuracy || 0)
        // Accept location if high accuracy (<=25m) OR after 5 samples OR after 6 seconds
        if ((Number.isFinite(accuracy) && accuracy > 0 && accuracy <= 25) || samples >= 5) {
          finish(best)
        }
      },
      (err) => {
        lastError = err
        if (best) {
          finish(best)
          return
        }
        getBrowserGeoLocation().then((fallback) => finish(fallback)).catch((fallbackErr) => finish(undefined, fallbackErr))
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 3000,
      },
    )

    const timer = window.setTimeout(() => {
      if (best) {
        finish(best)
        return
      }
      getBrowserGeoLocation().then((fallback) => finish(fallback)).catch((fallbackErr) => finish(undefined, fallbackErr))
    }, sampleWindowMs)
  })
}

async function detectBrowserLocation(): Promise<DetectedLocation> {
  try {
    return await watchBrowserGeoLocation()
  } catch {
    return getBrowserGeoLocation()
  }
}

function firstResolvedLocation(promises: Array<Promise<DetectedLocation | null>>): Promise<DetectedLocation | null> {
  return new Promise((resolve) => {
    if (!promises.length) {
      resolve(null)
      return
    }
    let pending = promises.length
    let settled = false

    const finish = (value: DetectedLocation | null) => {
      if (!settled) {
        settled = true
        resolve(value)
      }
    }

    promises.forEach((promise) => {
      promise
        .then((value) => {
          if (settled) return
          if (value) {
            finish(value)
            return
          }
          pending -= 1
          if (pending === 0) finish(null)
        })
        .catch(() => {
          pending -= 1
          if (!settled && pending === 0) finish(null)
        })
    })
  })
}

function joinAddressParts(parts: Array<string | undefined | null>): string {
  const seen = new Set<string>()
  const clean = parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  return clean.join(', ')
}

function formatGoogleAddress(result: any): string {
  const components = Array.isArray(result?.address_components) ? result.address_components : []
  const part = (...types: string[]) => {
    const found = components.find((entry: any) => {
      const entryTypes = Array.isArray(entry?.types) ? entry.types : []
      return types.some((type) => entryTypes.includes(type))
    })
    return String(found?.long_name || '').trim()
  }

  // Build complete address with all useful components
  const street = joinAddressParts([
    part('street_number'),
    part('route'),
    part('premise'),
    part('subpremise'),
  ])
  
  const locality = part('locality') || part('sublocality') || part('sublocality_level_1') || part('administrative_area_level_3')
  const taluka = part('administrative_area_level_3') || part('administrative_area_level_2')
  const district = part('administrative_area_level_2')
  const state = part('administrative_area_level_1')
  const postal = part('postal_code')
  const country = part('country')

  return (
    joinAddressParts([
      street,
      locality,
      taluka !== locality ? taluka : '',
      district !== taluka ? district : '',
      state !== district ? state : '',
      postal,
      country,
    ]) || String(result?.formatted_address || '').trim()
  )
}

function formatNominatimAddress(payload: any): string {
  const address = payload?.address || {}
  
  // Include more address components for better accuracy
  const street = joinAddressParts([
    address?.house_number,
    address?.house_name,
    address?.road,
    address?.footway,
  ])

  const village = address?.village || address?.hamlet || address?.isolated_dwelling
  const suburb = address?.suburban || address?.suburb || address?.municipality
  const city = address?.town || address?.city || address?.isolated_dwelling
  const county = address?.county || address?.state_district
  const state = address?.state || address?.province
  const district = address?.state_district || address?.county
  const postal = address?.postcode
  const country = address?.country

  return (
    joinAddressParts([
      street,
      village,
      suburb,
      city,
      county,
      district !== county ? district : '',
      state !== district ? state : '',
      postal,
      country,
    ]) || String(payload?.display_name || '').trim()
  )
}

async function reverseGeocodeAddress(lat:number, lng:number): Promise<string> {
  const q = `${roundCoord(lat, 6)},${roundCoord(lng, 6)}`
  const cached = readSessionJson<Record<string, string>>(GEO_ADDRESS_CACHE_KEY, {})
  if (cached[q]) return cached[q]
  
  let result = ''
  let lastError: Error | null = null

  // Try Google Maps first (if API key available)
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=${encodeURIComponent(navigator.language || 'en-IN')}&key=${GOOGLE_MAPS_API_KEY}`
      const googleRes = await fetch(googleUrl, { signal: AbortSignal.timeout(8000) })
      const googlePayload = await googleRes.json().catch(() => ({}))
      const status = String(googlePayload?.status || '')
      const formatted = formatGoogleAddress(googlePayload?.results?.[0])
      if (googleRes.ok && status === 'OK' && formatted) {
        result = formatted
        cached[q] = result
        writeSessionJson(GEO_ADDRESS_CACHE_KEY, cached)
        return result
      }
    } catch (err) {
      lastError = err as Error
      console.warn('[Location] Google Geocoding failed:', lastError.message)
    }
  }

  // Fallback to Nominatim with retry
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`
    const nominatimRes = await fetch(nominatimUrl, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': navigator.language || 'en-IN',
        'User-Agent': 'SEVA-FarmApp/1.0',
      },
      signal: AbortSignal.timeout(8000),
    })
    
    if (nominatimRes.ok) {
      const nominatimPayload = await nominatimRes.json()
      result = formatNominatimAddress(nominatimPayload)
      if (result) {
        cached[q] = result
        writeSessionJson(GEO_ADDRESS_CACHE_KEY, cached)
        return result
      }
    }
  } catch (err) {
    lastError = err as Error
    console.warn('[Location] Nominatim Geocoding failed:', lastError.message)
  }

  // Fallback: find nearest APMC and build address from it
  try {
    const nearbyAPMCs = APMC_DB
      .map(a => ({ ...a, dist: haversine(lat, lng, a.lat, a.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)

    if (nearbyAPMCs.length > 0) {
      const nearest = nearbyAPMCs[0]
      result = `${nearest.name}, ${nearest.district} District, Maharashtra`
      if (nearbyAPMCs.some(a => a.dist > 50)) {
        result += ` (~${Math.round(nearest.dist)} km away)`
      }
      cached[q] = result
      writeSessionJson(GEO_ADDRESS_CACHE_KEY, cached)
      return result
    }
  } catch (err) {
    console.warn('[Location] APMC fallback failed:', err)
  }

  // Final fallback: generic coordinates
  result = `Location (${roundCoord(lat, 4)}°N, ${roundCoord(lng, 4)}°E)`
  cached[q] = result
  writeSessionJson(GEO_ADDRESS_CACHE_KEY, cached)
  return result
}

function cropImageTitles(cropEn:string): string[] {
  const key = String(cropEn || '').trim().toLowerCase()
  const label = marketCropEnLabel(key).replace(/\s+/g, ' ').trim()
  const aliases: Record<string, string[]> = {
    fig: ['Common fig', 'Fig'],
    fig_dry: ['Dried fig', 'Dried figs'],
    ambadi_leaves: ['Roselle leaves', 'Gongura'],
    taro: ['Taro'],
    sorrel_leaves: ['Roselle leaves', 'Sorrel'],
    amla: ['Indian gooseberry', 'Amla'],
    black_gram: ['Black gram', 'Urad bean'],
    black_gram_dal: ['Urad dal', 'Split black gram'],
    carom: ['Ajwain', 'Carom seeds'],
    curry_leaves: ['Curry leaves'],
    raw_mango: ['Raw mango', 'Green mango'],
    horse_gram: ['Horse gram'],
    raw_banana: ['Plantain', 'Green banana'],
    kairi: ['Raw mango', 'Green mango'],
    khapli_wheat: ['Emmer wheat', 'Khapli wheat'],
    cluster_beans: ['Cluster bean', 'Guar'],
    chickoo: ['Sapodilla', 'Chikoo'],
    jowar: ['Sorghum', 'Jowar'],
    tur: ['Pigeon pea', 'Arhar'],
    tur_dal: ['Toor dal', 'Split pigeon pea'],
    ivy_gourd: ['Ivy gourd', 'Tindora'],
    bottle_gourd_alt: ['Bottle gourd'],
    ragi: ['Finger millet', 'Ragi'],
    sweet_lime: ['Sweet lime', 'Mosambi'],
    custard_apple: ['Custard apple', 'Sugar apple'],
    custard_apple_alt: ['Custard apple', 'Sugar apple'],
    groundnut: ['Peanut', 'Groundnut'],
    groundnut_green: ['Peanut', 'Groundnut plant'],
    groundnut_dry: ['Peanut', 'Groundnut'],
    chickpea: ['Chickpea', 'Chickpea seed'],
    soybean: ['Soybean', 'Soybean seed'],
    brinjal: ['Eggplant', 'Brinjal'],
    capsicum: ['Bell pepper', 'Capsicum'],
    dry_garlic: ['Garlic'],
    peas_dry: ['Dry pea', 'Dried peas'],
    betel_nut: ['Areca nut', 'Betel nut'],
    yam_elephant: ['Elephant foot yam'],
    salad: ['Lettuce'],
    chickpea_dal: ['Chana dal', 'Split chickpea'],
    green_gram: ['Mung bean', 'Green gram'],
    green_gram_dal: ['Moong dal', 'Split mung bean'],
    sesame: ['Sesame'],
    fenugreek_seed: ['Fenugreek', 'Fenugreek seeds'],
    fenugreek_leaves: ['Fenugreek', 'Methi leaves'],
    dry_ginger: ['Ginger'],
    turmeric: ['Turmeric', 'Turmeric root'],
  }
  return Array.from(new Set([...(aliases[key] || []), label, `${label} crop`].filter(Boolean)))
}

function cropImageQuery(cropEn:string): string {
  return cropImageTitles(cropEn)[0] || `${marketCropEnLabel(cropEn)} crop`
}

function isLikelyRealCropPhoto(title: string): boolean {
  const t = String(title || '').toLowerCase()
  if (!t) return false
  const banned = [
    'diagram', 'icon', 'logo', 'map', 'svg', 'drawing', 'chart', 'illustration', 'clipart',
    'coat of arms', 'flag', 'emblem', 'pattern', 'poster', 'seal', 'symbol',
  ]
  return !banned.some((x) => t.includes(x))
}

function scoreCropImageCandidate(title: string, cropEn: string): number {
  const key = String(cropEn || '').trim().toLowerCase()
  const titleLc = String(title || '').toLowerCase()
  const aliases = cropImageTitles(key).map((entry) => entry.toLowerCase())
  let score = 0

  for (const alias of aliases) {
    if (!alias) continue
    if (titleLc === alias) score += 120
    else if (titleLc.includes(alias)) score += 70
  }

  if (titleLc.includes('fruit') || titleLc.includes('vegetable') || titleLc.includes('seed') || titleLc.includes('pod')) score += 8
  if (titleLc.includes('plant')) score += 4
  if (titleLc.includes('field') || titleLc.includes('farm') || titleLc.includes('harvest')) score -= 22
  if (!isLikelyRealCropPhoto(titleLc)) score -= 200
  return score
}

async function fetchWikipediaTitleImage(title: string): Promise<string> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=760&titles=${encodeURIComponent(title)}`
  const res = await fetch(url)
  if (!res.ok) return ''
  const payload = await res.json().catch(() => ({}))
  const pages = Object.values(payload?.query?.pages || {}) as any[]
  const picked = pages.find((page) => !!String(page?.thumbnail?.source || '').trim())
  return String(picked?.thumbnail?.source || '').trim()
}

async function fetchCropReferenceImage(cropEn:string): Promise<string> {
  const key = String(cropEn || '').trim().toLowerCase()
  if (!key) return ''
  const cache = readSessionJson<Record<string, string>>(CROP_IMAGE_CACHE_KEY, {})
  if (cache[key]) return cache[key]

  for (const title of cropImageTitles(key)) {
    const exact = await fetchWikipediaTitleImage(title)
    if (exact) {
      cache[key] = exact
      writeSessionJson(CROP_IMAGE_CACHE_KEY, cache)
      return exact
    }
  }

  const commonsSearch = encodeURIComponent(cropImageQuery(key))
  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=6&gsrsearch=${commonsSearch}&gsrlimit=24&prop=imageinfo&iiprop=url|mime&iiurlwidth=760`
  const commonsRes = await fetch(commonsUrl)
  if (commonsRes.ok) {
    const commonsPayload = await commonsRes.json().catch(() => ({}))
    const pages = Object.values(commonsPayload?.query?.pages || {}) as any[]
    const candidate = pages
      .map((p) => ({
        score: scoreCropImageCandidate(String(p?.title || ''), key),
        src: String(p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url || '').trim(),
        mime: String(p?.imageinfo?.[0]?.mime || ''),
      }))
      .filter((p) => p.score > 0 && p.mime.startsWith('image/') && !p.mime.includes('svg') && !!p.src)
      .sort((a, b) => b.score - a.score)[0]

    if (candidate?.src) {
      cache[key] = candidate.src
      writeSessionJson(CROP_IMAGE_CACHE_KEY, cache)
      return candidate.src
    }
  }

  const fallbackQuery = encodeURIComponent(cropImageQuery(key))
  const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${fallbackQuery}&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=760`
  const fallbackRes = await fetch(fallbackUrl)
  if (!fallbackRes.ok) throw new Error(`Image lookup failed: ${fallbackRes.status}`)
  const fallbackPayload = await fallbackRes.json().catch(() => ({}))
  const fallbackPages = Object.values(fallbackPayload?.query?.pages || {}) as any[]
  const fallbackPick = fallbackPages
    .map((page) => ({
      score: scoreCropImageCandidate(String(page?.title || ''), key),
      src: String(page?.thumbnail?.source || '').trim(),
    }))
    .filter((page) => page.score > 0 && !!page.src)
    .sort((a, b) => b.score - a.score)[0]

  const src = String(fallbackPick?.src || '').trim()
  if (!src) throw new Error('Image not found')
  cache[key] = src
  writeSessionJson(CROP_IMAGE_CACHE_KEY, cache)
  return src
}

// ══════════════════════════════════════════════════════════════════════════
type Step='input'|'loading'|'results'

export default function ProfitLossPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { toast } = useApp()
  const lang = resolveAppLang(localStorage.getItem('aarth_language') || 'en')
  const isMr = lang === 'mr'
  const isHi = lang === 'hi'
  const tr = (en: string, mr: string, hi: string) => trByLang(lang, en, mr, hi)

  const [step,setStep]=useState<Step>('input')
  const [crop,setCrop]=useState('')
  const [qty,setQty]=useState(50)
  const [lat,setLat]=useState(18.5204)  // Pune default
  const [lng,setLng]=useState(73.8567)
  const [vehicle,setVehicle]=useState('tractor')
  const [ownership,setOwnership]=useState<'own'|'rented'>('own')
  const [mileage,setMileage]=useState(5)
  const [fuelType,setFuelType]=useState<'diesel'|'cng'>('diesel')
  const [rentPerKm,setRentPerKm]=useState(25)
  const [locating,setLocating]=useState(false)
  const [locDetected,setLocDetected]=useState(false)
  const [locationAddress, setLocationAddress] = useState('')
  const [addressLoading, setAddressLoading] = useState(false)
  const [err,setErr]=useState<string|null>(null)
  const [crops,setCrops]=useState<MarketCrop[]>(() => getFallbackMarketCrops())
  const [cropsLoading,setCropsLoading]=useState(false)
  const [cropImageUrl, setCropImageUrl] = useState('')
  const [cropImageLoading, setCropImageLoading] = useState(false)

  const [markets,setMarkets]=useState<MarketResult[]>([])
  const [activeMarket,setActiveMarket]=useState<MarketResult|null>(null)
  const [activeTab,setActiveTab]=useState<'where'|'when'>('where')
  const [trend,setTrend]=useState<any[]>([])

  const selectedCrop=crops.find(c=>c.en===crop)
  const prioritizedCrops = useMemo(() => prioritizeMarketCrops(crops), [crops])
  const topCropChoices = useMemo(() => prioritizedCrops.slice(0, 14), [prioritizedCrops])
  const cropGroups = useMemo(() => groupMarketCropsByCategory(prioritizedCrops), [prioritizedCrops])

  useEffect(() => {
    if (!crop && crops.length) setCrop(crops[0].en)
  }, [crop, crops])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PROFIT_STATE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as any
      if (!parsed || !Array.isArray(parsed?.markets) || !parsed.markets.length) return
      setCrop(String(parsed.crop || ''))
      setQty(Number(parsed.qty || 50))
      setLat(Number(parsed.lat || 18.5204))
      setLng(Number(parsed.lng || 73.8567))
      setVehicle(String(parsed.vehicle || 'tractor'))
      setOwnership(parsed.ownership === 'rented' ? 'rented' : 'own')
      setMileage(Number(parsed.mileage || 5))
      setFuelType(parsed.fuelType === 'cng' ? 'cng' : 'diesel')
      setRentPerKm(Number(parsed.rentPerKm || 25))
      setMarkets(parsed.markets)
      const idx = Math.max(0, Number(parsed.activeMarketIdx || 0))
      setActiveMarket(parsed.markets[idx] || parsed.markets[0] || null)
      setActiveTab(parsed.activeTab === 'when' ? 'when' : 'where')
      setTrend(Array.isArray(parsed.trend) ? parsed.trend : [])
      setStep('results')
    } catch {
      // Ignore stale persisted payloads.
    }
  }, [])

  useEffect(() => {
    if (step !== 'results' || !markets.length) return
    const activeMarketIdx = activeMarket
      ? Math.max(0, markets.findIndex((m) => m.apmc.code === activeMarket.apmc.code && m.road_dist === activeMarket.road_dist))
      : 0
    const payload = {
      crop,
      qty,
      lat,
      lng,
      vehicle,
      ownership,
      mileage,
      fuelType,
      rentPerKm,
      markets,
      activeMarketIdx,
      activeTab,
      trend,
    }
    sessionStorage.setItem(PROFIT_STATE_KEY, JSON.stringify(payload))
  }, [step, crop, qty, lat, lng, vehicle, ownership, mileage, fuelType, rentPerKm, markets, activeMarket, activeTab, trend])

  useEffect(() => {
    if (step === 'loading' && markets.length) {
      setStep('results')
    }
  }, [step, markets.length])

  useEffect(()=>{
    let cancelled = false
    async function loadCrops() {
      try {
        setCropsLoading(true)
        const list = await fetchMarketCrops(API_BASE)
        if (!cancelled) {
          setCrops(list)
          if (list.length) setCrop((prev) => prev || list[0].en)
        }
      } catch (e:any) {
        if (!cancelled) {
          setErr(e?.message || 'Failed to load crop list')
        }
      } finally {
        if (!cancelled) setCropsLoading(false)
      }
    }
    loadCrops()
    return ()=>{ cancelled = true }
  }, [])

  function applyDetectedLocation(loc: DetectedLocation) {
    setLat(loc.lat)
    setLng(loc.lng)
    setLocDetected(true)
    setLocationAddress(loc.address || '')
    writeSessionJson(PROFIT_LOCATION_CACHE_KEY, {
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address || '',
      source: loc.source,
      accuracy: loc.accuracy,
      ts: Date.now(),
    })
  }

  async function detectLocation(){
    setLocating(true)
    try {
      const ipInfoPromise = fetchIpInfoLocation().catch(() => null)
      const browserPromise = detectBrowserLocation().catch(() => null)
      const preferredBrowser = await Promise.race<DetectedLocation | null>([
        browserPromise,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 4500)),
      ])
      const firstHit = preferredBrowser || await ipInfoPromise || await browserPromise
      if (!firstHit) {
        throw new Error('Unable to detect location')
      }

      applyDetectedLocation(firstHit)

      const [browserLoc, ipInfoLoc] = await Promise.all([browserPromise, ipInfoPromise])
      const candidateLocations = [firstHit, browserLoc, ipInfoLoc].filter((candidate): candidate is DetectedLocation => !!candidate)
      const bestLocation = candidateLocations.reduce<DetectedLocation | null>(
        (best, candidate) => pickBetterLocation(best, candidate),
        null,
      )

      if (
        bestLocation &&
        (
          roundCoord(bestLocation.lat, 5) !== roundCoord(firstHit.lat, 5) ||
          roundCoord(bestLocation.lng, 5) !== roundCoord(firstHit.lng, 5) ||
          bestLocation.source !== firstHit.source
        )
      ) {
        applyDetectedLocation(bestLocation)
      }
    } finally {
      setLocating(false)
    }
  }

  // Auto-load stable location cache, then detect fresh location if cache unavailable.
  useEffect(() => {
    const cached = readSessionJson<CachedLocation | null>(PROFIT_LOCATION_CACHE_KEY, null)
    if (isReliableCachedLocation(cached)) {
      setLat(Number(cached.lat))
      setLng(Number(cached.lng))
      setLocDetected(true)
      if (cached.address) setLocationAddress(String(cached.address))
      if (cached.source === 'browser' && (!cached.accuracy || Number(cached.accuracy) <= 100)) {
        return
      }
    }
    detectLocation().catch(() => {})
  }, [])

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    let cancelled = false
    const timer = setTimeout(() => {
      setAddressLoading(true)
      reverseGeocodeAddress(lat, lng)
        .then((label) => {
          if (!cancelled) {
            setLocationAddress(label)
            const prev = readSessionJson<any>(PROFIT_LOCATION_CACHE_KEY, {})
            writeSessionJson(PROFIT_LOCATION_CACHE_KEY, {
              ...prev,
              lat,
              lng,
              address: label,
              ts: Date.now(),
            })
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLocationAddress((prev) => prev)
          }
        })
        .finally(() => {
          if (!cancelled) setAddressLoading(false)
        })
    }, 280)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [lat, lng])

  useEffect(() => {
    if (!crop) {
      setCropImageUrl('')
      return
    }
    let cancelled = false
    setCropImageLoading(true)
    fetchCropReferenceImage(crop)
      .then((src) => {
        if (!cancelled) setCropImageUrl(src)
      })
      .catch(() => {
        if (!cancelled) setCropImageUrl('')
      })
      .finally(() => {
        if (!cancelled) setCropImageLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [crop])

  async function handleSubmit(){
    if(!crop) return
    if(false){
      toast(
        isMr
          ? 'बाजार विश्लेषणासाठी लॉगिन आवश्यक आहे.'
          : isHi
            ? 'बाजार विश्लेषण के लिए लॉगिन आवश्यक है।'
            : 'Login is required to analyze market profit.',
        'info'
      )
      navigate('/login')
      return
    }
    setErr(null)
    setMarkets([])
    setActiveMarket(null)
    setTrend([])
    setStep('loading')
    try {
      const body={
        crop_en:crop, quantity_quintal:qty,
        farmer_lat:lat, farmer_lon:lng,
        vehicle_type:vehicle, ownership,
        mileage_kmpl:ownership==='own'?mileage:null,
        fuel_type:ownership==='own'&&vehicle!=='tractor'?fuelType:null,
        rent_per_km:ownership==='rented'?rentPerKm:null,
      }
      const cacheKey = JSON.stringify({
        crop_en: body.crop_en,
        quantity_quintal: body.quantity_quintal,
        farmer_lat: roundCoord(Number(body.farmer_lat), 4),
        farmer_lon: roundCoord(Number(body.farmer_lon), 4),
        vehicle_type: body.vehicle_type,
        ownership: body.ownership,
        mileage_kmpl: body.mileage_kmpl,
        fuel_type: body.fuel_type,
        rent_per_km: body.rent_per_km,
      })
      const queryCache = readSessionJson<Record<string, { ts: number; payload: any }>>(PROFIT_QUERY_CACHE_KEY, {})
      const now = Date.now()
      const cached = queryCache[cacheKey]

      let d:any
      if (cached && (now - Number(cached.ts || 0)) < 30 * 60 * 1000) {
        d = cached.payload
      } else {
        const res=await fetch(`${API_BASE}/api/profit-loss`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify(body)
        })
        if(!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(String(payload?.detail || `HTTP ${res.status}`))
        }
        d = await res.json()
        queryCache[cacheKey] = { ts: now, payload: d }
        writeSessionJson(PROFIT_QUERY_CACHE_KEY, queryCache)
      }

      const rawRows = Array.isArray(d?.results) ? d.results : (Array.isArray(d) ? d : [])
      const results = mapProfitRows(rawRows, qty, lat, lng)
      if (!results.length) throw new Error('No market results returned.')
      setMarkets(results)
      setActiveMarket(results[0]??null)
      const trendBase = results[0]?.avg_price || 2000
      setTrend(trendData(crop, trendBase))
      setActiveTab('where')
      setStep('results')
    } catch(e:any){
      setErr(e.message||'Error'); setStep('input')
    }
  }

  function handleNewSearch() {
    sessionStorage.removeItem(PROFIT_STATE_KEY)
    setMarkets([])
    setActiveMarket(null)
    setTrend([])
    setErr(null)
    setActiveTab('where')
    setStep('input')
  }

  const maxProfit=markets.length?Math.max(...markets.map(m=>m.net_profit_max)):1
  const trendDir=trend.length>=2?trend[trend.length-1].price>trend[0].price?'up':'down':'flat'
  const volatility=trend.length?Math.round((Math.max(...trend.map(t=>t.price))-Math.min(...trend.map(t=>t.price)))/(trend[0]?.price||1)*100):0
  const confidence=Math.max(30,80-volatility)

  // ── Nearest vs Best logic ─────────────────────────────────────────────────
  // markets[] is sorted by NET PROFIT (best profit first)
  // nearestIdx = index in markets[] of the physically closest APMC
  const nearestIdx = markets.length
    ? markets.reduce((bi,m,i)=>m.road_dist<markets[bi].road_dist?i:bi, 0)
    : 0
  const nearestMarket = markets[nearestIdx]
  const bestMarket    = markets[0]
  // Profit gain by going to best instead of nearest
  const profitGain = nearestMarket && bestMarket
    ? bestMarket.net_profit_avg - nearestMarket.net_profit_avg
    : 0
  const extraDist  = nearestMarket && bestMarket
    ? bestMarket.road_dist - nearestMarket.road_dist
    : 0
  // Show insight banner only when best ≠ nearest AND gain > ₹500
  const showInsight = nearestIdx !== 0 && profitGain > 500
  const selectedRouteIdx = activeMarket
    ? markets.findIndex(m => m.apmc.name === activeMarket.apmc.name && m.road_dist === activeMarket.road_dist)
    : -1
  const showLoading = step === 'loading'
  const showResults = step === 'results'
  const marketName = (market?: MarketResult | null) => market ? getLocalizedApmcName(market.apmc.name, market.apmc.nameMr, lang) : ''
  const districtName = (market?: MarketResult | null) => market ? localizeDistrict(market.apmc.district, lang) : ''

  const lbl={
    title: tr('Find Your Best Market', 'सर्वोत्तम बाजार निवडा', 'सर्वश्रेष्ठ बाजार खोजें'),
    sub: tr('Where to sell • When to sell • Maximum profit', 'कुठे विकायचे • कधी विकायचे • किती नफा', 'कहाँ बेचें • कब बेचें • कितना मुनाफा'),
    crop: tr('Select Crop', 'पीक निवडा', 'फसल चुनें'),
    qty: tr('Quantity (Quintals)', 'प्रमाण (क्विंटल)', 'मात्रा (क्विंटल)'),
    loc: tr('Farm Location', 'शेत स्थान', 'खेत का स्थान'),
    veh: tr('Vehicle Type', 'वाहन प्रकार', 'वाहन का प्रकार'),
    own: tr('Ownership', 'मालकी', 'स्वामित्व'),
    mil: tr('Mileage (km/L)', 'मायलेज (किमी/ली)', 'माइलेज (किमी/ली)'),
    fuel: tr('Fuel', 'इंधन', 'ईंधन'),
    rent: tr('Rent/km (₹)', 'भाडे (₹/किमी)', 'किराया (₹/किमी)'),
    find: tr('Find Best Markets', 'सर्वोत्तम बाजार शोधा', 'सर्वश्रेष्ठ बाजार खोजें'),
    analyzing: tr('Analysing markets...', 'बाजार विश्लेषण...', 'बाजार विश्लेषण...'),
    newSearch: tr('← New Search', '← नवीन शोध', '← नई खोज'),
    where: tr('Where to Sell?', 'कुठे विकायचे?', 'कहाँ बेचें?'),
    when: tr('When to Sell?', 'कधी विकायचे?', 'कब बेचें?'),
    map: tr('Map View', 'नकाशा', 'नक्शा'),
    useMyLoc: tr('📍 My Location', '📍 माझे स्थान', '📍 मेरी लोकेशन'),
    locDet: tr('Location detected ✓', 'स्थान मिळाले ✓', 'लोकेशन मिल गई ✓'),
    netProfit: tr('Net Profit', 'निव्वळ नफा', 'शुद्ध मुनाफा'),
    transport: tr('Transport', 'वाहतूक खर्च', 'परिवहन'),
    dist: tr('Distance', 'अंतर', 'दूरी'),
    price: tr('Avg Price', 'सरासरी भाव', 'औसत भाव'),
    best: tr('🏆 Best', '🏆 सर्वोत्तम', '🏆 सर्वश्रेष्ठ'),
    rec: tr('Recommendation', 'शिफारस', 'सिफारिश'),
    expProfit: tr('Expected Profit', 'अपेक्षित नफा', 'अनुमानित मुनाफा'),
    breakdown: tr('Profit Breakdown', 'नफा विश्लेषण', 'मुनाफा विश्लेषण'),
    worst: tr('Worst', 'सर्वात वाईट', 'सबसे कम'),
    expected: tr('Expected', 'अपेक्षित', 'अनुमानित'),
    bestCase: tr('Best', 'सर्वोत्तम', 'सर्वश्रेष्ठ'),
    saleVal: tr('Sale Value', 'विक्री मूल्य', 'बिक्री मूल्य'),
    priceRange: tr('Price Range', 'भाव श्रेणी', 'भाव सीमा'),
    priceTrend: tr('7-Day Trend', '७ दिवस ट्रेंड', '7-दिन ट्रेंड'),
    sellNow: tr('Sell Now', 'आत्ताच विका', 'अभी बेचें'),
    wait: tr('Wait', 'थांबा', 'रुकें'),
    monitor: tr('Monitor', 'लक्ष ठेवा', 'नजर रखें'),
    conf: tr('Confidence', 'आत्मविश्वास', 'विश्वास स्तर'),
    vol: tr('Volatility', 'अस्थिरता', 'अस्थिरता'),
  }

  return (
    <div className="market-intelligence-root w-full min-h-screen overflow-x-hidden" style={{paddingTop:0,background:G.cream,minHeight:'100vh',width:'100%'}}>
      <AnimatePresence mode="wait">

        {/* ── INPUT ─────────────────────────────────────────────────────── */}
        {step==='input' && (
          <motion.div key="in" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,y:-16}}>
            {/* Hero */}
            <div className="px-5 md:px-16 pt-14 pb-10"
              style={{background:'linear-gradient(135deg,#0A1A0F 0%,#0D2415 60%,#1A4D2E 100%)'}}>
              <div className="w-full max-w-none mx-auto px-2 md:px-6 lg:px-10">
                <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-0.5 rounded" style={{background:`linear-gradient(90deg,${G.accent},transparent)`}}/>
                  <span className="text-[11px] font-bold tracking-[.14em] uppercase" style={{color:G.accent}}>
                    {tr('Market Intelligence', 'बाजार बुद्धिमत्ता', 'बाजार बुद्धिमत्ता')}
                  </span>
                </motion.div>
                <motion.h1 initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.07}}
                  className="font-display font-black text-white mb-2"
                  style={{fontSize:'clamp(26px,4vw,52px)',letterSpacing:'-0.03em'}}>
                  {lbl.title}
                </motion.h1>
                <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.14}}
                  style={{color:'rgba(255,255,255,0.55)',fontSize:14}}>{lbl.sub}</motion.p>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.2}}
                  className="flex flex-wrap gap-2 mt-5">
                  {[
                    {i:'📍',t:tr('Real APMC Data (285 markets)', 'रिअल APMC डेटा (285 बाजार)', 'रियल APMC डेटा (285 बाजार)')},
                    {i:'🚜',t:tr('Transport cost engine', 'travel_expense.py लॉजिक', 'transport cost इंजन')},
                    {i:'📈',t:tr('7-day trend', '७ दिवस ट्रेंड', '7-दिन ट्रेंड')},
                    {i:'🏆',t:tr('Top 5 ranked', 'शीर्ष ५ बाजार', 'शीर्ष 5 बाजार')},
                  ].map(p=>(
                    <div key={p.t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                      style={{background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.1)'}}>
                      <span>{p.i}</span>{p.t}
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Form */}
            <div className="w-full max-w-none mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-10">
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}
                className="w-full rounded-3xl p-5 md:p-8 lg:p-10 shadow-lg"
                style={{background:'white',border:`1px solid ${G.border}`}}>

                {err && (
                  <div className="mb-5 p-4 rounded-2xl text-[13px] font-semibold flex items-center gap-3"
                    style={{background:'rgba(220,38,38,0.07)',border:'1px solid rgba(220,38,38,0.2)',color:G.red}}>
                    ⚠ {err}
                  </div>
                )}

                {/* Crop */}
                <div className="mb-8">
                  <label className="text-[11px] font-black uppercase tracking-widest mb-4 block" style={{color:G.primary}}>
                    {lbl.crop}
                  </label>
                  {cropsLoading && (
                    <div className="text-[12px] mb-3" style={{color:G.muted}}>
                      Loading all crops from market engine...
                    </div>
                  )}
                  <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
                    <div className="rounded-2xl p-3 md:p-4" style={{background:G.cream,border:`1px solid ${G.border}`}}>
                      <div className="text-[11px] font-black uppercase tracking-wider mb-2" style={{color:G.muted}}>
                        {tr('Top Crops', 'महत्वाची पिके', 'मुख्य फसलें')}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {topCropChoices.map((c)=>(
                          <motion.button key={`top-${c.en}`} whileHover={{scale:1.04}} whileTap={{scale:.96}}
                            onClick={()=>setCrop(c.en)}
                            className="flex items-center gap-2 py-2 px-3 rounded-xl border-2 transition-all text-[12px] font-bold"
                            style={{
                              background:crop===c.en?G.primary:'white',
                              borderColor:crop===c.en?G.primary:'rgba(26,77,46,0.15)',
                              color:crop===c.en?'white':G.ink,
                              boxShadow:crop===c.en?'0 6px 18px rgba(26,77,46,0.25)':'none',
                            }}>
                            <span>{c.emoji}</span>
                            <span>{lang === 'en' ? marketCropEnLabel(c.en) : c.mr}</span>
                          </motion.button>
                        ))}
                      </div>

                      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {cropGroups.map((group) => (
                          <div key={group.key} className="rounded-2xl p-3"
                            style={{background:group.background,border:`1px solid ${hexToRgba(group.accent, 0.25)}`}}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[15px]">{group.icon}</span>
                                <span className="text-[11px] font-black uppercase tracking-wider" style={{color:group.accent}}>
                                  {group.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{background:'#fff',color:group.accent}}>
                                {group.crops.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {group.crops.map((c)=>(
                                <button key={`group-${group.key}-${c.en}`}
                                  onClick={()=>setCrop(c.en)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all"
                                  style={{
                                    background:crop===c.en?'#fff':'rgba(255,255,255,0.65)',
                                    borderColor:crop===c.en?group.accent:hexToRgba(group.accent,0.26),
                                    color:crop===c.en?group.accent:G.ink,
                                    boxShadow:crop===c.en?'0 4px 12px rgba(2,6,23,0.08)':'none',
                                  }}>
                                  <span>{c.emoji}</span>
                                  <span>{lang === 'en' ? marketCropEnLabel(c.en) : c.mr}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl p-3 md:p-4 h-fit sticky top-24"
                      style={{background:'white',border:`1px solid ${G.border}`}}>
                      <div className="text-[11px] font-black uppercase tracking-wider mb-2" style={{color:G.muted}}>
                        {tr('Crop Image', 'पीक प्रतिमा', 'फसल छवि')}
                      </div>
                      <div className="rounded-xl overflow-hidden mb-2"
                        style={{border:`1px solid ${G.border}`,background:G.cream,minHeight:180}}>
                        {cropImageLoading ? (
                          <div className="h-[180px] flex items-center justify-center text-[12px]" style={{color:G.muted}}>
                            Loading image...
                          </div>
                        ) : cropImageUrl ? (
                          <img src={cropImageUrl} alt={`${marketCropEnLabel(crop)} crop`} className="w-full h-[180px] object-cover" />
                        ) : (
                          <div className="h-[180px] flex flex-col items-center justify-center gap-2">
                            <div className="text-4xl">{selectedCrop?.emoji || '🌱'}</div>
                            <div className="text-[11px] text-center px-2" style={{color:G.muted}}>
                              {tr('Reference image not available for this crop.', 'निवडलेल्या पिकाची प्रतिमा उपलब्ध नाही', 'इस फसल के लिए संदर्भ छवि उपलब्ध नहीं है।')}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-[12px] font-bold" style={{color:G.ink}}>
                        {lang === 'en' ? marketCropEnLabel(crop) : selectedCrop?.mr}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-8">
                  <label className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center justify-between"
                    style={{color:G.primary}}>
                    <span>{lbl.qty}</span>
                    <span className="font-black text-[20px]" style={{color:G.ink}}>{qty} Q</span>
                  </label>
                  <input type="range" min={5} max={500} step={5} value={qty}
                    onChange={e=>setQty(Number(e.target.value))} className="w-full"/>
                  <div className="flex justify-between text-[10px] mt-1" style={{color:G.muted}}>
                    <span>5 Q</span><span>250 Q</span><span>500 Q</span>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-8">
                  <label className="text-[11px] font-black uppercase tracking-widest mb-3 block" style={{color:G.primary}}>
                    {lbl.loc}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <input type="number" value={lat} onChange={e=>setLat(Number(e.target.value))}
                      placeholder="Latitude" step="0.0001"
                      className="flex-1 min-w-0 px-4 py-3 rounded-2xl border-2 text-[13px] outline-none"
                      style={{borderColor:'rgba(26,77,46,0.15)'}}
                      onFocus={e=>(e.target.style.borderColor=G.primary)}
                      onBlur={e=>(e.target.style.borderColor='rgba(26,77,46,0.15)')}/>
                    <input type="number" value={lng} onChange={e=>setLng(Number(e.target.value))}
                      placeholder="Longitude" step="0.0001"
                      className="flex-1 min-w-0 px-4 py-3 rounded-2xl border-2 text-[13px] outline-none"
                      style={{borderColor:'rgba(26,77,46,0.15)'}}
                      onFocus={e=>(e.target.style.borderColor=G.primary)}
                      onBlur={e=>(e.target.style.borderColor='rgba(26,77,46,0.15)')}/>
                    <motion.button whileTap={{scale:.95}} onClick={detectLocation} disabled={locating}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-[13px] flex-shrink-0"
                      style={{background:locating?G.cream:G.bg8,color:G.primary,border:`1px solid ${G.border}`}}>
                      {locating?<Loader2 size={14} className="animate-spin"/>:<Navigation size={14}/>}
                      {locating?'...':lbl.useMyLoc}
                    </motion.button>
                  </div>
                  {locDetected && (
                    <p className="text-[11px] mt-1.5 font-semibold" style={{color:G.accent}}>
                      <CheckCircle size={10} className="inline mr-1"/>{lbl.locDet} ({lat.toFixed(4)}, {lng.toFixed(4)})
                    </p>
                  )}
                  <div className="mt-2.5 rounded-xl px-3 py-2.5 text-[11px]"
                    style={{background:G.cream,border:`1px solid ${G.border}`,color:G.muted}}>
                    <div className="font-bold mb-1" style={{color:G.ink}}>
                      {tr('Detected Address', 'सध्याचा पत्ता', 'पता')}
                    </div>
                    {addressLoading
                      ? tr('Resolving address...', 'पत्ता शोधत आहे...', 'पता खोजा जा रहा है...')
                      : (locationAddress || tr('Address not found.', 'पत्ता सापडला नाही.', 'पता नहीं मिला।'))}
                  </div>
                </div>

                {/* Vehicle */}
                <div className="mb-6">
                  <label className="text-[11px] font-black uppercase tracking-widest mb-3 block" style={{color:G.primary}}>
                    {lbl.veh}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {VEHICLES.map(v=>(
                      <motion.button key={v.value} whileHover={{scale:1.02}} whileTap={{scale:.97}}
                        onClick={()=>setVehicle(v.value)}
                        className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all"
                        style={{background:vehicle===v.value?G.bg8:'white',borderColor:vehicle===v.value?G.primary:'rgba(26,77,46,0.1)'}}>
                        <span className="text-[24px]">{v.emoji}</span>
                        <span className="text-[12px] font-bold" style={{color:vehicle===v.value?G.primary:G.ink}}>
                          {lang === 'en' ? v.label : v.mr}
                        </span>
                        <span className="text-[10px]" style={{color:G.muted}}>{v.cap}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Ownership */}
                <div className="mb-6">
                  <label className="text-[11px] font-black uppercase tracking-widest mb-3 block" style={{color:G.primary}}>
                    {lbl.own}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['own','rented'] as const).map(o=>(
                      <button key={o} onClick={()=>setOwnership(o)}
                        className="py-3 rounded-2xl border-2 font-bold text-[14px] transition-all"
                        style={{background:ownership===o?G.bg8:'white',borderColor:ownership===o?G.primary:'rgba(26,77,46,0.1)',color:ownership===o?G.primary:G.muted}}>
                        {o==='own'?`🔑 ${isMr?'स्वतःचे':isHi?'खुद का':'Own'}`:`📋 ${isMr?'भाड्याचे':isHi?'किराये का':'Rented'}`}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {ownership==='own' && (
                    <motion.div key="own" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                      className="mb-6 grid grid-cols-2 gap-4 overflow-hidden">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wider mb-2 block" style={{color:G.muted}}>{lbl.mil}</label>
                        <input type="number" value={mileage} onChange={e=>setMileage(Number(e.target.value))}
                          min={1} max={30} step={0.5}
                          className="w-full px-4 py-3 rounded-2xl border-2 text-[14px] outline-none font-bold"
                          style={{borderColor:'rgba(26,77,46,0.15)',color:G.ink}}
                          onFocus={e=>(e.target.style.borderColor=G.primary)}
                          onBlur={e=>(e.target.style.borderColor='rgba(26,77,46,0.15)')}/>
                      </div>
                      {vehicle!=='tractor' && (
                        <div>
                          <label className="text-[11px] font-black uppercase tracking-wider mb-2 block" style={{color:G.muted}}>{lbl.fuel}</label>
                          <div className="flex gap-2 h-[46px]">
                            {(['diesel','cng'] as const).map(f=>(
                              <button key={f} onClick={()=>setFuelType(f)}
                                className="flex-1 rounded-2xl border-2 font-bold text-[13px] transition-all"
                                style={{background:fuelType===f?G.bg8:'white',borderColor:fuelType===f?G.primary:'rgba(26,77,46,0.1)',color:fuelType===f?G.primary:G.muted}}>
                                {f==='diesel'?'⛽ Diesel':'🟢 CNG'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                  {ownership==='rented' && (
                    <motion.div key="rent" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                      className="mb-6 overflow-hidden">
                      <label className="text-[11px] font-black uppercase tracking-wider mb-2 block" style={{color:G.muted}}>{lbl.rent}</label>
                      <input type="number" value={rentPerKm} onChange={e=>setRentPerKm(Number(e.target.value))}
                        min={5} max={200}
                        className="w-full px-4 py-3 rounded-2xl border-2 text-[14px] outline-none font-bold"
                        style={{borderColor:'rgba(26,77,46,0.15)',color:G.ink}}
                        onFocus={e=>(e.target.style.borderColor=G.primary)}
                        onBlur={e=>(e.target.style.borderColor='rgba(26,77,46,0.15)')}/>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:.97}}
                  onClick={handleSubmit} disabled={!crop || cropsLoading || !crops.length}
                  className="w-full py-4 rounded-2xl font-black text-[16px] text-white flex items-center justify-center gap-3 mt-2"
                  style={{background:(crop && crops.length)?`linear-gradient(135deg,${G.primary},${G.mid})`:'#ccc',
                    boxShadow:(crop && crops.length)?'0 8px 28px rgba(26,77,46,0.35)':'none'}}>
                  <TrendingUp size={20}/>{lbl.find}<ChevronRight size={18}/>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── LOADING ───────────────────────────────────────────────────── */}
        {showLoading && (
          <motion.div key="loading"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
            <motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:'linear'}}
              className="w-14 h-14 rounded-full border-4"
              style={{borderColor:`${G.primary} ${G.primary} ${G.primary} transparent`}}/>
            <div className="text-center">
              <div className="font-display font-black text-[22px] mb-1" style={{color:G.ink}}>{lbl.analyzing}</div>
              <div className="text-[13px]" style={{color:G.muted}}>
                {tr('Haversine distance, transport cost, profit ranking...', 'हावर्सिन अंतर गणना, वाहतूक खर्च, नफा...', 'हैवर्साइन दूरी, परिवहन लागत, मुनाफा रैंकिंग...')}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────── */}
        {showResults && (
          <motion.div key="results" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="max-w-7xl mx-auto px-4 md:px-8 py-10">

            {/* Header */}
            <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-3xl">{selectedCrop?.emoji}</span>
                  <div>
                    <div className="text-[12px] md:text-[13px] font-black tracking-[0.22em] uppercase" style={{color:G.primary}}>
                      {tr('Market Intelligence', 'बाजार विश्लेषण', 'बाजार विश्लेषण')}
                    </div>
                    <h1 className="font-display font-black text-[30px] md:text-[42px] leading-tight"
                      style={{color:G.ink,letterSpacing:'-0.025em'}}>
                      {lang === 'en' ? marketCropEnLabel(selectedCrop?.en || '') : selectedCrop?.mr} · {qty}Q
                    </h1>
                  </div>
                </div>
                {/* Summary pills */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {[
                    {l:tr('Best Profit', 'सर्वोत्तम नफा', 'सर्वश्रेष्ठ मुनाफा'), v:fmtL(bestMarket?.net_profit_avg||0), c:G.primary},
                    {l:tr('Best Market', 'सर्वोत्तम बाजार', 'सर्वश्रेष्ठ बाजार'), v:bestMarket ? marketName(bestMarket) : '—', c:G.primary},
                    {l:tr('Nearest APMC', 'जवळचा बाजार', 'निकटतम APMC'), v:nearestMarket ? `${marketName(nearestMarket)} · ${nearestMarket.road_dist.toFixed(1)}km` : '—', c:G.muted},
                    {l:tr('Trend', 'ट्रेंड', 'ट्रेंड'), v:trendDir==='up'?tr('↑ Rising','↑ वाढ','↑ बढ़त'):trendDir==='down'?tr('↓ Falling','↓ घसरण','↓ गिरावट'):tr('→ Stable','→ स्थिर','→ स्थिर'),
                      c:trendDir==='up'?G.primary:trendDir==='down'?G.red:G.gold},
                  ].map(s=>(
                    <div key={s.l} className="flex flex-col justify-center min-w-[142px] px-5 py-3 rounded-3xl"
                      style={{background:'white',border:`1px solid ${G.border}`,boxShadow:'0 6px 18px rgba(13,26,15,0.05)'}}>
                      <div className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.08em]" style={{color:G.muted}}>{s.l}</div>
                      <div className="font-black text-[18px] md:text-[22px] leading-tight" style={{color:s.c}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleNewSearch}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[15px] border"
                style={{background:'white',color:G.primary,borderColor:G.border}}>
                <ArrowLeft size={14}/>{lbl.newSearch}
              </button>
            </div>

            {/* ── Insight banner: nearest ≠ best ── */}
            {showInsight && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
                className="mb-6 p-5 md:p-7 rounded-[28px] flex items-start gap-4"
                style={{background:'rgba(26,77,46,0.06)',border:`1px solid rgba(26,77,46,0.18)`,boxShadow:'0 12px 30px rgba(26,77,46,0.08)'}}>
                <span className="text-3xl md:text-4xl flex-shrink-0">💡</span>
                <div>
                  <div className="font-black text-[21px] md:text-[28px] leading-tight mb-2" style={{color:G.primary}}>
                    {tr(
                      `${marketName(bestMarket)} gives more profit — even though ${marketName(nearestMarket)} is closer`,
                      `${marketName(bestMarket)} जास्त नफ्याचा — जरी ${marketName(nearestMarket)} जवळ आहे`,
                      `${marketName(bestMarket)} अधिक मुनाफा देता है — हालांकि ${marketName(nearestMarket)} ज्यादा पास है`
                    )}
                  </div>
                  <div className="text-[15px] md:text-[17px] leading-relaxed" style={{color:G.muted}}>
                    {tr(
                      `Nearest market (${marketName(nearestMarket)}, ${nearestMarket.road_dist.toFixed(1)} km) saves transport cost, but ${marketName(bestMarket)} (${bestMarket.road_dist.toFixed(1)} km) pays a higher price. Travelling ${extraDist.toFixed(1)} km extra earns you ${fmtL(profitGain)} more profit.`,
                      `जवळचा बाजार (${marketName(nearestMarket)}, ${nearestMarket.road_dist.toFixed(1)} km) वाहतूक खर्च वाचवतो, पण ${marketName(bestMarket)} (${bestMarket.road_dist.toFixed(1)} km) वर भाव जास्त आहे. जादा ${extraDist.toFixed(1)} km जाण्याने ${fmtL(profitGain)} जास्त नफा मिळतो.`,
                      `निकटतम बाजार (${marketName(nearestMarket)}, ${nearestMarket.road_dist.toFixed(1)} km) परिवहन खर्च बचाता है, लेकिन ${marketName(bestMarket)} (${bestMarket.road_dist.toFixed(1)} km) पर भाव अधिक है। ${extraDist.toFixed(1)} km अतिरिक्त जाने पर ${fmtL(profitGain)} अधिक मुनाफा मिलता है।`
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <div className="text-[13px] md:text-[14px] font-black px-4 py-2 rounded-full"
                      style={{background:G.primary,color:'white'}}>
                      🏆 {tr('Best', 'सर्वोत्तम', 'सर्वश्रेष्ठ')}: {marketName(bestMarket)} · {fmtL(bestMarket.net_profit_avg)}
                    </div>
                    <div className="text-[13px] md:text-[14px] font-semibold px-4 py-2 rounded-full"
                      style={{background:'rgba(26,77,46,0.08)',color:G.muted}}>
                      📍 {tr('Nearest', 'जवळचा', 'निकटतम')}: {marketName(nearestMarket)} · {fmtL(nearestMarket.net_profit_avg)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit"
              style={{background:'rgba(26,77,46,0.06)'}}>
              {([{id:'where',icon:IndianRupee,label:lbl.where},
                 {id:'when', icon:TrendingUp, label:lbl.when}] as const).map(tab=>(
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all"
                  style={{background:activeTab===tab.id?G.primary:'transparent',color:activeTab===tab.id?'white':G.muted,
                    boxShadow:activeTab===tab.id?'0 4px 12px rgba(26,77,46,0.3)':'none'}}>
                  <tab.icon size={14}/>{tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <div className="flex flex-col gap-6">

              {/* ── WHERE TO SELL ── */}
              {activeTab==='where' && (
                <motion.div key="where" className="order-2" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                  <div className="grid lg:grid-cols-5 gap-5">
                    {/* Market list */}
                    <div className="lg:col-span-2 space-y-3">
                      {markets.map((m,i)=>{
                        const isNearest = i === nearestIdx
                        const isBest    = i === 0
                        return (
                        <motion.div key={m.apmc.name+i}
                          initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:i*.07}}
                          onClick={()=>setActiveMarket(m)}
                          className="rounded-3xl p-5 cursor-pointer border-2 transition-all"
                          style={{background:activeMarket===m?'rgba(26,77,46,0.05)':'white',
                            borderColor:activeMarket===m?G.primary:isBest?'rgba(26,77,46,0.25)':isNearest?'rgba(26,77,46,0.18)':G.border,
                            boxShadow:isBest?'0 6px 24px rgba(26,77,46,0.12)':isNearest?'0 4px 14px rgba(26,77,46,0.07)':'0 2px 8px rgba(13,26,15,0.04)'}}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <RankBadge rank={i+1}/>
                              <div>
                                {/* Badges row */}
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {isBest && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full inline-block"
                                      style={{background:G.primary,color:'white'}}>🏆 {tr('Best Profit', 'सर्वाधिक नफा', 'सर्वश्रेष्ठ मुनाफा')}</span>
                                  )}
                                  {isNearest && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full inline-block"
                                      style={{background:'rgba(26,77,46,0.12)',color:G.primary}}>📍 {tr('Nearest', 'सर्वात जवळ', 'सबसे पास')}</span>
                                  )}
                                  {isBest && !isNearest && (
                                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block"
                                      style={{background:'rgba(217,119,6,0.1)',color:G.gold}}>
                                      +{fmtL(profitGain)} {tr('vs nearest', 'vs जवळच्यापेक्षा', 'vs निकटतम')}
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-[14px]" style={{color:G.ink}}>{marketName(m)}</div>
                                <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{color:G.muted}}>
                                  <MapPin size={9}/>{m.road_dist.toFixed(1)} km · {districtName(m) || ''}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-[21px] leading-none"
                                style={{color:isBest?G.primary:G.ink}}>{fmtL(m.net_profit_avg)}</div>
                              <div className="text-[10px] font-semibold" style={{color:G.muted}}>{lbl.netProfit}</div>
                            </div>
                          </div>
                          <ProfitBar min={m.net_profit_min} avg={m.net_profit_avg} max={m.net_profit_max} maxV={maxProfit}/>
                          <div className="flex justify-between text-[9px] mt-1 mb-3" style={{color:G.muted}}>
                            <span>{tr('Worst', 'सर्वात वाईट', 'सबसे कम')}: ₹{fmtINR(m.net_profit_min)}</span>
                            <span>{tr('Best', 'सर्वोत्तम', 'सर्वश्रेष्ठ')}: ₹{fmtINR(m.net_profit_max)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              {l:lbl.price,     v:`₹${fmtINR(m.avg_price)}`, c:G.ink},
                              {l:lbl.transport, v:fmtL(m.transport_cost_avg), c:G.red},
                              {l:lbl.dist,      v:`${m.road_dist.toFixed(1)} km`, c:G.muted},
                            ].map(s=>(
                              <div key={s.l} className="rounded-xl p-2 text-center"
                                style={{background:G.cream}}>
                                <div className="text-[9px] font-semibold" style={{color:G.muted}}>{s.l}</div>
                                <div className="font-black text-[12px]" style={{color:s.c}}>{s.v}</div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                        )
                      })}
                    </div>

                    {/* Detail panel */}
                    {activeMarket && (
                      <motion.div key={activeMarket.apmc.name}
                        initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                        className="lg:col-span-3 rounded-3xl p-7"
                        style={{background:'white',border:`1px solid ${G.border}`,boxShadow:'0 4px 24px rgba(13,26,15,0.07)'}}>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <div className="font-display font-black text-[20px]" style={{color:G.ink}}>{marketName(activeMarket)}</div>
                            <div className="text-[12px] flex items-center gap-1.5 mt-0.5" style={{color:G.muted}}>
                              <MapPin size={11}/>{activeMarket.road_dist.toFixed(1)} km
                              <span className="mx-1">·</span>
                              <Truck size={11}/>{vehicle}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-semibold" style={{color:G.muted}}>{lbl.expProfit}</div>
                            <div className="font-display font-black text-[32px] leading-none" style={{color:G.primary}}>
                              {fmtL(activeMarket.net_profit_avg)}
                            </div>
                          </div>
                        </div>

                        {/* Bar chart */}
                        <div className="mb-5">
                          <div className="text-[12px] font-bold mb-3" style={{color:G.muted}}>{lbl.breakdown}</div>
                          <div className="h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                {name:lbl.worst,profit:activeMarket.net_profit_min},
                                {name:lbl.expected,profit:activeMarket.net_profit_avg},
                                {name:lbl.bestCase,profit:activeMarket.net_profit_max},
                              ]} margin={{top:4,right:4,left:-10,bottom:0}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,77,46,0.06)"/>
                                <XAxis dataKey="name" tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false}/>
                                <YAxis tick={{fontSize:10,fill:G.muted}} axisLine={false} tickLine={false}
                                  tickFormatter={v=>fmtL(v)}/>
                                <Tooltip formatter={(v:any)=>[fmtL(v),tr('Profit', 'नफा', 'मुनाफा')]}
                                  contentStyle={{fontSize:12,borderRadius:12}}/>
                                <Bar dataKey="profit" fill={G.primary} radius={[8,8,0,0]}
                                  label={{position:'top',formatter:(v:number)=>fmtL(v),fontSize:11,fill:G.ink}}/>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* 4 info tiles */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          {[
                            {icon:'💰',l:lbl.saleVal,v:`₹${fmtINR(activeMarket.avg_price*qty)}`,sub:`₹${fmtINR(activeMarket.avg_price)}/q`,c:G.ink},
                            {icon:'🚜',l:lbl.transport,v:fmtL(activeMarket.transport_cost_avg),
                              sub:`₹${fmtINR(activeMarket.transport_cost_min)}–${fmtINR(activeMarket.transport_cost_max)}`,c:G.red},
                            {icon:'📊',l:lbl.priceRange,v:`₹${fmtINR(activeMarket.min_price)}–${fmtINR(activeMarket.max_price)}`,sub:'/quintal',c:G.muted},
                            {icon:'📍',l:lbl.dist,v:`${activeMarket.road_dist.toFixed(1)} km`,sub:tr('approx.', 'अंदाजे', 'लगभग'),c:G.muted},
                          ].map(s=>(
                            <div key={s.l} className="p-4 rounded-2xl" style={{background:G.cream,border:`1px solid ${G.border}`}}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[15px]">{s.icon}</span>
                                <span className="text-[10px] font-semibold" style={{color:G.muted}}>{s.l}</span>
                              </div>
                              <div className="font-black text-[16px]" style={{color:s.c}}>{s.v}</div>
                              <div className="text-[10px]" style={{color:G.muted}}>{s.sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Recommendation */}
                        <div className="p-4 rounded-2xl flex items-center gap-3"
                          style={{background:G.bg8,border:`1px solid rgba(26,77,46,0.15)`}}>
                          <Target size={18} style={{color:G.primary}}/>
                          <div>
                            <div className="font-bold text-[13px]" style={{color:G.ink}}>{lbl.rec}</div>
                            <div className="text-[12px]" style={{color:G.muted}}>
                              {tr(
                                `Go to ${marketName(activeMarket)} — Sell ${qty} quintals — Earn ${fmtL(activeMarket.net_profit_avg)} profit`,
                                `${marketName(activeMarket)} ला जा — ${qty} क्विंटल विका — ${fmtL(activeMarket.net_profit_avg)} नफा मिळवा`,
                                `${marketName(activeMarket)} जाएं — ${qty} क्विंटल बेचें — ${fmtL(activeMarket.net_profit_avg)} मुनाफा कमाएं`
                              )}
                            </div>
                          </div>
                          <Zap size={15} style={{color:G.primary,flexShrink:0}}/>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── WHEN TO SELL ── */}
              {activeTab==='when' && (
                <motion.div key="when" className="order-3" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                  <div className="grid md:grid-cols-3 gap-5 mb-5">
                    <div className="md:col-span-2 p-7 rounded-3xl text-white"
                      style={{background:trendDir==='up'
                        ?`linear-gradient(135deg,${G.primary},${G.mid})`
                        :trendDir==='down'?'linear-gradient(135deg,#991B1B,#DC2626)'
                        :'linear-gradient(135deg,#92400E,#D97706)'}}>
                      <div className="text-[12px] font-semibold mb-2" style={{color:'rgba(255,255,255,0.7)'}}>
                        {tr('Market Signal', 'बाजार संकेत', 'बाजार संकेत')}
                      </div>
                      <div className="text-5xl mb-3">
                        {trendDir==='up'?'📈':trendDir==='down'?'📉':'📊'}
                      </div>
                      <div className="font-display font-black text-[26px] leading-tight" style={{letterSpacing:'-0.02em'}}>
                        {trendDir==='up'?lbl.wait:trendDir==='down'?lbl.sellNow:lbl.monitor}
                      </div>
                      <div className="text-[13px] mt-2" style={{color:'rgba(255,255,255,0.75)'}}>
                        {trendDir==='up'
                          ? tr('Price rising — holding may be more profitable.', 'किंमत वाढत आहे — थांबणे फायदेशीर असू शकते.', 'भाव बढ़ रहा है — रुकना फायदेमंद हो सकता है।')
                          :trendDir==='down'
                            ? tr('Price falling — sell soon.', 'किंमत कमी होत आहे — आत्ता विका.', 'भाव गिर रहा है — अभी बेचें।')
                            : tr('Market uncertain — monitor closely.', 'बाजार अनिश्चित आहे — लक्ष ठेवा.', 'बाजार अनिश्चित है — नजर रखें।')}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        {l:lbl.conf,v:`${confidence}%`,c:G.primary},
                        {l:lbl.vol,v:`${volatility}%`,c:volatility>15?G.red:G.gold},
                      ].map(s=>(
                        <div key={s.l} className="p-5 rounded-2xl"
                          style={{background:'white',border:`1px solid ${G.border}`}}>
                          <div className="text-[11px] font-semibold mb-1" style={{color:G.muted}}>{s.l}</div>
                          <div className="font-black text-[28px]" style={{color:s.c}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl" style={{background:'white',border:`1px solid ${G.border}`}}>
                    <div className="font-sub font-bold text-[15px] mb-4 flex items-center gap-2" style={{color:G.ink}}>
                      <TrendingUp size={16} style={{color:G.primary}}/>{lbl.priceTrend}
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{top:4,right:4,left:-16,bottom:0}}>
                          <defs>
                            <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={G.primary} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={G.primary} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,77,46,0.06)"/>
                          <XAxis dataKey="date" tick={{fontSize:10,fill:G.muted}} tickLine={false} axisLine={false}/>
                          <YAxis tick={{fontSize:10,fill:G.muted}} tickLine={false} axisLine={false}
                            tickFormatter={v=>`₹${v}`}/>
                          <Tooltip content={<PTip/>}/>
                          <Area type="monotone" dataKey="price" stroke={G.primary} strokeWidth={2.5}
                            fill="url(#tg)" dot={false} activeDot={{r:5,fill:G.primary}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-4 p-5 rounded-2xl flex items-start gap-3"
                    style={{background:'rgba(217,119,6,0.07)',border:'1px solid rgba(217,119,6,0.2)'}}>
                    <Info size={16} style={{color:G.gold,flexShrink:0,marginTop:1}}/>
                    <p className="text-[12px] leading-relaxed" style={{color:'#92400E'}}>
                      {tr(
                        'Analysis based on 7-day APMC market patterns. Consider storage costs and crop perishability before waiting.',
                        'हे विश्लेषण मागील ७ दिवसांच्या APMC बाजार डेटावर आधारित आहे. साठवण शक्य असल्यास वाहतूक खर्च आणि पीक खराब होण्याचा विचार करा.',
                        'यह विश्लेषण पिछले 7 दिनों के APMC बाजार डेटा पर आधारित है। रुकने से पहले भंडारण लागत और फसल खराब होने का जोखिम देखें।'
                      )}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── MAP ── */}
              <motion.div key="map" className="order-1" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                  <div className="grid xl:grid-cols-[minmax(0,1fr)_330px] gap-5 items-stretch">
                    <div className="min-w-0">
                      <div className="rounded-3xl overflow-hidden" style={{height:'min(68vh, 720px)',minHeight:560,border:`1px solid ${G.border}`}}>
                        <ProfitMapbox
                          lat={lat}
                          lng={lng}
                          markets={markets}
                          nearestIdx={nearestIdx}
                          selectedRouteIdx={selectedRouteIdx}
                          onSelectMarket={setActiveMarket}
                          lang={lang}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-2xl" style={{background:'white',border:`1px solid ${G.border}`}}>
                        <div className="font-sub font-bold text-[13px] mb-1" style={{color:G.ink}}>
                          {tr('Farm Address', 'शेताचा पत्ता', 'खेत का पता')}
                        </div>
                        <div className="text-[11px] leading-5" style={{color:G.muted}}>
                          {locationAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl" style={{background:G.bg8,border:`1px solid rgba(26,77,46,0.2)`}}>
                        <div className="font-sub font-bold text-[14px] mb-1" style={{color:G.ink}}>
                          {tr('Route Colors', 'मार्ग रंग', 'रूट रंग')}
                        </div>
                        <div className="text-[11px] leading-5" style={{color:G.muted}}>
                          <div>Blue: {tr('Best profit APMC', 'सर्वोत्तम नफा APMC', 'सर्वश्रेष्ठ मुनाफा APMC')}</div>
                          <div>Green: {tr('Nearest route', 'सर्वात जवळचा मार्ग', 'निकटतम रूट')}</div>
                          <div>Orange: {tr('Lower priority', 'कमी प्राधान्य', 'कम प्राथमिकता')}</div>
                          <div>Red: {tr('Least suggested', 'सर्वात कमी सुचवलेला', 'सबसे कम सुझाया गया')}</div>
                        </div>
                      </div>

                      <div className="font-sub font-bold text-[15px] mb-1" style={{color:G.ink}}>
                        {tr('Route List', 'मार्ग यादी', 'रूट सूची')}
                      </div>
                      <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                        {markets.map((m,i)=>{
                          const routeColor = routeColorFor(i, markets.length, 0, nearestIdx)
                          const selected = activeMarket?.apmc.name===m.apmc.name
                          const hasSelection = selectedRouteIdx >= 0
                          const stops = (m.route_stops || []).filter(Boolean)
                          return (
                            <div key={i}
                              onClick={()=>setActiveMarket(m)}
                              className="p-4 rounded-2xl cursor-pointer relative overflow-hidden transition-all"
                              style={{
                                background: selected ? hexToRgba(routeColor, 0.2) : hexToRgba(routeColor, 0.1),
                                border:`2px solid ${selected ? routeColor : hexToRgba(routeColor, 0.45)}`,
                                boxShadow:selected ? `0 7px 22px ${hexToRgba(routeColor, 0.28)}` : '0 2px 8px rgba(13,26,15,0.05)',
                                opacity:hasSelection && !selected ? 0.72 : 1,
                              }}>
                              <span className="absolute left-0 top-0 bottom-0 w-[6px]" style={{background:routeColor}}/>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="font-bold text-[13px] truncate pl-2" style={{color:G.ink}}>{marketName(m)}</div>
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background:routeColor}}/>
                              </div>
                              <div className="text-[10.5px] leading-5 pl-2" style={{color:G.muted}}>
                                <div>{m.road_dist.toFixed(1)} km · {Math.round(m.route_duration_min)} min</div>
                                <div>{tr('Cost', 'खर्च', 'खर्च')}: ₹{fmtINR(m.transport_cost_avg)} · {tr('Profit', 'नफा', 'मुनाफा')}: {fmtL(m.net_profit_avg)}</div>
                              </div>
                              {selected && (
                                <div className="mt-2.5 pt-2.5 pl-2" style={{borderTop:`1px dashed ${hexToRgba(routeColor, 0.55)}`}}>
                                  <div className="text-[10px] font-bold mb-1" style={{color:G.ink}}>
                                    {tr('Stops In Sequence', 'मार्गातील थांबे', 'रास्ते के पड़ाव')}
                                  </div>
                                  {(stops.length ? stops : [tr('Farm Start', 'शेत प्रारंभ', 'खेत प्रारंभ'), `${marketName(m)} APMC`]).slice(0, 9).map((s, idx) => (
                                    <div key={`s-${i}-${idx}-${s}`} className="text-[10px] leading-4" style={{color:G.muted}}>
                                      {idx + 1}. {localizeRouteStop(s, lang)}
                                    </div>
                                  ))}
                                  {stops.length > 9 && (
                                    <div className="text-[10px] mt-0.5" style={{color:G.muted}}>
                                      +{stops.length - 9} {tr('more stops', 'अधिक थांबे', 'अधिक पड़ाव')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-16"><Footer/></div>
    </div>
  )
}
