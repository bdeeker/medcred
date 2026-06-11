import axios from "axios";
const api = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("medcred_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
export default api;
export const login = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password });
export const register = (
  organizationName: string,
  email: string,
  password: string,
) => api.post("/api/auth/register", { organizationName, email, password });
export const getStaff = () => api.get("/api/staff");
export const getStaffById = (id: string) => api.get(`/api/staff/${id}`);
export const createStaff = (data: any) => api.post("/api/staff", data);
export const updateStaff = (id: string, data: any) =>
  api.put(`/api/staff/${id}`, data);
export const deleteStaff = (id: string) => api.delete(`/api/staff/${id}`);
export const getCredentials = (status?: string) =>
  api.get("/api/credential", { params: { status } });
export const getCredentialById = (id: string) =>
  api.get(`/api/credential/${id}`);
export const createCredential = (data: any) =>
  api.post("/api/credential", data);
export const updateCredential = (id: string, data: any) =>
  api.put(`/api/credential/${id}`, data);
export const getCredentialTypes = () => api.get("/api/credential/types");
export const getDashboard = () => api.get("/api/credential/dashboard");
export const getComplianceReport = () => api.get("/api/report/compliance");
export const getExpiringReport = (days?: number) =>
  api.get("/api/report/expiring", { params: { days } });
export const getDepartmentReport = () => api.get("/api/report/department");
export const getAuditLog = (page?: number) =>
  api.get("/api/report/audit", { params: { page } });
export const exportComplianceCsv = () =>
  window.open("/api/report/compliance/export", "_blank");
export const exportExpiringCsv = (days = 30) =>
  window.open(`/api/report/expiring/export?days=${days}`, "_blank");
export const exportDepartmentCsv = () =>
  window.open("/api/report/department/export", "_blank");
