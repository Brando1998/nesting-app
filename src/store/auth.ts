// stores/auth.ts
import { defineStore } from "pinia";
import type { User } from "../types/User";
import { useApi } from "../composables/useApi";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: null as User | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => !!state.user?.is_admin,
  },
  actions: {
    setToken(token: string | null) {
      this.token = token;
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    },
    setUser(user: User | null) {
      this.user = user;
    },
    async fetchProfile() {
      const { api } = useApi();
      if (!this.token) {
        this.user = null;
        return;
      }
      try {
        const { data } = await api.get<User>("/users/me/");
        this.user = data;
      } catch {
        this.user = null;
      }
    },
    logout() {
      this.setToken(null);
      this.setUser(null);
    },
  },
});
