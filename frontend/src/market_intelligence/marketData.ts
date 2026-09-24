// src/lib/marketData.ts
// Shared crop metadata sourced from backend ProfitLoss crop_master, with
// frontend-only categorization/ordering for crop dashboards.

export type CropCategory =
  | 'vegetables'
  | 'fruits'
  | 'leafy_greens'
  | 'cereals_millets'
  | 'pulses_legumes'
  | 'oilseeds'
  | 'spices_condiments'
  | 'flowers'
  | 'plantation_cash'
  | 'processed_other'

export type MarketCrop = {
  en: string
  mr: string
  code: string
  emoji: string
  category: CropCategory
}

export const CROP_CATEGORY_META: Record<
  CropCategory,
  { label: string; icon: string; accent: string; background: string }
> = {
  vegetables: {
    label: 'Vegetables',
    icon: '🥕',
    accent: '#C8500A',
    background: 'linear-gradient(135deg, rgba(200,80,10,0.12), rgba(224,120,0,0.08))',
  },
  fruits: {
    label: 'Fruits',
    icon: '🍎',
    accent: '#C62828',
    background: 'linear-gradient(135deg, rgba(198,40,40,0.12), rgba(239,83,80,0.08))',
  },
  leafy_greens: {
    label: 'Leafy Greens',
    icon: '🥬',
    accent: '#1B8F3A',
    background: 'linear-gradient(135deg, rgba(27,143,58,0.12), rgba(91,179,127,0.08))',
  },
  cereals_millets: {
    label: 'Cereals & Millets',
    icon: '🌾',
    accent: '#8B5A2B',
    background: 'linear-gradient(135deg, rgba(139,90,43,0.12), rgba(217,119,6,0.08))',
  },
  pulses_legumes: {
    label: 'Pulses & Legumes',
    icon: '🌱',
    accent: '#5D4037',
    background: 'linear-gradient(135deg, rgba(93,64,55,0.12), rgba(121,85,72,0.08))',
  },
  oilseeds: {
    label: 'Oilseeds',
    icon: '🌻',
    accent: '#B8860B',
    background: 'linear-gradient(135deg, rgba(184,134,11,0.12), rgba(245,158,11,0.08))',
  },
  spices_condiments: {
    label: 'Spices & Condiments',
    icon: '🌶️',
    accent: '#B22222',
    background: 'linear-gradient(135deg, rgba(178,34,34,0.12), rgba(220,38,38,0.08))',
  },
  flowers: {
    label: 'Flowers',
    icon: '🌸',
    accent: '#AD1457',
    background: 'linear-gradient(135deg, rgba(173,20,87,0.12), rgba(236,72,153,0.08))',
  },
  plantation_cash: {
    label: 'Plantation & Cash',
    icon: '🌴',
    accent: '#1565C0',
    background: 'linear-gradient(135deg, rgba(21,101,192,0.12), rgba(14,165,233,0.08))',
  },
  processed_other: {
    label: 'Processed & Other',
    icon: '📦',
    accent: '#455A64',
    background: 'linear-gradient(135deg, rgba(69,90,100,0.12), rgba(100,116,139,0.08))',
  },
}

const CATEGORY_ORDER: CropCategory[] = [
  'vegetables',
  'fruits',
  'leafy_greens',
  'cereals_millets',
  'pulses_legumes',
  'oilseeds',
  'spices_condiments',
  'flowers',
  'plantation_cash',
  'processed_other',
]

const PRIORITY_CROPS = [
  'onion',
  'tomato',
  'potato',
  'cabbage',
  'cauliflower',
  'green_chilli',
  'red_chilli',
  'cotton',
  'soybean',
  'rice',
  'wheat',
  'maize',
  'sugarcane',
  'turmeric',
  'ginger',
  'groundnut',
  'chickpea',
  'pomegranate',
  'grapes',
  'banana',
] as const

const FRUITS = new Set([
  'fig', 'fig_dry', 'pineapple', 'avocado', 'mango', 'raw_mango', 'kairi',
  'watermelon', 'muskmelon', 'chickoo', 'pomegranate', 'grapes', 'papaya',
  'pear', 'guava', 'plum', 'jackfruit', 'amla', 'custard_apple',
  'custard_apple_alt', 'sweet_lime', 'orange', 'apple', 'strawberry', 'ber',
  'lemon',
])

const LEAFY = new Set([
  'ambadi_leaves', 'sorrel_leaves', 'onion_leaves', 'curry_leaves',
  'safflower_leaves', 'coriander', 'iceberg_lettuce', 'spinach', 'mint',
  'amaranth', 'dill', 'cowpea_leaves', 'fenugreek_leaves', 'salad',
])

