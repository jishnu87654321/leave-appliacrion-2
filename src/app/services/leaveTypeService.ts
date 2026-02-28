import api from './api';

export const leaveTypeService = {
  // Get all leave types
  getAllLeaveTypes: async (isActive?: boolean) => {
    const response = await api.get('/leave-types', {
      params: isActive !== undefined ? { isActive } : {},
    });
    return response.data;
  },

  // Get leave type by ID
  getLeaveTypeById: async (id: string) => {
    const response = await api.get(`/leave-types/${id}`);
    return response.data;
  },

  // Create leave type (HR)
  createLeaveType: async (data: any) => {
    const response = await api.post('/leave-types', data);
    return response.data;
  },

  // Update leave type (HR)
  updateLeaveType: async (id: string, data: any) => {
    const response = await api.put(`/leave-types/${id}`, data);
    return response.data;
  },

  // Delete leave type (HR)
  deleteLeaveType: async (id: string) => {
    const response = await api.delete(`/leave-types/${id}`);
    return response.data;
  },
};
