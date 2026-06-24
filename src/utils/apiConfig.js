/** Ensure VITE_API_URL always ends with /api (e.g. production host without /api still works). */
export function normalizeApiBaseUrl(url) {
  const trimmed = (url || 'http://localhost:3001/api').trim().replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
