import { useAuthStore } from "../context/authStore";
import { useRootApi, useRootResource } from "../hooks/useApi";

export const useLogout = () => {
  const api = useRootApi();
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);

  return async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Dev mode — no auth backend
    }
    setLoggedIn(false);
    window.location.reload();
  };
};

export const useAuthMethods = () => {
  return useRootResource("auth/methods");
};
