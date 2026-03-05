import api from "./api";

export const calendarService = {
  getLeaveSummary: async (params: { start: string; end: string; department?: string }) => {
    const response = await api.get("/calendar/leaves", { params });
    return response.data;
  },

  getLeavesByDate: async (date: string, params?: { page?: number; limit?: number; department?: string }) => {
    const response = await api.get(`/calendar/leaves/${date}`, { params });
    return response.data;
  },
};

