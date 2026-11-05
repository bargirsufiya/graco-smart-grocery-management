// Module 4 notifications API (/api/notifications)

import { apiRequest } from "./apiClient";

const notificationApi = {
  async getAll() {
    const notifications = await apiRequest("/notifications");
    return {
      notifications: notifications.map((n) => ({ ...n, id: n._id })),
    };
  },

  markRead(id) {
    return apiRequest(`/notifications/${id}/read`, { method: "PUT" });
  },

  markAllRead() {
    return apiRequest("/notifications/read-all", { method: "PUT" });
  },

  checkPending() {
    return apiRequest("/notifications/check-pending", { method: "POST" });
  },
};

export default notificationApi;
