import api from './api';

export const userService = {
  // Create new user (HR only)
  createUser: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  // Get all users (HR)
  getAllUsers: async (params?: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Activate user
  activateUser: async (id: string) => {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (id: string) => {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data;
  },

  // Assign manager
  assignManager: async (userId: string, managerId: string) => {
    const response = await api.patch(`/users/${userId}/assign-manager`, {
      managerId,
    });
    return response.data;
  },

  // Update leave balance
  updateLeaveBalance: async (userId: string, leaveTypeId: string, balance: number, reason: string) => {
    const response = await api.patch(`/users/${userId}/leave-balance`, {
      leaveTypeId,
      balance,
      reason,
    });
    return response.data;
  },

  // Get user's leave balances
  getUserBalances: async (userId: string) => {
    const response = await api.get(`/users/${userId}/balances`);
    return response.data;
  },
};