const VEGETABLES = new Set([
  'taro', 'yam', 'yam_elephant', 'onion', 'cucumber', 'bottle_gourd',
  'bottle_gourd_alt', 'bitter_gourd', 'cluster_beans', 'cabbage', 'pumpkin',
  'carrot', 'zucchini', 'tomato', 'cherry_tomato', 'capsicum', 'ivy_gourd',
  'snake_gourd', 'cauliflower', 'potato', 'baby_corn', 'broccoli', 'okra',
  'radish', 'brinjal', 'drumstick', 'raw_banana', 'sweet_potato', 'beetroot',
  'taro', 'beans', 'cowpea_pods', 'peas',
])

const CEREALS = new Set([
  'rice', 'paddy', 'wheat', 'khapli_wheat', 'jowar', 'ragi', 'bajra', 'maize',
])

const PULSES = new Set([
  'black_gram', 'black_gram_dal', 'horse_gram', 'tur', 'tur_dal', 'soybean',
  'chickpea', 'chickpea_dal', 'green_gram', 'green_gram_dal', 'lentil',
  'lentil_dal', 'peas_dry', 'beans_seed', 'cowpea_seed',
])

const OILSEEDS = new Set([
  'castor', 'safflower', 'sesame', 'groundnut_green', 'groundnut_dry',
  'groundnut', 'sunflower', 'mustard', 'mustard_seed',
])

const SPICES = new Set([
  'ginger', 'dry_ginger', 'carom', 'cumin', 'coriander_seed', 'fennel',
  'cinnamon', 'fenugreek_seed', 'garlic', 'dry_garlic', 'red_chilli',
  'green_chilli', 'black_pepper', 'cardamom', 'turmeric',
])

const FLOWERS = new Set([
  'aster', 'carnation', 'rose', 'gladiolus', 'marigold', 'jasmine',
  'chrysanthemum',
])

const PLANTATION = new Set([
  'sugarcane', 'cotton', 'cashew', 'coconut', 'coconut_water', 'almond',
  'betel_nut',
])

const PROCESSED = new Set([
  'jaggery', 'sugar', 'sago', 'raisins',
])

const BASE_EMOJI_RULES: Array<[string, string]> = [
  ['onion', '🧅'],
  ['tomato', '🍅'],
  ['potato', '🥔'],
  ['cabbage', '🥬'],
  ['cauliflower', '🥦'],
  ['broccoli', '🥦'],
  ['carrot', '🥕'],
  ['cucumber', '🥒'],
  ['pumpkin', '🎃'],
  ['chilli', '🌶️'],
  ['pepper', '🌶️'],
  ['ginger', '🌿'],
  ['garlic', '🧄'],
  ['turmeric', '🌿'],
  ['coconut', '🥥'],
  ['banana', '🍌'],
  ['mango', '🥭'],
  ['grapes', '🍇'],
  ['pomegranate', '🍎'],
  ['watermelon', '🍉'],
  ['muskmelon', '🍈'],
  ['apple', '🍎'],
  ['orange', '🍊'],
  ['lemon', '🍋'],
  ['sweet_lime', '🍋'],
  ['pineapple', '🍍'],
  ['papaya', '🍈'],
  ['pear', '🍐'],
  ['guava', '🍐'],
  ['plum', '🍇'],
  ['strawberry', '🍓'],
  ['fig', '🍇'],
  ['amla', '🍏'],
  ['jackfruit', '🍈'],
  ['custard_apple', '🍏'],
  ['ber', '🍒'],
  ['chickoo', '🍎'],
  ['avocado', '🥑'],
  ['taro', '🍠'],
  ['yam', '🍠'],
  ['sweet_potato', '🍠'],
  ['beetroot', '🥕'],
  ['radish', '🥕'],
  ['beans', '🌱'],
  ['pea', '🌱'],
  ['chickpea', '🌱'],
  ['green_gram', '🌱'],
  ['black_gram', '🌱'],
  ['lentil', '🌱'],
  ['cowpea', '🌱'],
  ['soybean', '🌱'],
  ['groundnut', '🥜'],
  ['sesame', '🌰'],
  ['mustard', '🌼'],
  ['castor', '🌱'],
  ['safflower', '🌼'],
  ['sunflower', '🌻'],
  ['wheat', '🌾'],
  ['rice', '🌾'],
  ['paddy', '🌾'],
  ['jowar', '🌾'],
  ['ragi', '🌾'],
  ['bajra', '🌾'],
  ['maize', '🌽'],
  ['sugarcane', '🎋'],
  ['cotton', '☁️'],
  ['cashew', '🥜'],
  ['almond', '🌰'],
  ['cumin', '🧂'],
  ['carom', '🧂'],
  ['coriander', '🌿'],
  ['fennel', '🌿'],
  ['cinnamon', '🪵'],
  ['cardamom', '🌿'],
  ['fenugreek', '🌿'],
  ['mint', '🌿'],
  ['dill', '🌿'],
  ['spinach', '🥬'],
  ['lettuce', '🥬'],
  ['amaranth', '🌿'],
  ['curry_leaves', '🍃'],
  ['sorrel', '🍃'],
  ['drumstick', '🥒'],
  ['ivy_gourd', '🥒'],
  ['ridge_gourd', '🥒'],
  ['bottle_gourd', '🥒'],
  ['snake_gourd', '🥒'],
  ['bitter_gourd', '🥒'],
  ['zucchini', '🥒'],
  ['brinjal', '🍆'],
  ['capsicum', '🌶️'],
  ['aster', '🌼'],
  ['carnation', '🌺'],
  ['rose', '🌹'],
  ['gladiolus', '🌷'],
  ['marigold', '🌼'],
  ['jasmine', '🌼'],
  ['chrysanthemum', '🌸'],
  ['raisins', '🍇'],
  ['jaggery', '🍯'],
  ['sugar', '🍬'],
  ['sago', '🌾'],
  ['salad', '🥗'],
  ['coconut_water', '🥤'],
]

