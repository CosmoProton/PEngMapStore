import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) { setLoading(false); return; }
    try {
      const res = await apiFetch('/api/me');
      setUser(res);
    } catch {
      localStorage.removeItem('jwt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login  = (token) => { localStorage.setItem('jwt', token); loadUser(); };
  const logout = ()      => { localStorage.removeItem('jwt'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('jwt');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// Permission helpers
export const STATUS_LABELS = {
  pending:     { label: 'Pending',    cls: 'badge-yellow' },
  active:      { label: 'User',       cls: 'badge-cyan'   },
  whitelisted: { label: 'Verified',   cls: 'badge-green'  },
  admin:       { label: 'Admin',      cls: 'badge-purple' },
  superadmin:  { label: 'Admin',      cls: 'badge-purple' }, // shown as Admin in UI
  teacher:     { label: 'Teacher',    cls: 'badge-yellow' },
  banned:      { label: 'Banned',     cls: 'badge-red'    },
};
