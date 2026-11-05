// Module 4 sharing, item assignment and reminder API
// (same endpoints as the Module 4 ShareModal, AssignDropdown and ReminderForm)

import { apiRequest } from "./apiClient";

export const getCollaborators = (listId) =>
  apiRequest(`/lists/${listId}/collaborators`);

export const shareList = (listId, email, role) =>
  apiRequest(`/lists/${listId}/share`, { method: "POST", body: { email, role } });

export const removeCollaborator = (listId, userId) =>
  apiRequest(`/lists/${listId}/share/${userId}`, { method: "DELETE" });

export const assignItem = (listId, itemId, userId) =>
  apiRequest(`/lists/${listId}/items/${itemId}/assign`, {
    method: "PUT",
    body: { userId: userId || null },
  });

export const getReminders = () => apiRequest("/reminders");

export const createReminder = (listId, message, remindAt) =>
  apiRequest("/reminders", {
    method: "POST",
    body: { listId, message, remindAt: new Date(remindAt).toISOString() },
  });

export const deleteReminder = (id) =>
  apiRequest(`/reminders/${id}`, { method: "DELETE" });
