import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface Status { setupRequired: boolean; setupKeyRequired: boolean; user: User | null }
interface AuthCtx { user: User | null; setupRequired: boolean; loading: boolean; setupKeyRequired: boolean; login: (u: string, p: string, setup: boolean, setupKey?: string) => Promise<void>; logout: () => Promise<void> }
const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['auth'], queryFn: () => api.get<{ data: Status }>('/auth/status').then((r) => r.data) });
  const login = async (username: string, password: string, setup: boolean, setupKey?: string) => {
    await api.post(setup ? '/auth/setup' : '/auth/login', { username, password, ...(setup && setupKey ? { setupKey } : {}) });
    await qc.invalidateQueries({ queryKey: ['auth'] });
  };
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* even if the request fails, drop the local session view */
    }
    // keep the auth query (so the provider re-renders), drop all other cached data
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    qc.setQueryData<Status>(['auth'], (old) => ({ setupRequired: false, setupKeyRequired: false, ...old, user: null }));
  };
  return <Ctx.Provider value={{ user: q.data?.user ?? null, setupRequired: q.data?.setupRequired ?? false, setupKeyRequired: q.data?.setupKeyRequired ?? false, loading: q.isLoading, login, logout }}>{children}</Ctx.Provider>;
}
