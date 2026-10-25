import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { API_BASE_URL } from "../config/env";
import { useApp } from "../context/AppContext";
import { PATHS } from "../utils/paths";

// Helpers
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const timeAgo = (d) => {
  if (!d) return "—";
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Action badge styling
function ActionBadge({ action }) {
  const map = {
    login_success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    otp_verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
    email_verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
    user_unblocked: "bg-emerald-50 text-emerald-800 border-emerald-200",

    login_fail: "bg-red-50 text-red-800 border-red-200",
    user_deleted: "bg-red-50 text-red-800 border-red-200",
    user_blocked: "bg-red-50 text-red-800 border-red-200",

    user_updated: "bg-blue-50 text-blue-800 border-blue-200",
    password_reset_sent: "bg-amber-50 text-amber-800 border-amber-200",
    password_reset_request: "bg-amber-50 text-amber-800 border-amber-200",
    password_reset_success: "bg-blue-50 text-blue-800 border-blue-200",

    register: "bg-purple-50 text-purple-800 border-purple-200",
    logout: "bg-gray-100 text-gray-700 border-gray-200",
    course_opened: "bg-indigo-50 text-indigo-800 border-indigo-200",
    lesson_completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    video_watched: "bg-sky-50 text-sky-800 border-sky-200",
  };

  const labels = {
    login_success: "Login Success",
    login_fail: "Login Failed",
    logout: "Logout",
    register: "Registered",
    otp_verified: "OTP Verified",
    email_verified: "Email Verified",
    otp_resend: "OTP Resent",
    password_reset_sent: "Reset Sent (Admin)",
    password_reset_request: "Reset Requested",
    password_reset_success: "Password Reset",
    user_updated: "User Updated",
    user_deleted: "User Deleted",
    user_blocked: "User Blocked",
    user_unblocked: "User Unblocked",
    course_opened: "Course Opened",
    lesson_completed: "Lesson Completed",
    video_watched: "Video Watched",
  };

  const cls = map[action] || "bg-gray-100 text-gray-700 border-gray-200";
  const text = labels[action] || action.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {text}
    </span>
  );
}