export const FALLBACK_CROP_EN: string[] = [
  'fig', 'fig_dry', 'ambadi_leaves', 'pineapple', 'taro', 'avocado', 'aster',
  'sorrel_leaves', 'mango', 'iceberg_lettuce', 'ginger', 'dry_ginger', 'amla',
  'black_gram', 'black_gram_dal', 'sugarcane', 'castor', 'carom', 'yam',
  'curry_leaves', 'safflower', 'safflower_leaves', 'watermelon', 'onion',
  'onion_leaves', 'cucumber', 'bottle_gourd', 'cashew', 'cotton',
  'bitter_gourd', 'carnation', 'raw_mango', 'horse_gram', 'banana',
  'raw_banana', 'kairi', 'coriander', 'cabbage', 'pumpkin', 'khapli_wheat',
  'muskmelon', 'cluster_beans', 'wheat', 'carrot', 'rose', 'jaggery',
  'gladiolus', 'beans', 'beans_seed', 'ridge_gourd', 'cowpea_leaves',
  'cowpea_pods', 'cowpea_seed', 'chickoo', 'cherry_tomato', 'cumin', 'jowar',
  'zucchini', 'marigold', 'tomato', 'pomegranate', 'capsicum', 'rice',
  'sesame', 'tur', 'tur_dal', 'ivy_gourd', 'cinnamon', 'bottle_gourd_alt',
  'grapes', 'coriander_seed', 'ragi', 'coconut', 'snake_gourd', 'papaya',
  'spinach', 'mint', 'pear', 'guava', 'plum', 'jackfruit', 'cauliflower',
  'potato', 'fennel', 'almond', 'bajra', 'beetroot', 'raisins', 'baby_corn',
  'ber', 'broccoli', 'paddy', 'groundnut_green', 'groundnut_dry', 'okra',
  'maize', 'peas', 'lentil', 'lentil_dal', 'red_chilli', 'green_chilli',
  'black_pepper', 'radish', 'green_gram', 'green_gram_dal', 'fenugreek_seed',
  'fenugreek_leaves', 'jasmine', 'sweet_lime', 'mustard', 'sweet_potato',
  'amaranth', 'custard_apple', 'garlic', 'dry_garlic', 'lemon', 'brinjal',
  'peas_dry', 'cardamom', 'coconut_water', 'groundnut', 'dill',
  'chrysanthemum', 'drumstick', 'orange', 'apple', 'mustard_seed', 'sugar',
  'sago', 'custard_apple_alt', 'betel_nut', 'yam_elephant', 'sunflower',
  'salad', 'soybean', 'strawberry', 'chickpea', 'chickpea_dal', 'turmeric',
]

