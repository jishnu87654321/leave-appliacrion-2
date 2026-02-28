import api from './api';

export const auditService = {
  // Get audit trail (HR only)
  getAuditTrail: async (params?: any) => {
    const response = await api.get('/reports/audit-trail', { params });
    return response.data;
  },
};
