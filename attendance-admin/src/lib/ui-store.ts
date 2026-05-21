import { create } from "zustand";
import type { EventRecord, RoleRecord, UserRecord } from "@/lib/admin-data";

type AdminUiState = {
  editingEvent: EventRecord | null;
  eventStep: number;
  qrEvent: EventRecord | null;
  editingUser: UserRecord | null;
  editingRole: RoleRecord | null;
  setEditingEvent: (event: EventRecord | null) => void;
  setEventStep: (step: number) => void;
  setQrEvent: (event: EventRecord | null) => void;
  setEditingUser: (user: UserRecord | null) => void;
  setEditingRole: (role: RoleRecord | null) => void;
};

export const useAdminUiStore = create<AdminUiState>((set) => ({
  editingEvent: null,
  eventStep: 0,
  qrEvent: null,
  editingUser: null,
  editingRole: null,
  setEditingEvent: (editingEvent) => set({ editingEvent }),
  setEventStep: (eventStep) => set({ eventStep }),
  setQrEvent: (qrEvent) => set({ qrEvent }),
  setEditingUser: (editingUser) => set({ editingUser }),
  setEditingRole: (editingRole) => set({ editingRole }),
}));
