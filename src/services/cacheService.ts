let sessionsCache: unknown = null;
let lastFetch = 0;
let pendingPromise: Promise<unknown> | null = null;
let isFetching = false;
const CACHE_DURATION = 60000; // 1 minute

export async function getCachedOrFetch(fetchFunction: () => Promise<unknown>, forceRefresh = false) {
  const now = Date.now();
  
  if (!forceRefresh && sessionsCache && (now - lastFetch) < CACHE_DURATION) {
    return sessionsCache;
  }
  
  if (isFetching && pendingPromise) {
    return pendingPromise;
  }
  
  isFetching = true;
  pendingPromise = (async () => {
    try {
      const result = await fetchFunction();
      sessionsCache = result;
      lastFetch = now;
      return result;
    } finally {
      isFetching = false;
      pendingPromise = null;
    }
  })();
  
  return pendingPromise;
}

export function invalidateCache() {
  sessionsCache = null;
  lastFetch = 0;
  isFetching = false;
  pendingPromise = null;
}
