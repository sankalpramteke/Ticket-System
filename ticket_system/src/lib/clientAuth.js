export function saveToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const data = await res.json(); msg = data.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
