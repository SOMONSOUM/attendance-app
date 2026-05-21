import { create } from "zustand";
import { api } from "@/lib/api";
import type { LoginValues } from "@/lib/validation";
import type { AuthSession, SessionUser } from "./types";

type AuthState = {
  user: SessionUser | null;
  canManageTenants: () => boolean;
  login: (values: LoginValues) => Promise<void>;
  refresh: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  canManageTenants: () =>
    Boolean(get().user?.permissions.includes("tenants:read")),
  login: async (values) => {
    const session = await api<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(values),
    });
    set({ user: session.user });
  },
  refresh: async () => {
    await get().loadCurrentUser();
  },
  loadCurrentUser: async () => {
    const user = await api<SessionUser>("/auth/me");
    if (!user.permissions.includes("tenants:read")) {
      get().clearSession();
      throw new Error("This account cannot access tenant management.");
    }
    set({ user });
  },
  logout: async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    get().clearSession();
  },
  clearSession: () => set({ user: null }),
}));
