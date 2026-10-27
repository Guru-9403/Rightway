import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess,
}) {
  // Step 1: Enter email
  // Step 2: Enter & Verify OTP
  // Step 3: Enter & Save New Password (only after OTP is verified)
  // Step 4: Success screen
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);
  const [countdown, setCountdown] = useState(900); // 15 mins

  const otpInputsRef = useRef([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setStep(1);
      setDigits(["", "", "", "", "", ""]);
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setInfo("");
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 15-minute OTP countdown timer
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // STEP 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.forgotPassword(cleanEmail);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to send verification code.");
      }

      setStep(2);
      setResendCooldown(60);
      setCountdown(900);
      setInfo(`We sent a 6-digit verification code to ${cleanEmail}. Please check your email.`);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err.message || "Could not send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || busy) return;
    setError("");
    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.forgotPassword(cleanEmail);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to resend code.");

      setDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setCountdown(900);
      setInfo(`A fresh 6-digit OTP code has been sent to ${cleanEmail}. Please check your inbox.`);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setBusy(false);
    }
  };

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6).split("");
      const next = [...digits];
      for (let i = 0; i < 6; i++) {
        next[i] = pasted[i] || "";
      }
      setDigits(next);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    setError("");

    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Explicit paste handler to cleanly handle pasting full OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setError("");
    const nextFocus = Math.min(pasted.length, 5);
    otpInputsRef.current[nextFocus]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e, customOtp = null) => {
    e?.preventDefault();
    setError("");

    const fullOtp = (customOtp || digits.join("")).trim();
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.verifyResetOtp(cleanEmail, fullOtp);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Invalid or expired OTP code.");
      }

      // OTP Verified successfully! Save temporary reset token and advance to Step 3
      setResetToken(data.resetToken || "");
      setStep(3);
      setError("");
      setInfo("✅ OTP verified! You can now set your new password.");
    } catch (err) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setBusy(false);
    }
  };

  // STEP 3: Change Password
  const handleChangePassword = async (e) => {
    e?.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.resetPassword({
        resetToken,
        email: email.trim().toLowerCase(),
        otp: digits.join("").trim(),
        password: newPassword,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to update password.");
      }

      setStep(4);
      if (onSuccess) onSuccess(email.trim().toLowerCase(), newPassword);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rw-modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl border border-gray-200 relative mx-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Progress Step Indicator (Steps 1, 2, 3) */}
        {step <= 3 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${step === 1 ? "text-red-600" : "text-green-600"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${step > 1 ? "bg-green-600" : "bg-red-600"}`}>
                {step > 1 ? "✓" : "1"}
              </span>
              <span>Email</span>
            </div>
            <div className={`w-8 h-0.5 ${step > 1 ? "bg-green-600" : "bg-gray-200"}`}></div>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${step === 2 ? "text-red-600" : step > 2 ? "text-green-600" : "text-gray-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${step > 2 ? "bg-green-600" : step === 2 ? "bg-red-600" : "bg-gray-300"}`}>
                {step > 2 ? "✓" : "2"}
              </span>
              <span>Verify OTP</span>
            </div>
            <div className={`w-8 h-0.5 ${step > 2 ? "bg-green-600" : "bg-gray-200"}`}></div>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${step === 3 ? "text-red-600" : "text-gray-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${step === 3 ? "bg-red-600" : "bg-gray-300"}`}>
                3
              </span>
              <span>New Password</span>
            </div>
          </div>
        )}

        {/* Header Icon & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 text-2xl mb-3 shadow-inner">
            {step === 4 ? "🎉" : step === 3 ? "🔒" : step === 2 ? "📩" : "🔐"}
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">
            {step === 4
              ? "Password Changed Successfully!"
              : step === 3
              ? "Create New Password"
              : step === 2
              ? "Verify OTP Code"
              : "Forgot Your Password?"}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            {step === 4
              ? "Your password has been securely updated. You can now log in."
              : step === 3
              ? "OTP verified successfully! Now choose a strong new password for your account."
              : step === 2
              ? "Enter the 6-digit OTP code sent to your Gmail to verify your identity."
              : "Enter your registered email address and we will send a 6-digit OTP to reset your password."}
          </p>
        </div>

        {/* =========================================================
            STEP 1: Enter Email & Request OTP
            ========================================================= */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Registered Gmail / Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 font-medium flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold text-sm transition shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Sending OTP...</span>
                </>
              ) : (
                "Send Reset OTP"
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium"
              >
                &larr; Back to Log In
              </button>
            </div>
          </form>
        )}

        {/* =========================================================
            STEP 2: Enter & Verify OTP
            ========================================================= */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {info && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5 font-medium flex items-center gap-1.5">
                <span>📩</span>
                <span>{info}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>Code sent to: <strong className="text-gray-800">{email}</strong></span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-red-600 hover:underline font-semibold"
              >
                Change
              </button>
            </div>

            {/* 6-box OTP input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 text-center">
                Enter 6-Digit OTP Code
              </label>
              <div className="flex justify-center gap-2">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 px-1">
                <span>Code expires in: <strong className="text-red-600">{formatCountdown(countdown)}</strong></span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || busy}
                  onClick={handleResendOtp}
                  className="font-semibold text-red-600 disabled:text-gray-400 hover:underline cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 font-medium flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold text-sm transition shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying OTP...</span>
                </>
              ) : (
                "Verify OTP Code"
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium"
              >
                &larr; Re-enter Email
              </button>
            </div>
          </form>
        )}

        {/* =========================================================
            STEP 3: Set New Password (Only shown after OTP is verified)
            ========================================================= */}
        {step === 3 && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {info && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5 font-medium flex items-center gap-1.5">
                <span>✅</span>
                <span>{info}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Password (min 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 text-sm"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 text-sm"
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 font-medium flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold text-sm transition shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving New Password...</span>
                </>
              ) : (
                "Save & Update Password"
              )}
            </button>
          </form>
        )}

        {/* =========================================================
            STEP 4: Success Screen
            ========================================================= */}
        {step === 4 && (
          <div className="text-center py-3 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
              ✅ Your password has been changed successfully. You can now log in with your new password!
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold text-sm transition shadow-sm cursor-pointer"
            >
              Continue to Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
