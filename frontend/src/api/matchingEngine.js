const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");


/*
|--------------------------------------------------------------------------
| Session
|--------------------------------------------------------------------------
|
| AARTH currently stores the authenticated session in localStorage.
| Keep this implementation compatible with the existing authentication
| flow instead of introducing a separate auth dependency here.
|
*/

function getSession() {
  try {
    return JSON.parse(
      localStorage.getItem("aarth_session") || "null"
    );
  } catch {
    return null;
  }
}


/*
|--------------------------------------------------------------------------
| Generic API Request
|--------------------------------------------------------------------------
|
| All matching-engine requests pass through this function so that:
|
| - API base URL is handled consistently
| - authentication token is attached automatically
| - JSON responses are parsed safely
| - backend errors are converted into readable Error objects
|
*/

async function request(path, options = {}) {
  const session = getSession();

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw new Error(
      error?.message ||
        "Could not connect to the AARTH matching engine."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      `Matching engine request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}


/*
|--------------------------------------------------------------------------
| Query Builder
|--------------------------------------------------------------------------
|
| Small helper used by the discovery APIs.
|
*/

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.set(key, String(value));
      }
    }
  );

  const queryString = query.toString();

  return queryString
    ? `?${queryString}`
    : "";
}


/*
|--------------------------------------------------------------------------
| Matching Engine API
|--------------------------------------------------------------------------
|
| This object intentionally keeps the larger API surface used by the
| AARTH frontend.
|
| Do NOT remove helper functions just because one page currently does
| not use them. Different marketplace/dashboard pages may consume them.
|
*/

export const matchingEngineApi = {

  /*
  |--------------------------------------------------------------------------
  | Farmer → Buyer Requirements
  |--------------------------------------------------------------------------
  |
  | Returns active/open buyer requirements visible to the current farmer.
  |
  | Backend endpoint:
  | GET /api/matching-engine/farmer/requirements
  |
  */

  async getFarmerRequirements(params = {}) {
    const query = buildQuery({
      /*
       * These filters are kept in the frontend API surface for
       * compatibility with marketplace pages.
       *
       * The current backend primarily supports `limit`.
       * Extra query parameters are harmless for FastAPI and can
       * be supported by the backend later without changing the UI.
       */

      commodity_key:
        params.commodity_key,

      status:
        params.status,

      limit:
        params.limit,
    });

    return request(
      `/api/matching-engine/farmer/requirements${query}`
    );
  },


  /*
  |--------------------------------------------------------------------------
  | Farmer → Requirement Details / Matching
  |--------------------------------------------------------------------------
  |
  | Returns the detailed match between:
  |
  |   Farmer Lot
  |       ↓
  |   Buyer Requirement
  |
  | Backend endpoint:
  | GET /api/matching-engine/farmer/requirements/{requirement_id}/lots/{lot_id}
  |
  */

  async getFarmerRequirementMatch(
    requirementId,
    lotId
  ) {
    if (!requirementId || !lotId) {
      throw new Error(
        "Requirement ID and lot ID are required."
      );
    }

    return request(
      `/api/matching-engine/farmer/requirements/${encodeURIComponent(
        requirementId
      )}/lots/${encodeURIComponent(
        lotId
      )}`
    );
  },


  /*
  |--------------------------------------------------------------------------
  | Buyer → Discover Farmer Lots
  |--------------------------------------------------------------------------
  |
  | Returns farmer lots ranked against the selected buyer requirement.
  |
  | Backend endpoint:
  | GET /api/matching-engine/buyer/lots
  |
  */

  async getBuyerLots(params = {}) {
    const query = buildQuery({
      requirement_id:
        params.requirement_id,

      commodity_key:
        params.commodity_key,

      /*
       * Kept for frontend compatibility.
       * The current backend accepts requirement_id,
       * commodity_key and limit.
       */

      status:
        params.status,

      limit:
        params.limit,

      /*
       * Offset is retained so pagination-aware frontend
       * components do not break.
       */
      offset:
        params.offset,
    });

    return request(
      `/api/matching-engine/buyer/lots${query}`
    );
  },


  /*
  |--------------------------------------------------------------------------
  | Buyer → Lot Details / Matching
  |--------------------------------------------------------------------------
  |
  | Returns detailed matching information for:
  |
  |   Buyer Requirement
  |           ↓
  |      Farmer Lot
  |
  | Backend endpoint:
  | GET /api/matching-engine/buyer/requirements/{requirement_id}/lots/{lot_id}
  |
  */

  async getBuyerLotMatch(
    requirementId,
    lotId
  ) {
    if (!requirementId || !lotId) {
      throw new Error(
        "Requirement ID and lot ID are required."
      );
    }

    return request(
      `/api/matching-engine/buyer/requirements/${encodeURIComponent(
        requirementId
      )}/lots/${encodeURIComponent(
        lotId
      )}`
    );
  },


  /*
  |--------------------------------------------------------------------------
  | Market Intelligence Adapter
  |--------------------------------------------------------------------------
  |
  | This connects the matching-engine frontend to the existing
  | market-intelligence implementation.
  |
  | Current backend-supported parameters:
  |
  |   crop_key
  |   latitude
  |   longitude
  |   top_n
  |
  | Backend endpoint:
  | GET /api/matching-engine/market-prices
  |
  | DO NOT modify backend/market_intelligence from this file.
  |
  */

  async getMarketPrices(params = {}) {

    /*
     * Support both naming styles:
     *
     *   params.crop_key
     *   params.cropKey
     *
     * This prevents older components from breaking.
     */

    const cropKey =
      params.crop_key ||
      params.cropKey ||
      params.commodity_key ||
      params.commodityKey ||
      "";

    if (!cropKey) {
      throw new Error(
        "Crop key is required to load market prices."
      );
    }

    const query = buildQuery({
      crop_key:
        cropKey,

      latitude:
        params.latitude,

      longitude:
        params.longitude,

      top_n:
        params.top_n ??
        params.topN ??
        8,
    });

    return request(
      `/api/matching-engine/market-prices${query}`
    );
  },


  /*
  |--------------------------------------------------------------------------
  | Convenience Helpers
  |--------------------------------------------------------------------------
  */

  /*
   * Returns only active buyer requirements.
   */

  async getOpenBuyerRequirements(
    params = {}
  ) {
    return this.getFarmerRequirements({
      ...params,
      status: "ACTIVE",
    });
  },


  /*
   * Returns active farmer lots.
   */

  async getOpenLots(
    params = {}
  ) {
    return this.getBuyerLots({
      ...params,
      status: "ACTIVE",
    });
  },


  /*
  |--------------------------------------------------------------------------
  | Generic Refresh Helpers
  |--------------------------------------------------------------------------
  |
  | Used by marketplace pages that need to refresh data without
  | duplicating query-building logic.
  |
  */

  async refreshBuyerLots(
    requirementId,
    options = {}
  ) {
    return this.getBuyerLots({
      ...options,
      requirement_id:
        requirementId,
    });
  },


  async refreshFarmerRequirements(
    options = {}
  ) {
    return this.getFarmerRequirements(
      options
    );
  },


  /*
  |--------------------------------------------------------------------------
  | Shorter Method Aliases
  |--------------------------------------------------------------------------
  |
  | These aliases make the API easier to consume in components while
  | preserving the longer method names above.
  |
  */

  async farmerRequirements(
    limit = 50
  ) {
    return this.getFarmerRequirements({
      limit,
    });
  },


  async buyerLots({
    requirementId = "",
    commodityKey = "",
    limit = 50,
    status = "",
    offset = "",
  } = {}) {
    return this.getBuyerLots({
      requirement_id:
        requirementId,

      commodity_key:
        commodityKey,

      limit,

      status,

      offset,
    });
  },


  async farmerMatch(
    requirementId,
    lotId
  ) {
    return this.getFarmerRequirementMatch(
      requirementId,
      lotId
    );
  },


  async buyerMatch(
    requirementId,
    lotId
  ) {
    return this.getBuyerLotMatch(
      requirementId,
      lotId
    );
  },


  /*
   * Short-form market price helper.
   *
   * Example:
   *
   * matchingEngineApi.marketPrices({
   *   cropKey: "onion",
   *   latitude: 19.87,
   *   longitude: 75.34,
   *   topN: 8
   * });
   */

  async marketPrices({
    cropKey,
    latitude,
    longitude,
    topN = 8,
  } = {}) {
    return this.getMarketPrices({
      crop_key:
        cropKey,

      latitude,

      longitude,

      top_n:
        topN,
    });
  },


  /*
  |--------------------------------------------------------------------------
  | Backward-Compatible Market Intelligence Parameters
  |--------------------------------------------------------------------------
  |
  | Older UI code may still call getMarketPrices() with:
  |
  | commodity_name
  | district
  | market
  |
  | Those values are intentionally NOT sent to the current backend
  | because the current /market-prices endpoint does not define them.
  |
  | Keeping the main method flexible prevents frontend breakage while
  | the actual supported filtering remains crop/location based.
  |
  */
};


/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
|
| Allows both:
|
|   import { matchingEngineApi } from "./matchingEngine";
|
| and:
|
|   import matchingEngineApi from "./matchingEngine";
|
*/

export default matchingEngineApi;