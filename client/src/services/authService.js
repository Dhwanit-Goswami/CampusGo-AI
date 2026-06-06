import { apiFetch } from "./api";

export const login = async (email, password) => {
  const response = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Login failed");
  }
  return response.json();
};

export const signup = async (name, email, password, gender) => {
  const response = await apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password, gender }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Registration failed");
  }
  return response.text();
};

export const forgotPassword = async (email) => {
  const response = await apiFetch("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to request OTP");
  }
  return data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await apiFetch("/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Password reset failed");
  }
  return data;
};

export const updateDriverStatus = async (license, vehicleModel, vehicleNumber, agreed, upiId, qrPhoto) => {
  const response = await apiFetch("/update-driver-status", {
    method: "POST",
    body: JSON.stringify({ license, vehicleModel, vehicleNumber, agreed, upiId, qrPhoto }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to verify driver");
  }
  return data;
};

export const updateProfile = async (gender) => {
  const response = await apiFetch("/update-profile", {
    method: "POST",
    body: JSON.stringify({ gender }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile");
  }
  return data;
};

export const getDriverProfile = async () => {
  const response = await apiFetch("/get-driver-profile");
  if (!response.ok) {
    throw new Error("Failed to fetch driver profile");
  }
  return response.json();
};

export const toggleOnline = async (status) => {
  const response = await apiFetch("/toggle-online", {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to toggle status");
  }
  return data;
};
