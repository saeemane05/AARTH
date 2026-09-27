const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SESSION_KEY = "aarth_session";
const SIH_DEMO_KEY = "sih26193_demo";

function isSIHDemo() {
  try {
    return sessionStorage.getItem(SIH_DEMO_KEY) === "true";
  } catch {
    return false;
  }
}

function getSIHDemoProfile() {
  let role = "FARMER";
  let demoId = "SIH26193-FAR-0001";

  try {
    const roleKey =
      sessionStorage.getItem("sih26193_demo_role") || "farmer";

    demoId =
      sessionStorage.getItem("sih26193_demo_id") || demoId;

    role =
      ({
        farmer: "FARMER",
        buyer: "BUYER",
        fpo: "FPO",
        logistics: "LOGISTICS_PARTNER",
        storage: "STORAGE_PARTNER",
      })[roleKey] || "FARMER";
  } catch {}

  const base = {
    user_id: `sih-demo-${role.toLowerCase()}`,
    username: `sih26193_${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@sih26193.demo`,
    phone: "+91 90000 26193",
    role,
    role_id: demoId,
    aarth_id: demoId,
    status: "ACTIVE",
  };

  const profile_data = {
    FARMER: {
      full_name: "SIH Demo Farmer",
      phone_number: base.phone,

      district: "Nashik",
      taluka: "Niphad",
      village_area: "Demo Village",

      farm_size: "4.5 acres",

      crops: [
        "Onion",
        "Grapes",
      ],

      registered_state: "Maharashtra",

      verification_status: "VERIFIED",
      profile_status: "ACTIVE",
    },

    BUYER: {
      company_name: "Maharashtra Agro Foods",
      phone_number: base.phone,

      registered_state: "Maharashtra",
      registered_district: "Nashik",

      organisation_type: "Processor",

      sourcing_commodities: [
        "Onion",
        "Tomato",
        "Grapes",
      ],

      preferred_sourcing_regions: [
        "Nashik",
        "Ahmednagar",
      ],

      verification_status: "VERIFIED",
      profile_status: "ACTIVE",
    },

    FPO: {
      fpo_name: "SIH Demo FPO",
      phone_number: base.phone,

      organisation_type:
        "Farmer Producer Organisation",

      registration_number:
        "FPO-SIH26193",

      district: "Nashik",
      taluka: "Niphad",
      village: "Demo Village",

      address: "Maharashtra",

      crops: [
        "Onion",
        "Grapes",
      ],

      verification_status: "VERIFIED",
      profile_status: "ACTIVE",
    },

    LOGISTICS_PARTNER: {
      business_name:
        "SIH Demo Logistics",

      phone_number: base.phone,

      primary_operating_district:
        "Nashik",

      districts_served: [
        "Nashik",
        "Ahmednagar",
        "Pune",
      ],

      vehicle_types: [
        "Mini Truck",
        "Truck",
      ],

      cargo_types: [
        "Agricultural Produce",
      ],

      gstin_status:
        "VERIFIED",

      verification_status:
        "VERIFIED",

      profile_status:
        "ACTIVE",
    },

    STORAGE_PARTNER: {
      facility_name:
        "SIH Demo Agro Storage",

      phone_number:
        base.phone,

      district:
        "Nashik",

      taluka:
        "Niphad",

      village_area:
        "Demo Village",

      capacity:
        "500 MT",

      available_capacity:
        "180 MT",

      storage_type:
        "Cold Storage",

      supported_commodities: [
        "Onion",
        "Grapes",
        "Pomegranate",
      ],

      registered_state:
        "Maharashtra",

      verification_status:
        "VERIFIED",

      facility_verification:
        "VERIFIED",

      profile_status:
        "ACTIVE",
    },
  }[role] || {};

  return {
    ...base,
    profile_data,
  };
}

const PROFILE_CACHE_TTL = 30000;

let profileCache = null;
let profileCacheExpires = 0;
let profileRequest = null;

function readSession() {
  try {
    return JSON.parse(
      localStorage.getItem(SESSION_KEY) || "null"
    );
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    sessionStorage.removeItem(SIH_DEMO_KEY);
    sessionStorage.removeItem(
      "sih26193_demo_role"
    );
    sessionStorage.removeItem(
      "sih26193_demo_id"
    );
  } catch {}

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  profileCache = null;
  profileCacheExpires = 0;
  profileRequest = null;
}

