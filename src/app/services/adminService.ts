import api from "./api";

export const adminService = {
  getCalendar: async () => {
    const response = await api.get("/admin/calendar");
    return response.data;
  },

  updateCalendar: async (data: any) => {
    const response = await api.post("/admin/calendar", data);
    return response.data;
  },

  runMonthlyAccrual: async (runDate?: string) => {
    const response = await api.post("/admin/run-monthly-accrual", runDate ? { runDate } : {});
    return response.data;
  },

  runMonthlyCredit: async (runDate?: string) => {
    const response = await api.post("/admin/run-monthly-credit", runDate ? { runDate } : {});
    return response.data;
  },

  getDepartmentChangeRequests: async () => {
    const response = await api.get("/admin/department-change-requests");
    return response.data;
  },

  createDepartmentChangeRequest: async (payload: any) => {
    const response = await api.post("/admin/department-change-requests", payload);
    return response.data;
  },

  confirmDepartmentChange: async (id: string) => {
    const response = await api.patch(`/admin/department-change-requests/${id}/confirm`);
    return response.data;
  },

  rejectDepartmentChange: async (id: string) => {
    const response = await api.patch(`/admin/department-change-requests/${id}/reject`);
    return response.data;
  },
};
