const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!BASE) return `/api${p}`
  
  // Check if BASE already ends with /api to avoid double /api
  if (BASE.endsWith('/api')) {
    return `${BASE}${p}`
  }
  
  return `${BASE}/api${p}`
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path)
  const opts: RequestInit = {
    ...init,
    credentials: 'include',
  }
  return fetch(url, opts)
}


