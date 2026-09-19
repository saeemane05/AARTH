// A small, commodity-scoped suggestion vocabulary. Variety remains free text;
// this is intentionally not a second database or a standardized-value rule.
export const COMMODITY_VARIETY_SUGGESTIONS = {
  onion: ["Nashik Red", "Nashik Onion", "Nasik Red", "Agrifound Dark Red", "Bhima Red"],
  tomato: ["Pusa Ruby", "Arka Rakshak", "Arka Vikas", "Namdhari"],
  potato: ["Kufri Jyoti", "Kufri Pukhraj", "Kufri Bahar"],
  wheat: ["Lok 1", "HD 2967", "MACS 6222"],
  rice: ["Indrayani", "Kolam", "Basmati"],
  grapes: ["Thompson Seedless", "Sonaka", "Sharad Seedless"],
};

export function varietySuggestions(commodityKey, query) {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return (COMMODITY_VARIETY_SUGGESTIONS[commodityKey] || []).filter((value) => value.toLowerCase().includes(term));
}
