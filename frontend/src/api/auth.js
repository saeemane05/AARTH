const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const SESSION_KEY = "aarth_session";

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("aarth_welcome");
}

async function request(path, options = {}, includeAuth = true) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
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
    try {
      return await request("/api/auth/me");
    } catch (error) {
      if (
        error.message.includes("Invalid session") ||
        error.message.includes("401")
      ) {
        clearSession();
      }

      throw error;
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