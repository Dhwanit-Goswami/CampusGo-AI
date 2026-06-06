import { apiFetch } from "./api";

export const getCarbonMetrics = async () => {
  const response = await apiFetch("/analytics/carbon");
  if (!response.ok) throw new Error("Failed to fetch carbon offset data");
  return response.json();
};

export const getDashboardAnalytics = async () => {
  const response = await apiFetch("/analytics/dashboard");
  if (!response.ok) throw new Error("Failed to fetch dashboard charts data");
  return response.json();
};
