// Test stub for the `virtual:pwa-register/react` module, which only exists when
// the VitePWA plugin runs. Tests override this via `vi.mock`.
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}],
    offlineReady: [false, () => {}],
    updateServiceWorker: () => {},
  };
}
