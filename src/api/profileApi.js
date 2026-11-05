// Module 1 profile management API (/api/auth)

import { apiRequest } from "./apiClient";

export const getProfile = () => apiRequest("/auth/me");

export const updateProfile = (name) =>
  apiRequest("/auth/profile", { method: "PUT", body: { name } });

export const changePassword = (currentPassword, newPassword) =>
  apiRequest("/auth/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
