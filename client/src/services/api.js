const host = window.location.hostname;
const isLocal =
  host === "localhost" ||
  host === "127.0.0.1" ||
  host.startsWith("192.168.") ||
  host.startsWith("10.") ||
  host.startsWith("172.");

export const API_BASE_URL = isLocal
  ? `http://${host}:5000`
  : "https://campus-vehicle-project.onrender.com";

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Use window event dispatcher to notify authStore about logout
      window.dispatchEvent(new Event("auth-unauthorized"));
      throw new Error("Session expired. Please log in again.");
    }
    
    return response;
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
};