function toLabel(en: string): string {
  return en
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function normalizeCropKey(v: unknown): string {
  return String(v || '').trim().toLowerCase().replace(/\s+/g, '_')
}

function detectCategory(en: string): CropCategory {
  if (VEGETABLES.has(en)) return 'vegetables'
  if (FRUITS.has(en)) return 'fruits'
  if (LEAFY.has(en)) return 'leafy_greens'
  if (CEREALS.has(en)) return 'cereals_millets'
  if (PULSES.has(en)) return 'pulses_legumes'
  if (OILSEEDS.has(en)) return 'oilseeds'
  if (SPICES.has(en)) return 'spices_condiments'
  if (FLOWERS.has(en)) return 'flowers'
  if (PLANTATION.has(en)) return 'plantation_cash'
  if (PROCESSED.has(en)) return 'processed_other'
  return 'processed_other'
}

function baseEmojiForCrop(en: string): string {
  for (const [key, emoji] of BASE_EMOJI_RULES) {
    if (en.includes(key)) return emoji
  }
  if (en.endsWith('_dal')) return '🥣'
  if (en.endsWith('_seed')) return '🌱'
  if (en.endsWith('_dry')) return '🌾'
  return '🌱'
}

function assignEmoji(en: string): string {
  return baseEmojiForCrop(en)
}

function buildMarketCrop(en: string, mr: string, code: string): Omit<MarketCrop, 'emoji'> {
  return {
    en,
    mr: mr?.trim() || toLabel(en),
    code: code?.trim() || '',
    category: detectCategory(en),
  }
}

function attachEmojis(crops: Omit<MarketCrop, 'emoji'>[]): MarketCrop[] {
  return crops.map((crop) => ({
    ...crop,
    emoji: assignEmoji(crop.en),
  }))
}

const FALLBACK_CROPS: MarketCrop[] = attachEmojis(normalizeRows([]))
let cropCache: MarketCrop[] | null = null
let cropPromise: Promise<MarketCrop[]> | null = null

function cropPriority(en: string): number {
  const idx = PRIORITY_CROPS.indexOf(en as (typeof PRIORITY_CROPS)[number])
  return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER
}

function sortCropsForDashboard(a: Omit<MarketCrop, 'emoji'>, b: Omit<MarketCrop, 'emoji'>): number {
  const pa = cropPriority(a.en)
  const pb = cropPriority(b.en)
  if (pa !== pb) return pa - pb
  const ca = CATEGORY_ORDER.indexOf(a.category)
  const cb = CATEGORY_ORDER.indexOf(b.category)
  if (ca !== cb) return ca - cb
  return a.en.localeCompare(b.en)
}

function normalizeRows(rows: any[]): Omit<MarketCrop, 'emoji'>[] {
  const byEn = new Map<string, Omit<MarketCrop, 'emoji'>>()
  rows.forEach((row: any) => {
    const en = normalizeCropKey(row?.en)
    if (!en) return
    byEn.set(en, buildMarketCrop(en, String(row?.mr || ''), String(row?.code || '')))
  })
  FALLBACK_CROP_EN.forEach((en) => {
    if (!byEn.has(en)) byEn.set(en, buildMarketCrop(en, toLabel(en), ''))
  })
  return Array.from(byEn.values()).sort(sortCropsForDashboard)
}

export function marketCropEnLabel(en: string): string {
  return toLabel(normalizeCropKey(en))
}

export function getFallbackMarketCrops(): MarketCrop[] {
  return [...FALLBACK_CROPS]
}

export async function fetchMarketCrops(apiBase: string): Promise<MarketCrop[]> {
  if (cropCache?.length) return [...cropCache]
  if (cropPromise) {
    const rows = await cropPromise
    return [...rows]
  }

  let rows: any[] = []
  cropPromise = (async () => {
    try {
      const res = await fetch(`${apiBase}/api/profit-loss/crops`)
      if (res.ok) {
        const payload = await res.json()
        rows = Array.isArray(payload?.crops) ? payload.crops : []
      }
    } catch {
      rows = []
    }
    const normalized = normalizeRows(rows)
    const merged = attachEmojis(normalized)
    cropCache = merged.length ? merged : FALLBACK_CROPS
    return [...cropCache]
  })()

  try {
    return await cropPromise
  } finally {
    cropPromise = null
  }
}

export function prioritizeMarketCrops(crops: MarketCrop[]): MarketCrop[] {
  return [...crops].sort((a, b) => {
    const pa = cropPriority(a.en)
    const pb = cropPriority(b.en)
    if (pa !== pb) return pa - pb
    return a.en.localeCompare(b.en)
  })
}

export function groupMarketCropsByCategory(crops: MarketCrop[]): Array<{
  key: CropCategory
  title: string
  icon: string
  accent: string
  background: string
  crops: MarketCrop[]
}> {
  const groups = CATEGORY_ORDER.map((key) => {
    const meta = CROP_CATEGORY_META[key]
    const groupCrops = prioritizeMarketCrops(
      crops.filter((crop) => crop.category === key),
    )
    return {
      key,
      title: meta.label,
      icon: meta.icon,
      accent: meta.accent,
      background: meta.background,
      crops: groupCrops,
    }
  })
  return groups.filter((g) => g.crops.length > 0)
}
