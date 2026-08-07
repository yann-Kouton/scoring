// En production (Vercel Services), le frontend et le backend partagent le
// même domaine : les requêtes relatives "/api/..." sont automatiquement
// routées vers le service backend par vercel.json (aucune variable requise).
//
// En dev local (deux serveurs séparés : Vite sur 5173, Uvicorn sur 8000),
// VITE_API_URL pointe vers l'origine du backend, ex. http://localhost:8000.
const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Erreur API (${res.status})`);
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),
  predict: (payload) =>
    request("/predict", { method: "POST", body: JSON.stringify(payload) }),
  metrics: () => request("/metrics"),
  featureImportance: () => request("/feature-importance"),
  dashboardStats: () => request("/dashboard-stats"),
};

export default api;
