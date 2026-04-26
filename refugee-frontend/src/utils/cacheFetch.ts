/**
 * Simple caching utility for API requests.
 * Uses sessionStorage to persist data across page navigations in the same session.
 */

export const cachedFetch = async (url: string, ttl_ms = 300000) => {
  const cacheKey = `api_cache_${url}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl_ms) {
        return data;
      }
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
  
  const data = await response.json();
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // In case of QuotaExceededError or other storage issues
    console.warn('Cache write failed:', e);
  }
  
  return data;
};
