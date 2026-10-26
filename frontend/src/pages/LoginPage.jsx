import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GoogleIcon from "../components/GoogleIcon";
import ForgotPasswordModal from "../components/modals/ForgotPasswordModal";
import { useApp } from "../context/AppContext";
import { PATHS } from "../utils/paths";

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

export default function LoginPage() {
  const { emailLogin, googleAuth } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get("returnTo") || sessionStorage.getItem("returnTo") || "";

  useEffect(() => {
    if (returnTo) {
      sessionStorage.setItem("returnTo", returnTo);
      sessionStorage.setItem("openProfileAfterAuth", "true");
    }
  }, [returnTo]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handlePostAuth = () => {
    const target = returnTo || sessionStorage.getItem("returnTo") || PATHS.home;
    sessionStorage.setItem("openProfileAfterAuth", "true");
    sessionStorage.removeItem("returnTo");
    navigate(target);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return setError("Enter email and password.");
    setError("");
    setBusy(true);
    try {
      await emailLogin(email.trim(), password.trim());
      handlePostAuth();
    } catch (err) {
      if (err.requiresVerification) {
        navigate(
          `${PATHS.verifyEmail}?email=${encodeURIComponent(err.email || email.trim())}&fromLogin=true&emailSent=${err.data?.emailSent !== false}&message=${encodeURIComponent(err.message || "")}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`
        );
        return;
      }
      setError(err.message || "Login failed. Please try again.");
      setBusy(false);
    }
  };

  const google = async () => {
    setGoogleBusy(true);
    try {
      await googleAuth();
      handlePostAuth();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError(err.message || "Google sign-in failed. Please try again.");
      setGoogleBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="font-extrabold text-xl text-center mb-2">Rightway <span className="text-red-600">Skill Builder</span></div>
        <h1 className="text-2xl font-extrabold text-center mb-1">Welcome back</h1>
        <p className="text-center text-sm text-gray-600 mb-6">Continue learning and build your skills with interactive lessons.</p>

        {/* Notice for Course Video / Lesson Visitors */}
        {returnTo && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl mb-4 flex items-center gap-2 font-medium">
            <span className="text-base">🎬</span>
            <span>Please log in to continue watching course videos and start learning.</span>
          </div>
        )}

        {/* Google Sign-in button (temporarily hidden - uncomment below to re-enable) */}
        {/*
        <button type="button" disabled={googleBusy} onClick={google} className="w-full border border-gray-300 rounded-lg py-2.5 mb-5 font-semibold text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
          <GoogleIcon />
          <span>{googleBusy ? "Signing in..." : "Sign in with Google"}</span>
        </button>
        <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px bg-gray-200"></div><span className="text-xs font-semibold text-gray-500">OR</span><div className="flex-1 h-px bg-gray-200"></div></div>
        */}

        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1">Email Address</label>
          <input type="email" placeholder="you@example.com" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold">Password</label>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setShowForgotModal(true);
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <input type="password" placeholder="••••••••" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="text-red-600 text-xs mb-3 mt-1 font-medium">{error}</div>}
        {successMsg && <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs mb-3 mt-1 font-medium">{successMsg}</div>}

        <button type="submit" disabled={busy} className="w-full bg-red-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-red-700 mt-2 cursor-pointer">
          {busy ? "Logging in..." : "Log In"}
        </button>
        <div className="text-center text-sm mt-5">
          Don't have an account? <button type="button" className="text-red-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate(returnTo ? `${PATHS.signup}?returnTo=${encodeURIComponent(returnTo)}` : PATHS.signup)}>Create one</button>
        </div>
      </form>

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
        onSuccess={(resetEmail, newPw) => {
          setEmail(resetEmail);
          if (newPw) setPassword(newPw);
          setSuccessMsg("✅ Password updated successfully! Please click Log In to continue.");
          setError("");
        }}
      />
    </div>
  );
}