function clearSession() {
  localStorage.removeItem(
    SESSION_KEY
  );

  localStorage.removeItem(
    "aarth_welcome"
  );

  try {
    sessionStorage.removeItem(
      SIH_DEMO_KEY
    );

    sessionStorage.removeItem(
      "sih26193_demo_role"
    );

    sessionStorage.removeItem(
      "sih26193_demo_id"
    );
  } catch {}

  profileCache = null;
  profileCacheExpires = 0;
}

async function request(
  path,
  options = {},
  includeAuth = true
) {
  const headers = {
    Accept: "application/json",

    ...(options.body &&
    !(options.body instanceof FormData)
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    ...(options.headers || {}),
  };

  if (includeAuth) {
    const session = readSession();

    if (session?.access_token) {
      headers.Authorization =
        `Bearer ${session.access_token}`;
    }
  }

  let response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw new Error(
      "Cannot connect to the AARTH backend. Make sure FastAPI is running on port 8000."
    );
  }

  let body = {};

  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    const detail = body?.detail;

    if (Array.isArray(detail)) {
      throw new Error(
        detail
          .map(
            (item) =>
              item?.msg ||
              String(item)
          )
          .join(". ")
      );
    }

    throw new Error(
      typeof detail === "string"
        ? detail
        : `Request failed with status ${response.status}.`
    );
  }

  return body;
}

export const authApi = {
  async login(
    username,
    password
  ) {
    const data =
      await request(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            username:
              username.trim(),
            password,
          }),
        }
      );

    saveSession(data);

    return data;
  },

  async register(
    username,
    password,
    role
  ) {
    const data =
      await request(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            username:
              username.trim(),
            password,
            role,
          }),
        }
      );

    saveSession(data);

    return data;
  },

  async me() {
    const session =
      readSession();

    if (isSIHDemo()) {
      const profile =
        getSIHDemoProfile();

      profileCache =
        profile;

      profileCacheExpires =
        Date.now() +
        PROFILE_CACHE_TTL;

      return profile;
    }

    if (
      profileCache &&
      profileCacheExpires >
        Date.now() &&
      profileCache.user_id ===
        session?.profile?.user_id
    ) {
      return profileCache;
    }

    try {
      if (!profileRequest) {
        profileRequest =
          request(
            "/api/auth/me"
          );
      }

      const profile =
        await profileRequest;

      profileCache =
        profile;

      profileCacheExpires =
        Date.now() +
        PROFILE_CACHE_TTL;

      return profile;
    } catch (error) {
      if (
        error.message.includes(
          "Invalid session"
        ) ||
        error.message.includes(
          "401"
        )
      ) {
        clearSession();
      }

      throw error;
    } finally {
      profileRequest = null;
    }
  },

  async refresh() {
    const session =
      readSession();

    if (!session?.refresh_token) {
      throw new Error(
        "No refresh token is available."
      );
    }

    const data =
      await request(
        "/api/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({
            refresh_token:
              session.refresh_token,
          }),
        },
        false
      );

    const nextSession = {
      ...session,
      ...data,
    };

    saveSession(
      nextSession
    );

    return nextSession;
  },

  async saveProfile(
    profileData
  ) {
    if (isSIHDemo()) {
      const current =
        getSIHDemoProfile();

      const next = {
        ...current,

        profile_data: {
          ...current.profile_data,
          ...profileData,
        },
      };

      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          access_token:
            "sih26193-demo-token",

          profile: next,
        })
      );

      profileCache =
        next;

      profileCacheExpires =
        Date.now() +
        PROFILE_CACHE_TTL;

      return next;
    }

    return request(
      "/api/auth/profile",
      {
        method: "PUT",

        body: JSON.stringify({
          profile_data:
            profileData,
        }),
      }
    );
  },

  logout() {
    clearSession();
  },

  getSession() {
    return readSession();
  },

  clearSession,
};

export const dashboardPath = (
  role
) => {
  switch (role) {
    case "FARMER":
      return "/farmer";

    case "FPO":
      return "/fpo";

    case "BUYER":
      return "/buyer";

    case "LOGISTICS_PARTNER":
      return "/logistics-partner";

    case "STORAGE_PARTNER":
      return "/storage-partner";

    case "ADMIN":
      return "/admin";

    default:
      return "/login";
  }
};

