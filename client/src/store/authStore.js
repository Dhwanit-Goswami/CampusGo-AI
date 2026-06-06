import { create } from "zustand";
import { login, signup, updateDriverStatus, toggleOnline } from "../services/authService";

const getStoredUser = () => {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  isOnline: localStorage.getItem("isOnline") === "true",
  loading: false,
  error: null,

  loginAction: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      
      const userData = {
        name: data.name,
        email: data.email,
        gender: data.gender,
        isCampusDriver: data.isCampusDriver,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      set({
        token: data.token,
        user: userData,
        isAuthenticated: true,
        loading: false,
      });
      return userData;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signupAction: async (name, email, password, gender) => {
    set({ loading: true, error: null });
    try {
      const msg = await signup(name, email, password, gender);
      set({ loading: false });
      return msg;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logoutAction: () => {
    // If online, attempt to set offline on server
    const token = localStorage.getItem("token");
    if (token && localStorage.getItem("isOnline") === "true") {
      toggleOnline(false).catch(() => {});
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isOnline");
    localStorage.removeItem("isMissionActive");
    localStorage.removeItem("activeRideId");

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isOnline: false,
      error: null,
    });
  },

  updateDriverAction: async (license, vehicleModel, vehicleNumber, agreed, upiId, qrPhoto) => {
    set({ loading: true, error: null });
    try {
      const data = await updateDriverStatus(license, vehicleModel, vehicleNumber, agreed, upiId, qrPhoto);
      set((state) => {
        const updatedUser = { ...state.user, isCampusDriver: true };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { user: updatedUser, loading: false };
      });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  toggleOnlineAction: async (status) => {
    set({ loading: true, error: null });
    try {
      const data = await toggleOnline(status);
      localStorage.setItem("isOnline", String(data.isOnline));
      set({ isOnline: data.isOnline, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateLocalUserGender: (gender) => {
    set((state) => {
      const updatedUser = { ...state.user, gender };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));

// Listen for global fetch unauthorized events
if (typeof window !== "undefined") {
  window.addEventListener("auth-unauthorized", () => {
    useAuthStore.getState().logoutAction();
  });
}
