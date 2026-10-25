import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { PATHS } from "../utils/paths";

export default function VerifyEmailCard({
  initialEmail = "",
  initialEmailSent = true,
  initialMessage = "",
  returnTo = "",
  onSuccess,
  onBack,
}) {
  const navigate = useNavigate();
  const { applyAuth, showToast } = useApp();

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  // 10-minute countdown (600s) & 60-second resend cooldown
  const [countdown, setCountdown] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(60);

  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    initialMessage || (initialEmailSent ? "We sent a 6-digit verification code to your email." : "")
  );
  const [emailWarning, setEmailWarning] = useState(!initialEmailSent ? initialMessage : "");
  const [attemptsExceeded, setAttemptsExceeded] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Focus the first input box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 10-minute expiry timer
  useEffect(() => {
    if (countdown <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 60-second resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`;
  };

  // Handle single digit change
  const handleChange = (index, value) => {
    // Only accept numeric characters
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const char = clean.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");

    // Auto-advance to next box
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 boxes filled
    const fullOtp = next.join("");
    if (fullOtp.length === 6 && !next.some((d) => d === "")) {
      submitOtp(fullOtp);
    }
  };

  // Handle backspace and arrow key navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste 6-digit OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasteData[i] || "";
    }
    setDigits(next);
    setError("");

    const targetIdx = Math.min(pasteData.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (pasteData.length === 6) {
      submitOtp(pasteData);
    }
  };

  // Submit OTP verification
  const submitOtp = async (otpCode) => {
    const code = otpCode || digits.join("");
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (code.length !== 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }
    if (attemptsExceeded) {
      setError("Maximum attempts reached. Please click 'Resend OTP' to get a new code.");
      return;
    }
    if (isExpired || countdown <= 0) {
      setError("Verification code has expired. Please request a new code.");
      return;
    }

    setError("");
    setBusy(true);

    try {
      const res = await api.verifyOtp(email.trim(), code);
      const data = await res.json();

      if (!res.ok) {
        if (data.attemptsExceeded) {
          setAttemptsExceeded(true);
        }
        if (data.expired) {
          setIsExpired(true);
        }
        // Clear digits so user can re-type
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        throw new Error(data.message || "Invalid OTP.");
      }

      // Success
      if (showToast) showToast("Email verified successfully! Welcome to Rightway Skill Builder.");
      if (applyAuth) await applyAuth(data);
      const target = returnTo || sessionStorage.getItem("returnTo") || PATHS.home;
      sessionStorage.setItem("openProfileAfterAuth", "true");
      sessionStorage.removeItem("returnTo");

      if (onSuccess) {
        onSuccess(data, target);
      } else {
        navigate(target);
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || resendBusy) return;
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setError("");
    setEmailWarning("");
    setResendBusy(true);

    try {
      const res = await api.resendOtp(email.trim());
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend verification code.");
      }

      setInfo("A new 6-digit verification code has been sent to your email.");
      setDigits(["", "", "", "", "", ""]);
      setAttemptsExceeded(false);
      setIsExpired(false);
      setCountdown(600); // Reset 10 minutes
      setResendCooldown(60); // 60s cooldown
      inputRefs.current[0]?.focus();
      if (showToast) showToast("New verification code sent!");
    } catch (err) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResendBusy(false);
    }
  };

  const otpComplete = digits.join("").length === 6;

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Brand Header */}
      <div className="font-extrabold text-xl text-center mb-2">
        Rightway <span className="text-red-600">Skill Builder</span>
      </div>
      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-center mb-1 text-gray-900">Verify your email</h1>
      <p className="text-center text-xs sm:text-sm text-gray-600 mb-4">
        Enter the 6-digit verification code sent to:
        <br />
        <strong className="text-gray-900 break-all">{email || "your email address"}</strong>
      </p>

      {/* Email delivery error or warning */}
      {emailWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3.5 py-2.5 rounded-lg mb-4 flex items-start gap-2">
          <span className="text-amber-500 font-bold">⚠️</span>
          <div className="flex-1">
            <span>{emailWarning}</span>
          </div>
        </div>
      )}

      {/* Info Notice */}
      {info && !emailWarning && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-2.5 rounded-lg mb-4 flex items-center gap-2">
          <span>ℹ️</span>
          <span>{info}</span>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-lg mb-4 flex items-start gap-2 font-medium">
          <span className="text-red-500 font-bold">❌</span>
          <div className="flex-1">
            <span>{error}</span>
            {attemptsExceeded && (
              <p className="mt-1 font-semibold text-red-800">
                Please click "Resend OTP" below to receive a new code.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6 Digit Input Boxes */}
      <div className="my-6">
        <label className="block text-center text-xs font-semibold text-gray-700 mb-3">
          Verification Code
        </label>
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={busy || attemptsExceeded}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold border-2 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition ${
                attemptsExceeded
                  ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                  : digit
                  ? "border-red-600 bg-red-50/20 text-gray-900"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Timers & Countdown display */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-6 px-1">
        <div className="flex items-center gap-1.5 font-medium">
          <span className={countdown < 60 ? "text-red-600 animate-pulse" : "text-gray-500"}>⏳</span>
          <span className={countdown < 60 ? "text-red-600 font-bold" : "text-gray-700"}>
            {isExpired ? "Code expired" : `Expires in: ${formatTime(countdown)}`}
          </span>
        </div>

        <button
          type="button"
          disabled={resendCooldown > 0 || resendBusy}
          onClick={handleResend}
          className={`text-xs sm:text-sm font-semibold transition ${
            resendCooldown > 0 || resendBusy
              ? "text-gray-400 cursor-not-allowed"
              : "text-red-600 hover:text-red-700 underline cursor-pointer"
          }`}
        >
          {resendBusy
            ? "Sending..."
            : resendCooldown > 0
            ? `Resend OTP (${resendCooldown}s)`
            : "Resend OTP"}
        </button>
      </div>

      {/* Verify Submit Button */}
      <button
        type="button"
        disabled={busy || !otpComplete || attemptsExceeded || isExpired}
        onClick={() => submitOtp()}
        className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${
          busy || !otpComplete || attemptsExceeded || isExpired
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
        }`}
      >
        {busy ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Verifying code...</span>
          </>
        ) : (
          "Verify & Continue"
        )}
      </button>

      {/* Back to Login / Navigation */}
      <div className="text-center text-xs sm:text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack || (() => navigate(PATHS.login))}
          className="text-gray-600 hover:text-gray-900 transition flex items-center gap-1 font-medium"
        >
          <span>←</span> Back to login
        </button>
        <button
          type="button"
          onClick={() => navigate(PATHS.signup)}
          className="text-red-600 hover:underline font-semibold"
        >
          Use another email
        </button>
      </div>
    </div>
  );
}