export const lotApi = {
  async list() {
    return request(
      "/api/lots"
    );
  },

  async summary() {
    return request(
      "/api/lots/summary"
    );
  },

  async get(lotId) {
    return request(
      `/api/lots/${encodeURIComponent(
        lotId
      )}`
    );
  },

  async create(payload) {
    return request(
      "/api/lots",
      {
        method: "POST",
        body: JSON.stringify(
          payload
        ),
      }
    );
  },

  async delete(lotId) {
    return request(
      `/api/lots/${encodeURIComponent(
        lotId
      )}`,
      {
        method: "DELETE",
      }
    );
  },

  async submitEvidence(
    lotId,
    evidence
  ) {
    const formData =
      new FormData();

    formData.append(
      "metadata",
      JSON.stringify(
        evidence.map(
          ({
            blob,
            preview,
            ...item
          }) => item
        )
      )
    );

    evidence.forEach(
      (item, index) =>
        formData.append(
          "files",
          item.blob,
          `lot-evidence-${index + 1}.${item.media_type === "video" ? "webm" : "jpg"}`
        )
    );

    return request(
      `/api/lots/${encodeURIComponent(
        lotId
      )}/evidence`,
      {
        method: "POST",
        body: formData,
      }
    );
  },
};

export const locationApi = {
  async search(
    query,
    district = "",
    taluka = ""
  ) {
    const params =
      new URLSearchParams({
        q: query,
      });

    if (district)
      params.set(
        "district",
        district
      );

    if (taluka)
      params.set(
        "taluka",
        taluka
      );

    return request(
      `/api/location/search?${params.toString()}`,
      {},
      false
    );
  },

  async reverse(
    latitude,
    longitude
  ) {
    return request(
      "/api/location/reverse",
      {
        method: "POST",
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      },
      false
    );
  },
};

export const buyerRequirementApi = {
  list: () =>
    request(
      "/api/buyer-requirements"
    ),

  get: (id) =>
    request(
      `/api/buyer-requirements/${encodeURIComponent(
        id
      )}`
    ),

  create: (payload) =>
    request(
      "/api/buyer-requirements",
      {
        method: "POST",
        body: JSON.stringify(
          payload
        ),
      }
    ),

  update: (id, payload) =>
    request(
      `/api/buyer-requirements/${encodeURIComponent(
        id
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(
          payload
        ),
      }
    ),

  publish: (id) =>
    request(
      `/api/buyer-requirements/${encodeURIComponent(
        id
      )}/publish`,
      {
        method: "POST",
      }
    ),

  transition: (
    id,
    status
  ) =>
    request(
      `/api/buyer-requirements/${encodeURIComponent(
        id
      )}/status`,
      {
        method: "POST",
        body: JSON.stringify({
          status,
        }),
      }
    ),

  delete: (id) =>
    request(
      `/api/buyer-requirements/${encodeURIComponent(
        id
      )}`,
      {
        method: "DELETE",
      }
    ),
};

export const logisticsApi = {
  listVehicles: () =>
    isSIHDemo()
      ? Promise.resolve({
          vehicles: [
            {
              id: "DEMO-VEH-001",
              registration_number:
                "MH-15-SIH-2619",
              vehicle_type:
                "Truck",
              capacity:
                "10 MT",
              status:
                "VERIFIED",
            },

            {
              id: "DEMO-VEH-002",
              registration_number:
                "MH-15-SIH-2620",
              vehicle_type:
                "Mini Truck",
              capacity:
                "3 MT",
              status:
                "VERIFIED",
            },
          ],
        })
      : request(
          "/api/logistics/vehicles"
        ),

  createVehicle: (
    payload
  ) =>
    request(
      "/api/logistics/vehicles",
      {
        method: "POST",
        body: JSON.stringify(
          payload
        ),
      }
    ),

  deleteVehicle: (
    id
  ) =>
    request(
      `/api/logistics/vehicles/${encodeURIComponent(
        id
      )}`,
      {
        method: "DELETE",
      }
    ),

  uploadVehicleDocument: (
    id,
    type,
    file
  ) => {
    const body =
      new FormData();

    body.append(
      "file",
      file
    );

    return request(
      `/api/logistics/vehicles/${encodeURIComponent(
        id
      )}/documents/${encodeURIComponent(
        type
      )}`,
      {
        method: "POST",
        body,
      }
    );
  },
};

export const verificationApi = {
  gstin: (
    gstin
  ) =>
    request(
      "/api/verification/gstin",
      {
        method: "POST",
        body: JSON.stringify({
          gstin,
        }),
      }
    ),
};