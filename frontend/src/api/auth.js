const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SESSION_KEY = "aarth_session";
const PROFILE_CACHE_TTL = 30000;
let profileCache = null;
let profileCacheExpires = 0;
let profileRequest = null;

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  profileCache = null;
  profileCacheExpires = 0;
  profileRequest = null;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("aarth_welcome");
  profileCache = null;
  profileCacheExpires = 0;
}

async function request(path, options = {}, includeAuth = true) {
  const headers = {
    Accept: "application/json",
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (includeAuth) {
    const session = readSession();

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
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
        detail.map((item) => item?.msg || String(item)).join(". ")
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
  async login(username, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    saveSession(data);

    return data;
  },

  async register(username, password, role) {
    const data = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: username.trim(),
        password,
        role,
      }),
    });

    saveSession(data);

    return data;
  },

  async me() {
    const session = readSession();

    if (
      profileCache &&
      profileCacheExpires > Date.now() &&
      profileCache.user_id === session?.profile?.user_id
    ) {
      return profileCache;
    }

    try {
      if (!profileRequest) {
        profileRequest = request("/api/auth/me");
      }
      const profile = await profileRequest;
      profileCache = profile;
      profileCacheExpires = Date.now() + PROFILE_CACHE_TTL;
      return profile;
    } catch (error) {
      if (
        error.message.includes("Invalid session") ||
        error.message.includes("401")
      ) {
        clearSession();
      }

      throw error;
    } finally {
      profileRequest = null;
    }
  },

  async refresh() {
    const session = readSession();

    if (!session?.refresh_token) {
      throw new Error("No refresh token is available.");
    }

    const data = await request(
      "/api/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({
          refresh_token: session.refresh_token,
        }),
      },
      false
    );

    const nextSession = {
      ...session,
      ...data,
    };

    saveSession(nextSession);

    return nextSession;
  },

  async saveProfile(profileData) {
    return request("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        profile_data: profileData,
      }),
    });
  },

  logout() {
    clearSession();
  },

  getSession() {
    return readSession();
  },

  clearSession,
};

export const dashboardPath = (role) => {
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
    return request("/api/lots");
  },

  async summary() {
    return request("/api/lots/summary");
  },

  async get(lotId) {
    return request(`/api/lots/${encodeURIComponent(lotId)}`);
  },

  async create(payload) {
    return request("/api/lots", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async submitEvidence(lotId, evidence) {
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(evidence.map(({ blob, preview, ...item }) => item)));
    evidence.forEach((item, index) => formData.append("files", item.blob, `lot-evidence-${index + 1}.jpg`));
    return request(`/api/lots/${encodeURIComponent(lotId)}/evidence`, {
      method: "POST",
      body: formData,
    });
  },
};

export const locationApi = {
  async search(query, district = "", taluka = "") {
    const params = new URLSearchParams({ q: query });
    if (district) params.set("district", district);
    if (taluka) params.set("taluka", taluka);
    return request(`/api/location/search?${params.toString()}`, {}, false);
  },

  async reverse(latitude, longitude) {
    return request("/api/location/reverse", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }, false);
  },
};