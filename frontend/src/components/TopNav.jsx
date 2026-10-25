import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { PATHS } from "../utils/paths";

export default function TopNav() {
  const { user, xp, logout, setActiveModal } = useApp();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const isAdmin = user && user.role === "admin";
  const isLoggedIn = !!user;

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setProfileMenuOpen(false);
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  // Initials for avatar
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="rw-top-navbar bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate(PATHS.home)}
        >
          <span className="font-extrabold text-base sm:text-xl tracking-tight text-gray-900">
            Rightway <span className="text-red-600">Skill Builder</span>
          </span>
        </div>

        {/* Right Corner Navigation & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* XP Badge (if logged in) */}
          {isLoggedIn && (
            <span className="hidden sm:inline-flex items-center gap-1 font-bold text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full shadow-xs">
              <span>⭐</span> {xp} XP
            </span>
          )}

          {/* Contact Button */}
          <button
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            onClick={() => setActiveModal("contact")}
          >
            Contact us
          </button>

          {/* Info Shield Button */}
          <button
            className="border-[1.5px] border-red-500 hover:bg-red-50 text-red-600 p-1.5 rounded-md transition flex items-center justify-center active:scale-95 cursor-pointer"
            title="About Rightway Skill Builder"
            onClick={() => setActiveModal("info")}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>

          {/* USER PROFILE SECTION IN RIGHT CORNER */}
          <div className="relative" ref={profileMenuRef}>
            {isLoggedIn ? (
              <>
                {/* Profile Trigger Button */}
                <button
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full sm:rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition cursor-pointer select-none"
                  aria-expanded={profileMenuOpen}
                  aria-label="User profile menu"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {initials}
                    </div>
                    <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5" />
                  </div>

                  <span className="text-xs font-bold text-gray-800 hidden md:inline max-w-[110px] truncate">
                    {user.name}
                  </span>

                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 hidden sm:inline ${
                      profileMenuOpen ? "rotate-180 text-red-600" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header: User Info Card */}
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl border border-gray-100 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-sm text-gray-900 truncate leading-snug">
                            {user.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {user.role}
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-mono px-1.5 py-0.5 rounded">
                              {user.studentId || "RSB001"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-1 text-xs">
                      {/* View Profile */}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setActiveModal("profile");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 font-bold transition cursor-pointer text-left"
                      >
                        <span className="text-sm">👤</span>
                        <span>My Profile & Progress</span>
                      </button>

                      {/* Admin Portal (if admin) */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            navigate(PATHS.admin);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-red-700 bg-red-50/60 hover:bg-red-100/80 font-bold transition cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm">⚡</span>
                            <span>Admin Portal</span>
                          </div>
                          <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                            Admin
                          </span>
                        </button>
                      )}

                      {/* My Certificate */}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate(PATHS.certificate);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 font-bold transition cursor-pointer text-left"
                      >
                        <span className="text-sm">📜</span>
                        <span>My Certificate</span>
                      </button>

                      {/* Courses */}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate(PATHS.home);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 font-bold transition cursor-pointer text-left"
                      >
                        <span className="text-sm">🎓</span>
                        <span>All Courses & Tracks</span>
                      </button>
                    </div>

                    {/* Sign Out Divider */}
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs transition cursor-pointer text-left"
                      >
                        <span className="text-sm">🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* When Not Logged In: Profile / Sign In Pill */
              <button
                onClick={() => navigate(PATHS.login)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-300 hover:border-red-600 hover:text-red-600 text-gray-700 text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs"
              >
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                  👤
                </div>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
