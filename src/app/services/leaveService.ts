import api from './api';

export interface LeaveApplication {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  halfDay: boolean;
  halfDaySession?: 'MORNING' | 'AFTERNOON';
  reason: string;
  isEmergency?: boolean;
}

export const leaveService = {
  // Apply for leave
  applyLeave: async (data: LeaveApplication) => {
    const response = await api.post('/leaves/apply', data);
    return response.data;
  },

  // Get my leaves
  getMyLeaves: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/leaves/my-leaves', { params });
    return response.data;
  },

  // Get leave by ID
  getLeaveById: async (id: string) => {
    const response = await api.get(`/leaves/${id}`);
    return response.data;
  },

  // Cancel leave
  cancelLeave: async (id: string, reason?: string) => {
    const response = await api.put(`/leaves/${id}/cancel`, { reason });
    return response.data;
  },

  // Get team leaves (Manager)
  getTeamLeaves: async (params?: { status?: string }) => {
    const response = await api.get('/leaves/team/requests', { params });
    return response.data;
  },

  // Approve leave (Manager/HR) - with override support
  approveLeave: async (id: string, comment?: string, hrOverride?: boolean) => {
    const response = await api.put(`/leaves/${id}/approve`, { comment, hrOverride });
    return response.data;
  },

  // Reject leave (Manager/HR)
  rejectLeave: async (id: string, comment: string) => {
    const response = await api.put(`/leaves/${id}/reject`, { comment });
    return response.data;
  },

  // HR Override - Dedicated endpoint for HR Admin override
  hrOverrideLeave: async (id: string, status: 'APPROVED' | 'REJECTED', comment: string) => {
    const response = await api.put(`/leaves/${id}/override`, { status, comment });
    return response.data;
  },

  // Get all leaves (HR)
  getAllLeaves: async (params?: any) => {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  // Get team calendar
  getTeamCalendar: async (month: number, year: number) => {
    const response = await api.get('/leaves/team-calendar', {
      params: { month, year },
    });
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/leaves/stats/dashboard');
    return response.data;
  },
};
