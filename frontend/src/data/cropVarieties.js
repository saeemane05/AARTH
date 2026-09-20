import cropVarieties from "./CropVarieties.json";

// CropVarieties.json is the single source of truth for crop-specific varieties.
export function varietiesForCrop(cropKey) {
  return (cropVarieties[cropKey] || []).filter((value) => !/^No verified /i.test(value));
}

export function hasVarietyChoices(cropKey) {
  return varietiesForCrop(cropKey).length > 0;
}
