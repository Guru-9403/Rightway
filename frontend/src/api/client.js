import { API_BASE_URL } from "../config/env";

const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Thin fetch wrapper: returns the raw Response so callers keep control over status handling.
export function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, authHeaders());
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export const api = {
  firebaseConfig: () => apiFetch("/auth/firebase-config"),
  login: (email, password) => apiFetch("/auth/login", { method: "POST", body: { email, password } }),
  signup: (name, email, password) => apiFetch("/auth/signup", { method: "POST", body: { name, email, password } }),
  register: (payload) => apiFetch("/register", { method: "POST", body: payload }),
  verifyOtp: (email, otp) => apiFetch("/verify-otp", { method: "POST", body: { email, otp } }),
  resendOtp: (email) => apiFetch("/resend-otp", { method: "POST", body: { email } }),
  logout: () => apiFetch("/auth/logout", { method: "POST", auth: true }),
  refresh: () => apiFetch("/auth/refresh", { method: "POST" }),
  forgotPassword: (email) => apiFetch("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (payload, password) => {
    const body = typeof payload === "object" ? payload : { token: payload, password };
    return apiFetch("/auth/reset-password", { method: "POST", body });
  },
  changePassword: (currentPassword, newPassword) =>
    apiFetch("/auth/change-password", { method: "POST", auth: true, body: { currentPassword, newPassword } }),
  verifyEmail: (token) => apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  google: (idToken) => apiFetch("/auth/google", { method: "POST", body: { idToken } }),
  me: () => apiFetch("/auth/me", { auth: true }),

  progress: () => apiFetch("/progress", { auth: true }),
  saveLesson: (lessonId, payload) => apiFetch("/progress/lesson", { method: "PATCH", auth: true, body: { lessonId, ...payload } }),
  heartbeat: () => apiFetch("/progress/heartbeat", { method: "PATCH", auth: true }),
  issueCertificate: () => apiFetch("/certificate/issue", { method: "POST", auth: true }),

  submitEnquiry: (payload) => apiFetch("/admin/enquiries/public", { method: "POST", body: payload }),
  adminStudents: () => apiFetch("/admin/students", { auth: true }),
  adminSendCertificate: (studentId, course) =>
    apiFetch("/admin/certificate/send", { method: "POST", auth: true, body: { studentId, course } }),
  adminExportStudents: () => apiFetch("/admin/students/export", { auth: true }),

  adminDashboard: () => apiFetch("/admin/dashboard", { auth: true }),
  adminUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/admin/users${q ? `?${q}` : ""}`, { auth: true });
  },
  adminUpdateUser: (id, payload) =>
    apiFetch(`/admin/users/${id}`, { method: "PUT", auth: true, body: payload }),
  adminDeleteUser: (id, options = {}) =>
    apiFetch(`/admin/users/${id}${options?.permanent ? "?permanent=true" : ""}`, { method: "DELETE", auth: true }),
  adminRestoreUser: (id) =>
    apiFetch(`/admin/users/${id}/restore`, { method: "POST", auth: true }),
  adminResetUserPassword: (id) =>
    apiFetch(`/admin/users/${id}/reset-password`, { method: "POST", auth: true }),
  adminToggleBlockUser: (id) =>
    apiFetch(`/admin/users/${id}/toggle-block`, { method: "POST", auth: true }),

  adminAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/admin/audit-logs${q ? `?${q}` : ""}`, { auth: true });
  },
  adminExportAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/admin/audit-logs/export${q ? `?${q}` : ""}`, { auth: true });
  },
  auditCourseOpened: (courseId) =>
    apiFetch("/audit/course-opened", { method: "POST", auth: true, body: { courseId } }),
};
