/**
 * API Configuration
 * 
 * In development, we use the Vite proxy (/api/flask) to avoid CORS issues.
 * In production, we use the full Render URL.
 */

const isDev = import.meta.env.DEV;
const baseUrl = import.meta.env.VITE_API_URL || '';

export const FLASK_API_URL = isDev ? '/api/flask' : baseUrl;

// Helper to construct API endpoints
export const getEndpoint = (path: string) => `${FLASK_API_URL}${path}`;

// Simple singleton cache for API responses
const apiCache = new Map<string, any>();

export const fetchWithCache = async (path: string) => {
  const url = getEndpoint(path);
  if (apiCache.has(url)) return apiCache.get(url);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  
  const data = await res.json();
  apiCache.set(url, data);
  return data;
};
