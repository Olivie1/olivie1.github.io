// Call sites already include /api. An empty base uses the Vite/nginx proxy.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
