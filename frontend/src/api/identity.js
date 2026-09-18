import { authApi } from "./auth";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const session = authApi.getSession();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Accept: "application/json", Authorization: `Bearer ${session?.access_token || ""}`, ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || "AARTH identity service is unavailable.");
  return body;
}

export const identityApi = {
  credential: () => request("/api/identity/farmer-credential"),
  lookupFarmer: (farmerId) => request(`/api/identity/farmer/${encodeURIComponent(farmerId)}`),
  syncOnboarding: (record) => request("/api/identity/assisted-onboarding/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) }),
};