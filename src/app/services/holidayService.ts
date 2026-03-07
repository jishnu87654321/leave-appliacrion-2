import api from "./api";

export const holidayService = {
  list: async (params?: { start?: string; end?: string }) => {
    const response = await api.get("/holidays", { params });
    return response.data;
  },

  upsert: async (payload: { date: string; title: string }) => {
    const response = await api.post("/holidays", payload);
    return response.data;
  },

  remove: async (date: string) => {
    const response = await api.delete(`/holidays/${date}`);
    return response.data;
  },
};

