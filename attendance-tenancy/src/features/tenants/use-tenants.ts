"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Tenant } from "./types";

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTenants = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      setTenants(await api<Tenant[]>("/tenants"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  return { tenants, loading, error, loadTenants };
}
