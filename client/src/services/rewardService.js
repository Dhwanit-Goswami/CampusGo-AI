import { apiFetch } from "./api";

export const getLeaderboard = async () => {
  const response = await apiFetch("/rewards/leaderboard");
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json();
};

export const getMyRewards = async () => {
  const response = await apiFetch("/rewards/my-rewards");
  if (!response.ok) throw new Error("Failed to fetch user rewards");
  return response.json();
};

export const getPointsLogs = async () => {
  const response = await apiFetch("/rewards/logs");
  if (!response.ok) throw new Error("Failed to fetch rewards log");
  return response.json();
};
