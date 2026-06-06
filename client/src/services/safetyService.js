import { apiFetch } from "./api";

export const triggerSOS = async (lat, lng) => {
  const response = await apiFetch("/safety/sos", {
    method: "POST",
    body: JSON.stringify({ lat, lng }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to trigger SOS alert");
  return data;
};

export const updateEmergencyContacts = async (contacts) => {
  const response = await apiFetch("/safety/contacts", {
    method: "POST",
    body: JSON.stringify({ contacts }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update emergency contacts");
  return data;
};

export const getRideQR = async (rideId) => {
  const response = await apiFetch(`/safety/qr/${rideId}`);
  if (!response.ok) throw new Error("Failed to fetch ride QR");
  return response.json();
};

export const verifyRideQR = async (verificationCode, passengerEmail) => {
  const response = await apiFetch("/safety/verify-qr", {
    method: "POST",
    body: JSON.stringify({ verificationCode, passengerEmail }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to verify boarding");
  return data;
};

export const reportIncident = async (incidentDetails) => {
  const response = await apiFetch("/safety/report", {
    method: "POST",
    body: JSON.stringify(incidentDetails),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to report incident");
  return data;
};
