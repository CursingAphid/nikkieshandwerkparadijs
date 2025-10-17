const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  
  // For local development, always add /api
  if (!BASE || BASE.includes('localhost') || BASE.includes('127.0.0.1')) {
    return `/api${p}`
  }
  
  // For production, check if BASE already contains /api
  if (BASE.includes('/api')) {
    // If BASE already contains /api, use it as is
    const url = `${BASE}${p}`
    console.log('API URL (BASE contains /api):', url)
    return url
  }
  
  // If BASE doesn't contain /api, add it
  const url = `${BASE}/api${p}`
  console.log('API URL (BASE does not contain /api):', url, 'BASE:', BASE)
  return url
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path)
  console.log('apiFetch called with path:', path, '-> URL:', url)
  const opts: RequestInit = {
    ...init,
    credentials: 'include',
  }
  return fetch(url, opts)
}


