import api from './api';

export const reportService = {
  // Employee report
  getEmployeeReport: async (params?: any) => {
    const response = await api.get('/reports/employee', { params });
    return response.data;
  },

  // Department report
  getDepartmentReport: async (params?: any) => {
    const response = await api.get('/reports/department', { params });
    return response.data;
  },

  // Monthly report
  getMonthlyReport: async (year: number) => {
    const response = await api.get('/reports/monthly', { params: { year } });
    return response.data;
  },

  // Export CSV
  exportCSV: async (params?: any) => {
    const response = await api.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Get audit trail (HR)
  getAuditTrail: async (params?: any) => {
    const response = await api.get('/reports/audit-trail', { params });
    return response.data;
  },
};
