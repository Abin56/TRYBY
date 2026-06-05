import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIStore = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  // Drawers
  productDrawer:  { open: boolean; productId: string | null };
  orderDrawer:    { open: boolean; orderId: string | null };
  customerDrawer: { open: boolean; customerId: string | null };
  openProductDrawer:  (id?: string) => void;
  closeProductDrawer: () => void;
  openOrderDrawer:    (id: string)  => void;
  closeOrderDrawer:   () => void;
  openCustomerDrawer: (id: string)  => void;
  closeCustomerDrawer:() => void;

  // Notifications
  notificationCount: number;
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      productDrawer:  { open: false, productId: null },
      orderDrawer:    { open: false, orderId: null },
      customerDrawer: { open: false, customerId: null },

      openProductDrawer:  (id) => set({ productDrawer: { open: true, productId: id ?? null } }),
      closeProductDrawer: ()   => set({ productDrawer: { open: false, productId: null } }),
      openOrderDrawer:    (id) => set({ orderDrawer: { open: true, orderId: id } }),
      closeOrderDrawer:   ()   => set({ orderDrawer: { open: false, orderId: null } }),
      openCustomerDrawer: (id) => set({ customerDrawer: { open: true, customerId: id } }),
      closeCustomerDrawer:()   => set({ customerDrawer: { open: false, customerId: null } }),

      notificationCount: 3,
    }),
    { name: "admin-ui", partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
