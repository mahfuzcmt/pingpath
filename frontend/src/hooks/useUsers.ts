"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserCreate, UserDetail, UserUpdate } from "@/types/domain";

export function useUsers() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<UserDetail[]>("/orgs/me/users");
      setUsers(r.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (req: UserCreate) => {
    const r = await api.post<UserDetail>("/orgs/me/users", req);
    setUsers((prev) => [...prev, r.data]);
    return r.data;
  }, []);

  const update = useCallback(async (id: string, patch: UserUpdate) => {
    const r = await api.patch<UserDetail>(`/orgs/me/users/${id}`, patch);
    setUsers((prev) => prev.map((u) => (u.id === id ? r.data : u)));
    return r.data;
  }, []);

  const disable = useCallback(async (id: string) => {
    await api.delete(`/orgs/me/users/${id}`);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)),
    );
  }, []);

  return { users, loading, error, refresh, create, update, disable };
}
