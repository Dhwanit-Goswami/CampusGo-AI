import { apiFetch } from "./api";

export const searchRoutes = async (destination, lat, lng) => {
  let query = "";
  if (lat && lng) {
    query = `?lat=${lat}&lng=${lng}`;
  } else if (destination) {
    query = `?destination=${encodeURIComponent(destination)}`;
  }
  const response = await apiFetch(`/search-routes${query}`);
  if (!response.ok) throw new Error("Search failed");
  return response.json();
};

export const searchCampusDrivers = async () => {
  const response = await apiFetch("/search-campus-drivers");
  if (!response.ok) throw new Error("Failed to search campus drivers");
  return response.json();
};

export const publishRoute = async (routeDetails) => {
  const response = await apiFetch("/publish-route", {
    method: "POST",
    body: JSON.stringify(routeDetails),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to publish route");
  return data;
};

export const cancelRoute = async () => {
  const response = await apiFetch("/cancel-route", { method: "POST" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to cancel route");
  return data;
};

export const completeRoute = async () => {
  const response = await apiFetch("/complete-route", { method: "POST" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to complete route");
  return data;
};

export const startRoute = async () => {
  const response = await apiFetch("/start-route", { method: "POST" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to start route");
  return data;
};

export const arrivePassenger = async (passengerEmail) => {
  const response = await apiFetch("/arrive-passenger", {
    method: "POST",
    body: JSON.stringify({ passengerEmail }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to arrive");
  return data;
};

export const requestRide = async (rideId, pickupLocation) => {
  const response = await apiFetch("/request-ride", {
    method: "POST",
    body: JSON.stringify({ rideId, pickupLocation }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to request ride");
  }
  return response.json();
};

export const acceptPassenger = async (passengerEmail) => {
  const response = await apiFetch("/accept-passenger", {
    method: "POST",
    body: JSON.stringify({ passengerEmail }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to accept passenger");
  return data;
};

export const rejectPassenger = async (passengerEmail) => {
  const response = await apiFetch("/reject-passenger", {
    method: "POST",
    body: JSON.stringify({ passengerEmail }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to reject passenger");
  return data;
};

export const leaveRide = async (rideId) => {
  const response = await apiFetch("/leave-ride", {
    method: "POST",
    body: JSON.stringify({ rideId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to leave ride");
  return data;
};

export const getActiveMission = async () => {
  const response = await apiFetch("/get-active-mission");
  if (!response.ok) throw new Error("Failed to fetch active mission");
  return response.json();
};

export const myRideStatus = async (rideId) => {
  const response = await apiFetch(`/my-ride-status?rideId=${rideId}`);
  if (!response.ok) throw new Error("Failed to fetch ride status");
  return response.json();
};

export const myTrips = async () => {
  const response = await apiFetch("/my-trips");
  if (!response.ok) throw new Error("Failed to fetch trip history");
  return response.json();
};
