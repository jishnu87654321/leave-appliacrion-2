import api from './api';

export const notificationService = {
  // Get my notifications
  getMyNotifications: async (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