export default function AdminPage() {
  const { user, showToast } = useApp();
  const isAdmin = !!user && user.role === "admin";

  // Active Tab
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "users" | "audit" | "students" | "enquiries"

  // Dashboard Data
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  // Users Tab State
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals for User management
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "student", emailVerified: false, isBlocked: false });
  const [editBusy, setEditBusy] = useState(false);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleteMode, setDeleteMode] = useState("soft"); // "soft" | "permanent"
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [resetPwUser, setResetPwUser] = useState(null);
  const [resetPwBusy, setResetPwBusy] = useState(false);

  // Change Admin Password Modal
  const [changePwModalOpen, setChangePwModalOpen] = useState(false);
  const [changePwForm, setChangePwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changePwShow, setChangePwShow] = useState(false);
  const [changePwBusy, setChangePwBusy] = useState(false);
  const [changePwError, setChangePwError] = useState("");

  // Live Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditUserFilter, setAuditUserFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditDateFilter, setAuditDateFilter] = useState("all");
  const [sseConnected, setSseConnected] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Legacy Students & Enquiries Data
  const [studentsData, setStudentsData] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [mailedCertificates, setMailedCertificates] = useState(() => new Set());
  const [backendError, setBackendError] = useState("");

  /* =========================================================
     LOAD DASHBOARD METRICS
     ========================================================= */
  const loadDashboard = useCallback(async () => {
    if (!isAdmin) return;
    setDashLoading(true);
    try {
      const res = await api.adminDashboard();
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        setDashboard(data);
        setBackendError("");
      } else if (!contentType.includes("application/json")) {
        setBackendError(
          "Backend server must be restarted to load the new admin routes. The running server returned index.html instead of JSON."
        );
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setDashLoading(false);
    }
  }, [isAdmin]);

  /* =========================================================
     LOAD USERS
     ========================================================= */
  const loadUsers = useCallback(
    async (page = 1) => {
      if (!isAdmin) return;
      setUsersLoading(true);
      try {
        const res = await api.adminUsers({
          page,
          limit: 10,
          search: searchUser,
          role: roleFilter,
          verified: verifiedFilter,
          status: statusFilter,
          includeDeleted: statusFilter === "deleted" ? "true" : "false",
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          setUsers(data.users || []);
          setUsersPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
          setBackendError("");
        } else if (!contentType.includes("application/json")) {
          setBackendError(
            "Backend server needs a restart. The running backend returned HTML instead of JSON for /api/admin/users."
          );
        } else if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setBackendError(errData.message || `API error (${res.status})`);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setUsersLoading(false);
      }
    },
    [isAdmin, searchUser, roleFilter, verifiedFilter, statusFilter]
  );

  /* =========================================================
     LOAD AUDIT LOGS (REST)
     ========================================================= */
  const loadAuditLogs = useCallback(
    async (page = 1) => {
      if (!isAdmin) return;
      setAuditLoading(true);
      try {
        const res = await api.adminAuditLogs({
          page,
          limit: 20,
          user: auditUserFilter,
          action: auditActionFilter,
          dateRange: auditDateFilter,
        });
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data.logs || []);
          setAuditPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setAuditLoading(false);
      }
    },
    [isAdmin, auditUserFilter, auditActionFilter, auditDateFilter]
  );

  /* =========================================================
     LOAD LEGACY STUDENTS & ENQUIRIES
     ========================================================= */
  const loadStudentsData = useCallback(async () => {
    if (!isAdmin) return;
    setStudentsLoading(true);
    try {
      const res = await api.adminStudents();
      if (res.ok) {
        const data = await res.json();
        setStudentsData(data);
      }
    } catch (err) {
      console.error("Failed to load students data:", err);
    } finally {
      setStudentsLoading(false);
    }
  }, [isAdmin]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      loadDashboard();
      loadUsers(1);
      loadAuditLogs(1);
      loadStudentsData();
    }
  }, [isAdmin, loadDashboard, loadUsers, loadAuditLogs, loadStudentsData]);

  // Reload users when filters change
  useEffect(() => {
    if (isAdmin && activeTab === "users") {
      loadUsers(1);
    }
  }, [searchUser, roleFilter, verifiedFilter, statusFilter]);

  // Reload audit logs when filters change
  useEffect(() => {
    if (isAdmin && activeTab === "audit") {
      loadAuditLogs(1);
    }
  }, [auditUserFilter, auditActionFilter, auditDateFilter]);

  /* =========================================================
     LIVE AUDIT LOG SSE STREAM
     ========================================================= */
  useEffect(() => {
    if (!isAdmin) return;

    let es;
    try {
      es = new EventSource(`${API_BASE_URL}/admin/audit-logs/stream`, { withCredentials: true });

      es.onopen = () => {
        setSseConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const newEvent = JSON.parse(event.data);
          if (newEvent && newEvent.action) {
            setAuditLogs((prev) => [newEvent, ...prev.slice(0, 99)]);
            // Also refresh dashboard active counter
            if (activeTab === "dashboard") {
              loadDashboard();
            }
          }
        } catch {
          /* ignore non-json messages */
        }
      };

      es.onerror = () => {
        setSseConnected(false);
      };
    } catch (e) {
      console.warn("SSE connection error:", e);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [isAdmin, activeTab, loadDashboard]);

  /* =========================================================
     USER ACTIONS (EDIT, DELETE, RESET PW, TOGGLE BLOCK)
     ========================================================= */

  const openEditModal = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      emailVerified: Boolean(u.verified),
      isBlocked: Boolean(u.isBlocked),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditBusy(true);
    try {
      const res = await api.adminUpdateUser(editUser._id, editForm);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user.");
      if (showToast) showToast("User updated successfully!");
      setEditUser(null);
      loadUsers(usersPagination.page);
      loadDashboard();
    } catch (err) {
      alert(err.message || "Failed to update user.");
    } finally {
      setEditBusy(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setDeleteBusy(true);
    try {
      const isPermanent = deleteMode === "permanent" || deleteConfirmUser.isDeleted;
      const res = await api.adminDeleteUser(deleteConfirmUser._id, { permanent: isPermanent });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user.");
      if (showToast) {
        showToast(
          isPermanent
            ? `User ${deleteConfirmUser.email} permanently purged.`
            : `User ${deleteConfirmUser.email} deactivated.`
        );
      }
      setDeleteConfirmUser(null);
      if (editUser && editUser._id === deleteConfirmUser._id) {
        setEditUser(null);
      }
      loadUsers(usersPagination.page);
      loadDashboard();
      loadStudentsData();
    } catch (err) {
      alert(err.message || "Failed to delete user.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleRestoreUser = async (u) => {
    if (!window.confirm(`Restore account access for ${u.email}?`)) return;
    try {
      const res = await api.adminRestoreUser(u._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to restore user.");
      if (showToast) showToast(`User ${u.email} restored successfully!`);
      loadUsers(usersPagination.page);
      loadDashboard();
      loadStudentsData();
    } catch (err) {
      alert(err.message || "Failed to restore user.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwUser) return;
    setResetPwBusy(true);
    try {
      const res = await api.adminResetUserPassword(resetPwUser._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset email.");
      if (showToast) showToast(`Password reset link sent to ${resetPwUser.email}`);
      setResetPwUser(null);
    } catch (err) {
      alert(err.message || "Failed to send password reset email.");
    } finally {
      setResetPwBusy(false);
    }
  };

  const handleChangeAdminPassword = async (e) => {
    e.preventDefault();
    setChangePwError("");
    if (!changePwForm.currentPassword) {
      setChangePwError("Please enter your current password.");
      return;
    }
    if (changePwForm.newPassword.length < 8) {
      setChangePwError("New password must be at least 8 characters long.");
      return;
    }
    if (changePwForm.newPassword !== changePwForm.confirmPassword) {
      setChangePwError("New passwords do not match.");
      return;
    }
    setChangePwBusy(true);
    try {
      const res = await api.changePassword(changePwForm.currentPassword, changePwForm.newPassword);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password.");
      if (showToast) showToast("Password updated successfully! Your account is now secure.");
      setChangePwModalOpen(false);
      setChangePwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setChangePwError(err.message || "Failed to update password.");
    } finally {
      setChangePwBusy(false);
    }
  };

  const handleToggleBlock = async (u) => {
    const actionWord = u.isBlocked ? "unblock" : "block";
    if (!window.confirm(`Are you sure you want to ${actionWord} ${u.email}?`)) return;
    try {
      const res = await api.adminToggleBlockUser(u._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${actionWord} user.`);
      if (showToast) showToast(`User is now ${data.isBlocked ? "blocked" : "active"}`);
      loadUsers(usersPagination.page);
      loadDashboard();
    } catch (err) {
      alert(err.message || "Failed to update user status.");
    }
  };

  // CSV Audit log export
  const handleExportAuditCsv = async () => {
    try {
      const res = await api.adminExportAuditLogs({
        action: auditActionFilter,
        dateRange: auditDateFilter,
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rightway-audit-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export audit logs. Please try again.");
    }
  };

  // Student Certificate action
  const handleMailCertificate = async (student) => {
    try {
      const res = await api.adminSendCertificate(student.id, student.course);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send certificate");
      setMailedCertificates((prev) => new Set(prev).add(student.id));
      if (showToast) showToast(`Certificate queued for ${student.email}`);
    } catch (err) {
      alert(err.message || "Failed to send certificate");
    }
  };

  // Excel Students export
  const handleExportStudentsExcel = async () => {
    try {
      const res = await api.adminExportStudents();
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rightway-students-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export students. Please try again.");
    }
  };

  /* =========================================================
     ACCESS RESTRICTION CHECK (STUDENTS GET 403)
     ========================================================= */

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-sm">
          🔒
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Authentication Required</h1>
        <p className="text-gray-600 text-sm mb-6">Please log in with an administrator account to access this page.</p>
        <Link
          to={PATHS.login}
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-sm"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-extrabold shadow-sm">
          ⚠️
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">403 - Forbidden</h1>
        <p className="text-gray-600 text-sm mb-6">
          Administrator privileges are required to access this portal. Your current account ({user.email}) has role{" "}
          <span className="font-semibold text-gray-800 capitalize">"{user.role}"</span>.
        </p>
        <Link
          to={PATHS.home}
          className="inline-block bg-black hover:bg-gray-800 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-sm"
        >
          Return to Learning Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Rightway <span className="text-red-600">Skill Builder</span> Admin
            </h1>
            <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
              Admin Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Logged in as <strong className="text-gray-800">{user.name}</strong> ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live stream status indicator */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              sseConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${sseConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            <span>{sseConnected ? "Live SSE Stream Active" : "Connecting Live Feed..."}</span>
          </div>

          <button
            onClick={() => {
              setChangePwError("");
              setChangePwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
              setChangePwModalOpen(true);
            }}
            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Change Admin Password"
          >
            <span>🔑</span> Change Password
          </button>

          <button
            onClick={() => {
              loadDashboard();
              loadUsers(usersPagination.page);
              loadAuditLogs(auditPagination.page);
              if (showToast) showToast("Data refreshed.");
            }}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 mb-8 pb-1 scrollbar-none">
        {[
          { id: "dashboard", label: "Dashboard Overview", icon: "📊" },
          { id: "users", label: `User Management (${usersPagination.total || "..."})`, icon: "👥" },
          { id: "audit", label: "Live Audit Log", icon: "📜", badge: sseConnected ? "Live" : null },
          { id: "students", label: "Course Progress & Certificates", icon: "🎓" },
          { id: "enquiries", label: "Enquiries", icon: "✉️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                  activeTab === tab.id ? "bg-white text-red-600" : "bg-emerald-100 text-emerald-800 animate-pulse"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Backend restart / warning banner if server returned HTML */}
      {backendError && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-900 text-sm">Backend Restart Required</p>
              <p className="text-xs text-amber-800">{backendError}</p>
              <p className="text-xs text-amber-700 mt-1">
                Stop your backend terminal (<kbd className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">Ctrl+C</kbd>) and restart with{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[11px]">npm start</code> (or{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[11px]">npm run dev</code> for automatic file watching).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              loadDashboard();
              loadUsers(1);
              loadAuditLogs(1);
            }}
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shrink-0 shadow-sm"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* =========================================================
          TAB 1: DASHBOARD OVERVIEW
          ========================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {dashLoading && !dashboard ? (
            <div className="p-12 text-center text-gray-500 font-semibold">Loading dashboard metrics...</div>
          ) : (
            <>
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Total Users</div>
                  <div className="text-3xl font-extrabold text-gray-900">{dashboard?.totalUsers ?? "—"}</div>
                  <div className="text-[11px] text-gray-400 mt-1">Non-deleted accounts</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">New Today</div>
                  <div className="text-3xl font-extrabold text-emerald-600">{dashboard?.newToday ?? "—"}</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {dashboard?.newThisWeek != null ? `${dashboard.newThisWeek} this week` : "Registered today"}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Verified Users</div>
                  <div className="text-3xl font-extrabold text-blue-600">{dashboard?.verifiedUsers ?? "—"}</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {dashboard?.unverifiedUsers != null ? `${dashboard.unverifiedUsers} unverified` : ""}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Active Users Now</div>
                  <div className="text-3xl font-extrabold text-purple-600">{dashboard?.activeUsersNow ?? "—"}</div>
                  <div className="text-[11px] text-gray-400 mt-1">Active in last 15 mins</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Failed Logins (Today)</div>
                  <div
                    className={`text-3xl font-extrabold ${
                      (dashboard?.failedLoginsToday || 0) > 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {dashboard?.failedLoginsToday ?? "0"}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">Security lockout tracker</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Suspended / Deleted</div>
                  <div className="text-3xl font-extrabold text-amber-600">{dashboard?.blockedUsers ?? "0"}</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {dashboard?.deletedUsers != null ? `${dashboard.deletedUsers} deleted` : "Blocked accounts"}
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Live Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Roles & Quick Jump */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>👥</span> User Account Distribution
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Students</span>
                        <span className="font-bold text-gray-900">{dashboard?.roleBreakdown?.students ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Administrators</span>
                        <span className="font-bold text-red-600">{dashboard?.roleBreakdown?.admins ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Verification Rate</span>
                        <span className="font-bold text-emerald-600">
                          {dashboard?.totalUsers
                            ? `${Math.round(((dashboard.verifiedUsers || 0) / dashboard.totalUsers) * 100)}%`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => setActiveTab("users")}
                      className="flex-1 bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition text-center cursor-pointer"
                    >
                      Manage All Users →
                    </button>
                    <button
                      onClick={() => setActiveTab("audit")}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold py-2.5 rounded-xl transition text-center cursor-pointer"
                    >
                      View Audit Log →
                    </button>
                  </div>
                </div>

                {/* Live Activity Preview */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>⚡</span> Recent Live Events
                    </h2>
                    <span className="text-xs text-gray-500 font-medium">Real-time update</span>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">No activity recorded yet.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                      {auditLogs.slice(0, 5).map((log) => (
                        <div key={log._id} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <ActionBadge action={log.action} />
                            <span className="font-semibold text-gray-800">{log.userEmail || "System/Visitor"}</span>
                            {log.adminEmail && (
                              <span className="text-gray-400 text-[11px]">(by {log.adminEmail})</span>
                            )}
                          </div>
                          <span className="text-gray-400 font-medium">{timeAgo(log.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 2: USERS TABLE & ACTIONS
          ========================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Search name, email, or student ID..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>

              {/* Verified filter */}
              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked</option>
                <option value="deleted">Deleted</option>
              </select>

              <button
                onClick={() => {
                  setSearchUser("");
                  setRoleFilter("all");
                  setVerifiedFilter("all");
                  setStatusFilter("all");
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline px-2 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">User / ID</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Verified</th>
                    <th className="px-5 py-3.5">Provider</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Joined</th>
                    <th className="px-5 py-3.5">Last Login</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                        No users matching your filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u._id === user._id || u.email === user.email;
                      return (
                        <tr key={u._id} className="hover:bg-gray-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-gray-900">{u.name}</div>
                            <div className="text-[11px] font-mono text-gray-400">{u.studentId}</div>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-gray-700">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                u.role === "admin"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {u.verified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <span>✅</span> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                                <span>⏳</span> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 capitalize text-gray-600 font-medium">
                            {u.provider === "google" ? "Google" : "Email"}
                          </td>
                          <td className="px-5 py-3.5">
                            {u.isDeleted ? (
                              <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded font-bold">
                                Deleted
                              </span>
                            ) : u.isBlocked ? (
                              <span className="bg-amber-50 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">
                                Blocked
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded font-bold">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                          <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                            {timeAgo(u.lastLoginAt)}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit User Button */}
                              <button
                                onClick={() => openEditModal(u)}
                                className="px-2.5 py-1 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                                title="Edit Name, Role, Verified, Block status"
                              >
                                Edit
                              </button>

                              {/* Reset Password */}
                              <button
                                disabled={u.isDeleted}
                                onClick={() => setResetPwUser(u)}
                                className="px-2.5 py-1 text-xs font-semibold border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-800 transition cursor-pointer disabled:opacity-40"
                                title="Send password reset email"
                              >
                                Reset PW
                              </button>

                              {/* Toggle Block */}
                              <button
                                disabled={isSelf || u.isDeleted}
                                onClick={() => handleToggleBlock(u)}
                                className={`px-2.5 py-1 text-xs font-semibold border rounded-lg transition cursor-pointer disabled:opacity-40 ${
                                  u.isBlocked
                                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                                title={isSelf ? "You cannot block yourself" : u.isBlocked ? "Unblock account" : "Block account"}
                              >
                                {u.isBlocked ? "Unblock" : "Block"}
                              </button>

                              {/* Restore / Delete User */}
                              {u.isDeleted ? (
                                <>
                                  <button
                                    onClick={() => handleRestoreUser(u)}
                                    className="px-2.5 py-1 text-xs font-semibold border border-emerald-300 rounded-lg hover:bg-emerald-50 text-emerald-700 transition cursor-pointer"
                                    title="Restore user account"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    disabled={isSelf}
                                    onClick={() => {
                                      setDeleteMode("permanent");
                                      setDeleteConfirmUser(u);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold border border-red-300 rounded-lg hover:bg-red-600 hover:text-white text-red-600 transition cursor-pointer disabled:opacity-40"
                                    title="Purge user permanently from database"
                                  >
                                    Purge
                                  </button>
                                </>
                              ) : (
                                <button
                                  disabled={isSelf}
                                  onClick={() => {
                                    setDeleteMode("soft");
                                    setDeleteConfirmUser(u);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition cursor-pointer disabled:opacity-40 flex items-center gap-1"
                                  title={isSelf ? "You cannot delete yourself" : "Delete account (soft or permanent)"}
                                >
                                  <span>🗑️</span> Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div>
                Showing {(usersPagination.page - 1) * usersPagination.limit + 1} to{" "}
                {Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)} of{" "}
                <strong>{usersPagination.total}</strong> users
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={usersPagination.page <= 1}
                  onClick={() => loadUsers(usersPagination.page - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold bg-white hover:bg-gray-100 transition disabled:opacity-40 cursor-pointer"
                >
                  ← Previous
                </button>
                <span className="font-semibold text-gray-700">
                  Page {usersPagination.page} of {usersPagination.totalPages}
                </span>
                <button
                  disabled={usersPagination.page >= usersPagination.totalPages}
                  onClick={() => loadUsers(usersPagination.page + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold bg-white hover:bg-gray-100 transition disabled:opacity-40 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: LIVE AUDIT LOG
          ========================================================= */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* Audit Controls & Filters */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
              <input
                type="text"
                placeholder="Filter by user or admin email..."
                value={auditUserFilter}
                onChange={(e) => setAuditUserFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-medium w-full sm:w-64 outline-none focus:border-red-600"
              />

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="login_success">Login Success</option>
                <option value="login_fail">Login Failed</option>
                <option value="register">Registration</option>
                <option value="otp_verified">OTP Verified</option>
                <option value="logout">Logout</option>
                <option value="user_updated">User Updated (Admin)</option>
                <option value="user_deleted">User Deleted (Admin)</option>
                <option value="user_blocked">User Blocked (Admin)</option>
                <option value="password_reset_sent">Password Reset Sent</option>
                <option value="lesson_completed">Lesson Completed</option>
                <option value="course_opened">Course Opened</option>
              </select>

              <select
                value={auditDateFilter}
                onChange={(e) => setAuditDateFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportAuditCsv}
                className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>📥</span> Export to CSV
              </button>
            </div>
          </div>

          {/* Append-Only Notice */}
          <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">🔒 Immutability Notice:</span>
              <span>
                Audit logs are strictly append-only. Modification and deletion are blocked for all users and
                administrators by system policy.
              </span>
            </div>
            <span className="text-[11px] font-mono text-gray-400">Total: {auditPagination.total} entries</span>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Action</th>
                    <th className="px-5 py-3.5">Target User</th>
                    <th className="px-5 py-3.5">Performed By</th>
                    <th className="px-5 py-3.5">IP Address</th>
                    <th className="px-5 py-3.5">Device / Client</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        No audit logs recorded for this criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const isExpanded = expandedLogId === log._id;
                      return (
                        <tr key={log._id} className="hover:bg-gray-50/70 transition">
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                            {fmtDateTime(log.timestamp)}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <ActionBadge action={log.action} />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-gray-900">{log.userEmail || "—"}</div>
                            {log.userName && <div className="text-[11px] text-gray-400">{log.userName}</div>}
                          </td>
                          <td className="px-5 py-3.5">
                            {log.adminEmail ? (
                              <span className="font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                                {log.adminEmail}
                              </span>
                            ) : (
                              <span className="text-gray-400">Self / System</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-gray-500">{log.ip || "—"}</td>
                          <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate" title={log.userAgent}>
                            {log.userAgent ? log.userAgent.split(" ")[0] : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            {log.details && Object.keys(log.details).length > 0 ? (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                                className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                              >
                                {isExpanded ? "Hide Details" : "View Details"}
                              </button>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Expandable JSON details drawer */}
            {expandedLogId && (
              <div className="p-4 bg-gray-900 text-gray-100 text-xs font-mono border-t border-gray-800">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                  <span className="font-bold text-emerald-400">Audit Event Metadata:</span>
                  <button onClick={() => setExpandedLogId(null)} className="text-gray-400 hover:text-white">
                    ✕ Close
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(
                    auditLogs.find((l) => l._id === expandedLogId)?.details || {},
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {/* Audit Pagination */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div>
                Showing {(auditPagination.page - 1) * auditPagination.limit + 1} to{" "}
                {Math.min(auditPagination.page * auditPagination.limit, auditPagination.total)} of{" "}
                <strong>{auditPagination.total}</strong> records
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={auditPagination.page <= 1}
                  onClick={() => loadAuditLogs(auditPagination.page - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold bg-white hover:bg-gray-100 transition disabled:opacity-40 cursor-pointer"
                >
                  ← Previous
                </button>
                <span className="font-semibold text-gray-700">
                  Page {auditPagination.page} of {auditPagination.totalPages}
                </span>
                <button
                  disabled={auditPagination.page >= auditPagination.totalPages}
                  onClick={() => loadAuditLogs(auditPagination.page + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold bg-white hover:bg-gray-100 transition disabled:opacity-40 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: STUDENTS & COURSE PROGRESS (PRESERVED FEATURE)
          ========================================================= */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Student Course Progress & Certificates</h2>
              <p className="text-xs text-gray-500">Monitor completion rates and issue verified certificates</p>
            </div>
            <button
              onClick={handleExportStudentsExcel}
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>📊</span> Export Students Excel
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Enrolled Track</th>
                    <th className="px-5 py-3.5">Lessons Completed</th>
                    <th className="px-5 py-3.5">Completion Rate</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">XP Earned</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        Loading student records...
                      </td>
                    </tr>
                  ) : !studentsData?.students || studentsData.students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        No enrolled students found.
                      </td>
                    </tr>
                  ) : (
                    studentsData.students.map((s) => {
                      const isCompleted = s.progress >= 100 || s.status === "Completed";
                      const mailed = mailedCertificates.has(s.id) || s.certificateIssuedAt;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-gray-900">{s.name}</div>
                            <div className="text-[11px] font-mono text-gray-400">{s.studentId} • {s.email}</div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-gray-800">{s.course}</td>
                          <td className="px-5 py-3.5 font-mono text-gray-600">
                            {s.lessonsDone} / {s.totalLessons}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-red-600 h-2 rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                            <span className="text-[11px] text-gray-500 font-bold mt-1 inline-block">
                              {s.progress}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                s.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : s.status === "Pursuing"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-gray-900">+{s.xp} XP</td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {mailed ? (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                  ✅ Sent
                                </span>
                              ) : isCompleted ? (
                                <button
                                  onClick={() => handleMailCertificate(s)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer"
                                >
                                  ✉️ Mail Certificate
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                  In Progress
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setDeleteMode("soft");
                                  setDeleteConfirmUser({
                                    _id: s.id,
                                    email: s.email,
                                    name: s.name,
                                    role: "student",
                                    isDeleted: false,
                                  });
                                }}
                                className="p-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition cursor-pointer"
                                title="Delete student account"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: ENQUIRIES (PRESERVED FEATURE)
          ========================================================= */}
      {activeTab === "enquiries" && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Public Contact & Admissions Enquiries</h2>
            <p className="text-xs text-gray-500">Student submissions from the public contact form</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Email & Phone</th>
                    <th className="px-5 py-3.5">Interested Course</th>
                    <th className="px-5 py-3.5">Message</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Date Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!studentsData?.enquiries || studentsData.enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        No enquiries received yet.
                      </td>
                    </tr>
                  ) : (
                    studentsData.enquiries.map((enq) => (
                      <tr key={enq._id} className="hover:bg-gray-50/70 transition">
                        <td className="px-5 py-3.5 font-bold text-gray-900">{enq.name}</td>
                        <td className="px-5 py-3.5">
                          <div className="text-gray-800">{enq.email}</div>
                          {enq.phone && <div className="text-[11px] text-gray-400">{enq.phone}</div>}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-700">{enq.course || "General"}</td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-sm">{enq.message}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              enq.status === "New"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : enq.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {enq.status || "New"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-400 text-xs whitespace-nowrap">
                          {fmtDate(enq.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 1: EDIT USER
          ========================================================= */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-gray-900">Edit User Details</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={editUser.email}
                  className="w-full bg-gray-100 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Role</label>
                <select
                  value={editForm.role}
                  disabled={editUser._id === user._id}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
                {editUser._id === user._id && (
                  <p className="text-[11px] text-gray-400 mt-1">You cannot remove your own admin role.</p>
                )}
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.emailVerified}
                    onChange={(e) => setEditForm((f) => ({ ...f, emailVerified: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-xs font-medium text-gray-700">Email Verified</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={editUser._id === user._id}
                    checked={editForm.isBlocked}
                    onChange={(e) => setEditForm((f) => ({ ...f, isBlocked: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded disabled:opacity-50"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Suspended / Blocked (Denies login and session access)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                {editUser._id !== user._id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteMode(editUser.isDeleted ? "permanent" : "soft");
                      setDeleteConfirmUser(editUser);
                    }}
                    className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🗑️</span> Delete User
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editBusy}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {editBusy ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: DELETE CONFIRMATION
          ========================================================= */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-gray-900 leading-tight">Delete User Account</h3>
                <p className="text-xs text-gray-500">
                  Target: <strong className="text-gray-900">{deleteConfirmUser.name || "User"}</strong> ({deleteConfirmUser.email})
                </p>
              </div>
            </div>

            {deleteConfirmUser.isDeleted ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 text-xs text-red-800">
                <p className="font-bold mb-1">⚠️ Permanent Deletion Warning</p>
                <p>
                  This user is already deactivated. Confirming will <strong>permanently purge</strong> this user, their enrolled track progress, and records from MongoDB. This action cannot be reversed.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                <p className="text-xs text-gray-600">Choose deletion mode for this account:</p>

                <label
                  onClick={() => setDeleteMode("soft")}
                  className={`block p-3 rounded-xl border text-xs cursor-pointer transition ${
                    deleteMode === "soft"
                      ? "border-red-500 bg-red-50/50 text-gray-900 ring-1 ring-red-500"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === "soft"}
                      onChange={() => setDeleteMode("soft")}
                      className="mt-0.5 text-red-600"
                    />
                    <div>
                      <span className="font-bold block text-gray-900">Soft Delete / Deactivate (Recommended)</span>
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        Revokes active sessions, terminates login access, and marks account as deleted while keeping student progress and audit logs intact. Can be restored anytime.
                      </span>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setDeleteMode("permanent")}
                  className={`block p-3 rounded-xl border text-xs cursor-pointer transition ${
                    deleteMode === "permanent"
                      ? "border-red-600 bg-red-50/50 text-gray-900 ring-1 ring-red-600"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === "permanent"}
                      onChange={() => setDeleteMode("permanent")}
                      className="mt-0.5 text-red-600"
                    />
                    <div>
                      <span className="font-bold block text-red-700">Permanent Hard Delete (Purge)</span>
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        Completely purges this user and their course progress records from the database. Cannot be undone.
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={handleDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteBusy ? (
                  "Deleting..."
                ) : deleteMode === "permanent" || deleteConfirmUser.isDeleted ? (
                  "Permanently Purge"
                ) : (
                  "Confirm Deactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: RESET PASSWORD CONFIRMATION
          ========================================================= */}
      {resetPwUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-200 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              🔑
            </div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-1">Issue Password Reset</h3>
            <p className="text-xs text-gray-600 mb-4">
              Send a secure single-use password reset email to{" "}
              <strong className="text-gray-900">{resetPwUser.email}</strong>?
              <br />
              Password hashes are never revealed to administrators.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setResetPwUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetPwBusy}
                onClick={handleResetPassword}
                className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {resetPwBusy ? "Sending..." : "Send Reset Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: CHANGE ADMIN PASSWORD
          ========================================================= */}
      {changePwModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                🔑
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-gray-900 leading-tight">Change Admin Password</h3>
                <p className="text-xs text-gray-500">Update your credentials to a unique, strong password</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900">
              <span className="font-bold">🛡️ Data Breach Protection Notice:</span>
              <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
                If your browser shows a "Password found in data breach" alert, it means the password you entered was seen in past public internet leaks. Set a fresh, unique password of 8+ characters to secure your account.
              </p>
            </div>

            {changePwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4 font-semibold">
                ⚠️ {changePwError}
              </div>
            )}

            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={changePwShow ? "text" : "password"}
                    required
                    value={changePwForm.currentPassword}
                    onChange={(e) => setChangePwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-red-600"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setChangePwShow(!changePwShow)}
                    className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {changePwShow ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Password (min 8 chars)</label>
                <input
                  type={changePwShow ? "text" : "password"}
                  required
                  value={changePwForm.newPassword}
                  onChange={(e) => setChangePwForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-red-600"
                  placeholder="Enter strong, unique new password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type={changePwShow ? "text" : "password"}
                  required
                  value={changePwForm.confirmPassword}
                  onChange={(e) => setChangePwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-red-600"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setChangePwModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePwBusy}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {changePwBusy ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
