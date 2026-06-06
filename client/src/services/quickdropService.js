import { apiFetch } from "./api";

export const requestQuickDrop = async (driverEmail, pickup, drop) => {
  const response = await apiFetch("/request-quick-drop", {
    method: "POST",
    body: JSON.stringify({ driverEmail, pickup, drop }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to request quick drop");
  return data;
};

export const acceptQuickDrop = async (requestId, fare) => {
  const response = await apiFetch("/accept-quick-drop", {
    method: "POST",
    body: JSON.stringify({ requestId, fare }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to accept quick drop");
  return data;
};

export const startQuickDrop = async (requestId) => {
  const response = await apiFetch("/start-quick-drop", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to start quick drop");
  return data;
};

export const arriveQuickDrop = async (requestId) => {
  const response = await apiFetch("/arrive-quick-drop", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to arrive quick drop");
  return data;
};

export const completeQuickDrop = async (requestId) => {
  const response = await apiFetch("/complete-quick-drop", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to complete quick drop");
  return data;
};

export const rejectQuickDrop = async (requestId) => {
  const response = await apiFetch("/reject-quick-drop", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to reject quick drop");
  return data;
};
