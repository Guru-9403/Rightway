import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "../components/GoogleIcon";
import VerifyEmailCard from "../components/VerifyEmailCard";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { PATHS } from "../utils/paths";

function EyeIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "bg-gray-200", pct: "0%" };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 10) score += 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500", pct: "25%" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500", pct: "50%" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500", pct: "75%" };
  return { score: 4, label: "Strong", color: "bg-emerald-500", pct: "100%" };
}

export default function SignupPage() {
  const { googleAuth, showToast } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);

  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyEmailSent, setVerifyEmailSent] = useState(true);
  const [verifyMessage, setVerifyMessage] = useState("");

  // Check if Google Sign-In is configured on the backend
  useEffect(() => {
    let active = true;
    api
      .firebaseConfig()
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((cfg) => {
        if (active && cfg && cfg.apiKey && cfg.apiKey.length > 10 && !cfg.apiKey.includes("YOUR_")) {
          setHasGoogleAuth(true);
        }
      })
      .catch(() => {
        if (active) setHasGoogleAuth(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const validateField = (field, value, allValues) => {
    switch (field) {
      case "name":
        if (!value || value.trim().length < 2) return "Name must be at least 2 characters.";
        return "";
      case "email":
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address.";
        return "";
      case "password":
        if (!value || value.length < 8) return "Password must be at least 8 characters.";
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== allValues.password) return "Passwords do not match.";
        return "";
      case "termsAccepted":
        if (!value) return "You must agree to the Terms and Privacy Policy.";
        return "";
      default:
        return "";
    }
  };

  const validateAll = () => {
    const errs = {
      name: validateField("name", form.name, form),
      email: validateField("email", form.email, form),
      password: validateField("password", form.password, form),
      confirmPassword: validateField("confirmPassword", form.confirmPassword, form),
      termsAccepted: validateField("termsAccepted", form.termsAccepted, form),
    };

    setErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleChange = (field) => (e) => {
    const value = field === "termsAccepted" ? e.target.checked : e.target.value;
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    if (serverError) setServerError("");

    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value, nextForm),
      }));
    }

    // Live update confirm password matching if password changes
    if (field === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField("confirmPassword", form.confirmPassword, nextForm),
      }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, form[field], form),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      termsAccepted: true,
    });

    if (!validateAll()) return;

    setServerError("");
    setBusy(true);

    try {
      const res = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        termsAccepted: form.termsAccepted,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed. Please try again.");
      }

      if (data.requiresVerification) {
        setVerifyEmail(form.email.trim());
        setVerifyEmailSent(data.emailSent !== false);
        setVerifyMessage(data.message || "");
        if (showToast) showToast(data.message || "Verification code sent to your email!");
        setBusy(false);
        return;
      }

      setSuccessMessage("Account created successfully! Redirecting to login...");
      if (showToast) showToast("Account created successfully!");

      setTimeout(() => {
        navigate(PATHS.login);
      }, 1500);
    } catch (err) {
      setServerError(err.message || "Registration failed. Please try again.");
      setBusy(false);
    }
  };

  const google = async () => {
    setGoogleBusy(true);
    setServerError("");
    try {
      await googleAuth();
      navigate(PATHS.home);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setServerError(err.message || "Google sign-in failed. Please try again.");
      }
      setGoogleBusy(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  if (verifyEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <VerifyEmailCard
          initialEmail={verifyEmail}
          initialEmailSent={verifyEmailSent}
          initialMessage={verifyMessage}
          onSuccess={() => navigate(PATHS.home)}
          onBack={() => setVerifyEmail("")}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <form onSubmit={submit} noValidate className="w-full max-w-sm sm:max-w-md bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Brand Logo Header */}
        <div className="font-extrabold text-xl text-center mb-2">
          Rightway <span className="text-red-600">Skill Builder</span>
        </div>
        <h1 className="text-2xl font-extrabold text-center mb-1 text-gray-900">Create your account</h1>
        <p className="text-center text-xs sm:text-sm text-gray-600 mb-6">Start learning with our professional interactive tracks.</p>

        {/* Global Server Error Banner */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-lg mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg mb-4 flex items-center gap-2 font-medium">
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google Sign-in: Only shown if Google Auth is set up */}
        {hasGoogleAuth && (
          <>
            <button
              type="button"
              disabled={googleBusy || busy}
              onClick={google}
              className="w-full border border-gray-300 rounded-lg py-2.5 mb-5 font-semibold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <GoogleIcon />
              <span>{googleBusy ? "Signing in..." : "Sign up with Google"}</span>
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs font-semibold text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
          </>
        )}

        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            className={`w-full border rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
              errors.name && touched.name ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-red-500 focus:border-red-500"
            }`}
            value={form.name}
            onChange={handleChange("name")}
            onBlur={handleBlur("name")}
          />
          {errors.name && touched.name && (
            <p className="text-red-600 text-xs mt-1 font-medium">{errors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="mb-4">
          <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full border rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
              errors.email && touched.email ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-red-500 focus:border-red-500"
            }`}
            value={form.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
          />
          {errors.email && touched.email && (
            <p className="text-red-600 text-xs mt-1 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-3">
          <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full border rounded-lg pl-3 pr-10 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                errors.password && touched.password ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-red-500 focus:border-red-500"
              }`}
              value={form.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 focus:outline-none cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Hint and Password Strength Indicator */}
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
              <span>At least 8 characters</span>
              {form.password && (
                <span className="font-semibold text-gray-700">Strength: {strength.label}</span>
              )}
            </div>
            {form.password && (
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.pct }}
                ></div>
              </div>
            )}
          </div>

          {errors.password && touched.password && (
            <p className="text-red-600 text-xs mt-1 font-medium">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-gray-700 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full border rounded-lg pl-3 pr-10 py-2 text-sm transition focus:outline-none focus:ring-2 ${
                errors.confirmPassword && touched.confirmPassword ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-red-500 focus:border-red-500"
              }`}
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 focus:outline-none cursor-pointer"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.confirmPassword && touched.confirmPassword && (
            <p className="text-red-600 text-xs mt-1 font-medium">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms & Privacy Policy Checkbox */}
        <div className="mb-5">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              id="reg-terms"
              name="termsAccepted"
              type="checkbox"
              className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
              checked={form.termsAccepted}
              onChange={handleChange("termsAccepted")}
              onBlur={handleBlur("termsAccepted")}
            />
            <span className="text-xs text-gray-700 leading-snug">
              I agree to the <span className="font-semibold text-gray-900">Terms</span> and <span className="font-semibold text-gray-900">Privacy Policy</span> <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.termsAccepted && touched.termsAccepted && (
            <p className="text-red-600 text-xs mt-1 font-medium">{errors.termsAccepted}</p>
          )}
        </div>

        {/* Submit Button with Loading Spinner */}
        <button
          type="submit"
          disabled={busy || !!successMessage}
          className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-lg py-2.5 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {busy ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>

        {/* Login Link */}
        <div className="text-center text-xs sm:text-sm mt-5 text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            className="text-red-600 font-semibold hover:underline cursor-pointer"
            onClick={() => navigate(PATHS.login)}
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
}
