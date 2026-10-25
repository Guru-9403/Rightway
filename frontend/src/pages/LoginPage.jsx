import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "../components/GoogleIcon";
import { useApp } from "../context/AppContext";
import { PATHS } from "../utils/paths";

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

export default function LoginPage() {
  const { emailLogin, googleAuth } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return setError("Enter email and password.");
    setError("");
    setBusy(true);
    try {
      await emailLogin(email.trim(), password.trim());
      navigate(PATHS.home);
    } catch (err) {
      if (err.requiresVerification) {
        navigate(
          `${PATHS.verifyEmail}?email=${encodeURIComponent(err.email || email.trim())}&fromLogin=true&emailSent=${err.data?.emailSent !== false}&message=${encodeURIComponent(err.message || "")}`
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
      navigate(PATHS.home);
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

        <button type="button" disabled={googleBusy} onClick={google} className="w-full border border-gray-300 rounded-lg py-2.5 mb-5 font-semibold text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
          <GoogleIcon />
          <span>{googleBusy ? "Signing in..." : "Sign in with Google"}</span>
        </button>
        <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px bg-gray-200"></div><span className="text-xs font-semibold text-gray-500">OR</span><div className="flex-1 h-px bg-gray-200"></div></div>

        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1">Email Address</label>
          <input type="email" placeholder="you@example.com" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-1">
          <label className="block text-xs font-semibold mb-1">Password</label>
          <input type="password" placeholder="••••••••" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="text-red-600 text-xs mb-3 mt-1">{error}</div>

        <button type="submit" disabled={busy} className="w-full bg-red-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-red-700 mt-2">
          {busy ? "Logging in..." : "Log In"}
        </button>
        <div className="text-center text-sm mt-5">
          Don't have an account? <button type="button" className="text-red-600 font-semibold" onClick={() => navigate(PATHS.signup)}>Create one</button>
        </div>
      </form>
    </div>
  );
}
