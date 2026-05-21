import { create } from "zustand";

export type ScanRegistration = {
  id: string;
  fullNameEn: string;
  fullNameKm?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  position?: string;
  department?: string;
};

type ScanState = {
  results: ScanRegistration[];
  selected: ScanRegistration | null;
  searching: boolean;
  hasSearched: boolean;
  busy: boolean;
  alreadyJoinedOpen: boolean;
  setResults: (results: ScanRegistration[]) => void;
  setSelected: (selected: ScanRegistration | null) => void;
  setSearching: (searching: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  setBusy: (busy: boolean) => void;
  setAlreadyJoinedOpen: (alreadyJoinedOpen: boolean) => void;
};

export const useScanStore = create<ScanState>((set) => ({
  results: [],
  selected: null,
  searching: false,
  hasSearched: false,
  busy: false,
  alreadyJoinedOpen: false,
  setResults: (results) => set({ results }),
  setSelected: (selected) => set({ selected }),
  setSearching: (searching) => set({ searching }),
  setHasSearched: (hasSearched) => set({ hasSearched }),
  setBusy: (busy) => set({ busy }),
  setAlreadyJoinedOpen: (alreadyJoinedOpen) => set({ alreadyJoinedOpen }),
}));
