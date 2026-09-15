// Vite forwards this relative URL to FastAPI in development. Set VITE_API_URL
// only when the deployed API is hosted at a different address.
const API_URL = import.meta.env.VITE_API_URL || "";
async function request(path, options = {}) { const response = await fetch(`${API_URL}${path}`, { headers: { "Content-Type": "application/json", ...options.headers }, ...options }); const body = await response.json().catch(() => ({})); if (!response.ok) { const detail = Array.isArray(body.detail) ? body.detail.map((item) => item.msg).join(". ") : body.detail; throw new Error(typeof detail === "string" ? detail : "Authentication request was rejected."); } return body; }
export const authApi = { login: (username, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }), register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }), catalog: () => request("/api/auth/catalog") };
export const dashboardPath = (role) => `/${role.toLowerCase().replaceAll("_", "-")}`;
