// ~/stores/sidebarStore.ts
import { create } from 'zustand';

interface SidebarState {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggleCollapsed: () =>
    set((state) => ({ collapsed: !state.collapsed })),
}));