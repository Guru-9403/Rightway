import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { PATHS } from "../../utils/paths";

export default function ProfileModal() {
  const { user, xp, statuses, cssStatuses, jsStatuses, medicalStatuses, graphicDesignStatuses, certificateId, closeModal, logout } = useApp();
  const navigate = useNavigate();

  // Progress stats
  const stats = useMemo(() => {
    const webHtml = (statuses || []).filter((s) => s?.testPassed).length;
    const webCss = (cssStatuses || []).filter((s) => s?.testPassed).length;
    const webJs = (jsStatuses || []).filter((s) => s?.testPassed).length;
    const webTotal = webHtml + webCss + webJs;

    const medical = (medicalStatuses || []).filter((s) => s?.testPassed || s?.taskCompleted).length;
    const graphic = (graphicDesignStatuses || []).filter((s) => s?.testPassed || s?.taskCompleted).length;

    let courseName = user?.enrolledCourse || "Full Stack Web Development";
    let done = webTotal;
    let total = 28;

    if (graphic > 0) {
      courseName = "Graphic Design";
      done = graphic;
      total = 12;
    } else if (medical > 0) {
      courseName = "Medical Billing & Coding";
      done = medical;
      total = 15;
    }

    const pct = Math.min(100, Math.round((done / total) * 100)) || 0;

    return { courseName, done, total, pct };
  }, [statuses, cssStatuses, jsStatuses, medicalStatuses, graphicDesignStatuses, user]);

  if (!user) return null;

  const initials = (user.name || "Student")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 text-white relative">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
            title="Close"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white text-red-600 font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-white/50 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white leading-tight">{user.name}</h2>
                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-black/30 text-white font-mono text-[11px] px-2 py-0.5 rounded-md">
                  ID: {user.studentId || "RSB001"}
                </span>
                <span className="bg-white/20 text-white font-bold text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span>⭐</span> {xp} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Course Progress Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enrolled Track</span>
              <span className="text-xs font-bold text-red-600">{stats.pct}% Complete</span>
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 mb-2">{stats.courseName}</h3>

            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.pct}%` }} />
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500 font-medium">
              <span>{stats.done} of {stats.total} lessons done</span>
              {certificateId ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span>🎓</span> Certificate Issued
                </span>
              ) : (
                <span>In progress</span>
              )}
            </div>
          </div>

          {/* Quick Account Information */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Account Role</span>
              <span className="font-bold text-gray-800 capitalize mt-0.5 block">{user.role}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Email Status</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <span>✅</span> Active & Verified
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {user.role === "admin" && (
              <button
                onClick={() => {
                  closeModal();
                  navigate(PATHS.admin);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/80 transition text-red-700 font-bold text-xs cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚡</span>
                  <span>Admin Management Panel</span>
                </div>
                <span>→</span>
              </button>
            )}

            <button
              onClick={() => {
                closeModal();
                navigate(PATHS.certificate);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-800 font-bold text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📜</span>
                <span>My Certificate</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            <button
              onClick={() => {
                closeModal();
                navigate(PATHS.home);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-800 font-bold text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎓</span>
                <span>Browse All 14 Tracks</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => {
              closeModal();
              logout();
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <span>🚪</span> Sign Out
          </button>

          <button
            onClick={closeModal}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
