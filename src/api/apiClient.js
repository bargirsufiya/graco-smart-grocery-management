// Shared fetch helper for the backend API.
// Sends the JWT saved by the login screen (Module 1) with every request.

// Backend address: set VITE_BACKEND_URL in .env when deployed (e.g. https://graco-api.onrender.com).
// Not VITE_API_URL: Module 3 uses that name to switch to a server mode of its own.
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").trim().replace(/\/+$/, "");
export const API_BASE_URL = `${BACKEND_URL}/api`;

export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("graco_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  // Expired or missing session: sign out so the user can log in again
  if (response.status === 401) {
    localStorage.removeItem("graco_token");
    localStorage.removeItem("graco_currentUser");
    window.location.reload();
  }

  if (!response.ok) {
    // Module 1 routes answer with "message", Module 4 routes with "msg"
    throw new Error(data.message || data.msg || "Request failed");
  }

  return data;
}
