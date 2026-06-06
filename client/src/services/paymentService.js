import { apiFetch } from "./api";

export const requestPayment = async () => {
  const response = await apiFetch("/request-payment", { method: "POST" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to request payment");
  return data;
};

export const requestQuickPayment = async (requestId) => {
  const response = await apiFetch("/request-quick-payment", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to request quick drop payment");
  return data;
};

export const passengerPaid = async (type, rideId, paymentMethod) => {
  const response = await apiFetch("/passenger-paid", {
    method: "POST",
    body: JSON.stringify({ type, rideId, paymentMethod }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to confirm payment");
  return data;
};

export const getMyEarnings = async () => {
  const response = await apiFetch("/my-earnings");
  if (!response.ok) throw new Error("Failed to fetch earnings");
  return response.json();
};
