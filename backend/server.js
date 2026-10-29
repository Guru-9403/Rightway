const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const xlsx = require("xlsx");
const nodemailer = require("nodemailer");
const { z } = require("zod");

const app = express();
app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET || "rightway_access_secret_key_default";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "rightway_refresh_secret_key_default";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const DIST_DIR = path.resolve(process.env.FRONTEND_DIST || path.join(__dirname, "..", "frontend", "dist"));
const VIDEOS_DIR = path.resolve(__dirname, "videos");

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .toLowerCase()
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

/* =========================================================
   SECURITY MIDDLEWARES: HELMET, CORS, BODY LIMIT, COOKIES
   ========================================================= */

// 1. Helmet headers
app.use(
  helmet({
    contentSecurityPolicy: false, // allow iframes and fonts for code runner & videos
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS allowlist (FRONTEND_URL & CLIENT_ORIGIN)
const allowedOrigins = [
  FRONTEND_URL,
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : []),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "https://rightwaycourses7.netlify.app",
  "https://rightwayskillbuilder.vercel.app",
]
  .filter(Boolean)
  .map((s) => s.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.includes("*") ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin) ||
        /\.vercel\.app$/.test(cleanOrigin) ||
        /\.netlify\.app$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// 3. Small body size limit
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// 4. Cookie parser
app.use(cookieParser());

/* =========================================================
   DATABASE CONNECTION
   ========================================================= */

const { prisma, User, AuditLog, Enquiry } = require("./prismaModels");

let isDbConnected = false;
prisma
  .$connect()
  .then(() => {
    isDbConnected = true;
    console.log("Connected to Supabase PostgreSQL successfully via Prisma.");
  })
  .catch((err) => {
    isDbConnected = false;
    console.error("Supabase PostgreSQL connection failed via Prisma:", err.message);
  });

if (!fs.existsSync(VIDEOS_DIR)) {
  try {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create VIDEOS_DIR:", err.message);
  }
}

// Active Server-Sent Events (SSE) connections for live stream
const sseClients = new Set();

// Audit log recorder helper
async function recordAuditLog({
  userId = null,
  userEmail = "",
  userName = "",
  adminId = null,
  adminEmail = "",
  action,
  ip = "",
  userAgent = "",
  details = {},
}) {
  try {
    // Sanitize details: strictly remove passwords, hashes, tokens, OTPs
    const safeDetails = { ...details };
    const forbiddenKeys = ["password", "token", "otp", "otphash", "hash", "refreshtoken", "accesstoken"];
    for (const k of Object.keys(safeDetails)) {
      if (forbiddenKeys.some((f) => k.toLowerCase().includes(f))) {
        delete safeDetails[k];
      }
    }

    const logEntry = await AuditLog.create({
      userId,
      userEmail,
      userName,
      adminId,
      adminEmail,
      action,
      ip: ip || "unknown",
      userAgent: userAgent || "unknown",
      details: safeDetails,
      timestamp: new Date(),
    });

    // Broadcast in real-time to active SSE clients
    const payload = `data: ${JSON.stringify(logEntry)}\n\n`;
    for (const client of sseClients) {
      try {
        client.res.write(payload);
      } catch (err) {
        sseClients.delete(client);
      }
    }

    return logEntry;
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
}

// Cleanup unverified accounts older than 7 days (excluding admins)
async function cleanupUnverifiedAccounts() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({
      role: { $ne: "admin" },
      email: { $nin: ADMIN_EMAILS },
      emailVerified: { $ne: true },
      isEmailVerified: { $ne: true },
      createdAt: { $lt: sevenDaysAgo },
    });
    if (result.deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${result.deletedCount} unverified account(s) older than 7 days.`);
    }
  } catch (err) {
    console.error("[Cleanup] Error deleting unverified accounts:", err.message);
  }
}

// Run cleanup immediately after connection and every 12 hours
setTimeout(cleanupUnverifiedAccounts, 5000);
setInterval(cleanupUnverifiedAccounts, 12 * 60 * 60 * 1000);

// Enquiry model is provided by prismaModels.js

/* =========================================================
   ZOD VALIDATION SCHEMAS
   ========================================================= */

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().optional(),
  confirm: z.string().optional(),
  terms: z.union([z.boolean(), z.string()]).optional(),
  termsAccepted: z.union([z.boolean(), z.string()]).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

const resetPasswordSchema = z.object({
  token: z.string().optional(),
  resetToken: z.string().optional(),
  otp: z.string().optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters.").optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  otp: z.string().trim().length(6, "Verification code must be exactly 6 digits."),
});

const resendOtpSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").optional(),
  role: z.enum(["student", "admin"]).optional(),
  emailVerified: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
});

/* =========================================================
   TOKEN & COOKIE HELPERS
   ========================================================= */

const cookieBaseOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

function signAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      id: user._id,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

function hashToken(raw) {
  if (raw === null || raw === undefined) return "";
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...cookieBaseOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  });
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      ...cookieBaseOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", cookieBaseOptions);
  res.clearCookie("refreshToken", cookieBaseOptions);
}

/* =========================================================
   EMAIL SERVICE: Resend API (Primary) & Nodemailer SMTP (Fallback)
   ========================================================= */

let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  // If not currently in memory, ensure latest .env values are reloaded
  if (!process.env.RESEND_API_KEY) {
    try {
      require("dotenv").config({ override: true });
    } catch {}
  }
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const { Resend } = require("resend");
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch (err) {
    console.error("[Resend] Client initialization error:", err.message);
    return null;
  }
}

// Log email service status on startup
const startupResendKey = (process.env.RESEND_API_KEY || "").trim();
if (startupResendKey) {
  console.log(`[Resend] API key configured. Resend will be used as primary email service.`);
} else {
  console.log(`[Email Service] RESEND_API_KEY not set. Using SMTP fallback if configured.`);
}

let smtpTransporter = null;

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) return null;

  try {
    smtpTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user.trim(),
        // Gmail App Passwords can be 16 characters with spaces; strip all whitespace
        pass: pass.replace(/\s+/g, ""),
      },
    });
  } catch (err) {
    console.error("[Nodemailer] Transporter initialization error:", err.message);
    smtpTransporter = null;
  }

  return smtpTransporter;
}

// Verify Gmail SMTP on startup if configured
const startupGmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
const startupGmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
if (startupGmailUser && startupGmailPass && !startupResendKey) {
  const initialTransporter = getSmtpTransporter();
  if (initialTransporter) {
    initialTransporter.verify((error) => {
      if (error) {
        console.warn(`[Nodemailer] Gmail verification check failed: ${error.message}`);
      } else {
        console.log(`[Nodemailer] SMTP transporter verified & ready to send via ${startupGmailUser}`);
      }
    });
  }
}

// Unified sendMail utility - delivers via Resend API first, with automatic Nodemailer SMTP fallback
async function sendMail({ to, subject, html, text }) {
  const plainText = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");
  const cleanTo = Array.isArray(to) ? to.map((t) => String(t).trim().toLowerCase()) : [String(to).trim().toLowerCase()];

  let resendErrorMsg = null;

  // 1. Primary Email Provider: Resend API
  let resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!resendApiKey) {
    try {
      require("dotenv").config({ override: true });
    } catch {}
    resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  }
  if (resendApiKey) {
    const resend = getResendClient();
    if (resend) {
      try {
        const fromAddress =
          (process.env.RESEND_FROM || "").trim() ||
          "Rightway Skill Builder <onboarding@resend.dev>";

        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: cleanTo,
          subject,
          html,
          text: plainText,
        });

        if (error) {
          resendErrorMsg = error.message;
          if (error.message && error.message.includes("testing emails to your own email address")) {
            console.log(`[Resend Sandbox] Recipient ${cleanTo.join(", ")} is external. Routing via SMTP fallback for instant delivery...`);
          } else {
            console.warn(`[Resend Notice] ${error.message}. Routing via SMTP fallback...`);
          }
        } else {
          console.log(`[Resend API] Email delivered successfully to ${cleanTo.join(", ")} (ID: ${data?.id})`);
          return { success: true, messageId: data?.id, provider: "resend" };
        }
      } catch (err) {
        resendErrorMsg = err.message;
        console.warn(`[Resend Notice] Resend error: ${err.message}. Routing via SMTP fallback...`);
      }
    }
  }

  // 2. Fallback Email Provider: Nodemailer SMTP (Gmail)
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const transporter = getSmtpTransporter();

  if (!transporter || !user) {
    console.warn(`[Email Service] Neither Resend delivered nor SMTP configured. Email to ${cleanTo.join(", ")} not sent.`);
    return {
      success: false,
      error: resendErrorMsg || "Email service not configured. Please verify your domain on resend.com or configure SMTP.",
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `"Rightway Skill Builder" <${user}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanTo.length === 1 ? cleanTo[0] : cleanTo,
      subject,
      html,
      text: plainText,
    });
    console.log(`[Nodemailer Fallback] Email delivered to ${cleanTo.join(", ")} via SMTP (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId, provider: "smtp" };
  } catch (err) {
    console.error(`[Nodemailer Error] Fallback SMTP failed to send email to ${cleanTo.join(", ")}:`, err.message);
    return { success: false, error: resendErrorMsg ? `${resendErrorMsg} (SMTP fallback failed: ${err.message})` : err.message };
  }
}

// Backward compatibility aliases
const sendEmail = sendMail;
const sendResendEmail = sendMail;

// Generate 6-digit OTP using crypto.randomInt and email via Nodemailer
async function generateAndSendOtp(user, reason = "verification") {
  // 6-digit OTP
  const otp = String(crypto.randomInt(100000, 1000000));
  // Store only the SHA-256 hash
  user.otpHash = hashToken(otp);
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  user.otpAttempts = 0;
  user.otpResendAvailableAt = new Date(Date.now() + 60 * 1000); // 60-second cooldown
  await user.save();

  console.log(`\n=================================================`);
  console.log(`🔑 [VERIFICATION OTP] For ${user.email} (${reason}): ${otp}`);
  console.log(`=================================================\n`);

  let emailDelivered = true;
  let emailNotice = "";

  // Exact required email text
  const emailText = `Your Rightway Skill Builder verification code is ${otp}. It expires in 10 minutes.`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: #111827; font-size: 22px; font-weight: 800;">
          Rightway <span style="color: #dc2626;">Skill Builder</span>
        </h2>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Interactive Professional Courses</p>
      </div>
      <h3 style="color: #111827; font-size: 18px; font-weight: 700; margin: 0 0 12px;">Verify your email address</h3>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        Please enter the following 6-digit verification code to complete your registration:
      </p>
      <div style="background-color: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #dc2626;">
          ${otp}
        </span>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
        ⏳ This code is single-use and will expire in <strong>10 minutes</strong>.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        If you did not request this verification code, please safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
        Rightway Skill Builder Security Team
      </p>
    </div>
  `;

  try {
    const mailResult = await sendMail({
      to: user.email,
      subject: "Your Rightway Skill Builder verification code",
      html: emailHtml,
      text: emailText,
    });
    emailDelivered = mailResult.success;
    if (!mailResult.success) {
      emailNotice = mailResult.error || "Email delivery failed.";
    }
  } catch (emailErr) {
    emailDelivered = false;
    emailNotice = emailErr.message || "Email delivery failed.";
    console.error(`[Nodemailer Error] Could not deliver OTP email to ${user.email}:`, emailErr.message);
  }

  return { otp, emailDelivered, emailNotice };
}

/* =========================================================
   RATE LIMITERS (with automatic memory cleanup)
   ========================================================= */

function createRateLimiter({ windowMs, maxAttempts, message }) {
  const map = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of map.entries()) {
      if (now > v.resetTime) map.delete(k);
    }
  }, 5 * 60 * 1000);

  return function (req, res, next) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "client-ip";
    const now = Date.now();
    let record = map.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }
    record.count += 1;
    map.set(ip, record);

    if (record.count > maxAttempts) {
      return res.status(429).json({ message });
    }
    next();
  };
}

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 30,
  message: "Too many login attempts from this network. Please try again in 15 minutes.",
});

const registerRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 20,
  message: "Too many registration attempts. Please try again in 15 minutes.",
});

const verifyOtpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 30,
  message: "Too many verification attempts. Please try again in 15 minutes.",
});

const resendOtpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 15,
  message: "Too many OTP resend requests. Please try again in 15 minutes.",
});

const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 20,
  message: "Too many password reset requests. Please try again in 15 minutes.",
});

const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 500,
  message: "Too many admin requests. Please slow down.",
});

/* =========================================================
   AUTH & ROLE MIDDLEWARES (requireAuth & requireAdmin)
   ========================================================= */

async function requireAuth(req, res, next) {
  // Check cookie first, fallback to Authorization header or query param (for EventSource)
  let token = req.cookies && req.cookies.accessToken;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }
  if (token === "null" || token === "undefined") {
    token = null;
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found or session expired." });
    }
    if (user.deletedAt) {
      return res.status(403).json({ message: "This account has been deleted." });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "This account has been suspended/blocked." });
    }
    const isAdminUser = user.role === "admin" || ADMIN_EMAILS.includes(user.email.toLowerCase());
    if (!isAdminUser && !user.emailVerified && !user.isEmailVerified) {
      return res.status(403).json({
        requiresVerification: true,
        email: user.email,
        message: "Email verification required to access course content.",
      });
    }
    req.user = user;
    next();
  } catch (err) {
    // If access token expired, try to refresh via refreshToken cookie if available
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findById(decodedRefresh.id).select("+refreshTokenHash");
        if (user && user.refreshTokenHash && user.refreshTokenHash === hashToken(refreshToken)) {
          if (user.deletedAt) {
            return res.status(403).json({ message: "This account has been deleted." });
          }
          if (user.isBlocked) {
            return res.status(403).json({ message: "This account has been suspended/blocked." });
          }
          const isAdminUser = user.role === "admin" || ADMIN_EMAILS.includes(user.email.toLowerCase());
          if (!isAdminUser && !user.emailVerified && !user.isEmailVerified) {
            return res.status(403).json({
              requiresVerification: true,
              email: user.email,
              message: "Email verification required to access course content.",
            });
          }
          const newAccessToken = signAccessToken(user);
          setAuthCookies(res, newAccessToken);
          req.user = user;
          return next();
        }
      } catch (refreshErr) {
        /* invalid refresh token */
      }
    }
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }
}

// Backward compatibility alias
const authMiddleware = requireAuth;

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

// Backward compatibility alias
const adminMiddleware = requireAdmin;

function getLessonSlot(lessonId) {
  const id = Number(lessonId);
  if (id >= 1 && id <= 10) return { field: "statuses", index: id - 1 };
  if (id >= 11 && id <= 22) return { field: "cssStatuses", index: id - 11 };
  if (id >= 23 && id <= 28) return { field: "jsStatuses", index: id - 23 };
  if (id >= 29 && id <= 43) return { field: "medicalStatuses", index: id - 29 };
  if (id >= 44 && id <= 55) return { field: "graphicDesignStatuses", index: id - 44 };
  return null;
}

/* =========================================================
   AUTH ROUTES
   ========================================================= */

// Health Check
app.get("/healthz", (req, res) => res.send("ok"));
app.get("/api/healthz", (req, res) =>
  res.json({
    status: "ok",
    database: isDbConnected ? "connected" : "disconnected",
    emailConfigured: Boolean((process.env.GMAIL_USER || process.env.SMTP_USER) && (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS)),
  })
);

// Firebase Config
app.get("/api/auth/firebase-config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
  });
});

// Helper to generate a strictly unique, sequential studentId (e.g. RSB005, RSB006)
async function generateNextStudentId() {
  const users = await User.find(
    { studentId: { $regex: /^RSB\d+$/i } },
    { studentId: 1 }
  ).lean();

  let maxNum = 0;
  for (const u of users) {
    if (u.studentId) {
      const match = u.studentId.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  // Ensure the candidate studentId is completely unique in the database
  while (await User.exists({ studentId: "RSB" + String(nextNum).padStart(3, "0") })) {
    nextNum++;
  }
  return "RSB" + String(nextNum).padStart(3, "0");
}

// Registration Handler - Creates unverified account & emails 6-digit OTP
async function handleRegister(req, res) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errMsg = parseResult.error.errors[0]?.message || "Invalid registration data.";
      return res.status(400).json({ message: errMsg });
    }

    const { name, email, password, confirmPassword, confirm, terms, termsAccepted } = req.body;

    const confirmVal = confirmPassword !== undefined ? confirmPassword : confirm;
    if (confirmVal !== undefined && confirmVal !== password) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const explicitlyRejectedTerms = terms === false || termsAccepted === false || terms === "false" || termsAccepted === "false";
    if (explicitlyRejectedTerms) {
      return res.status(400).json({ message: "You must agree to the Terms and Privacy Policy." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      // If user signed up previously but never verified their email, allow them to re-register / send fresh OTP
      if (!existing.emailVerified && !existing.isEmailVerified) {
        existing.name = name.trim();
        existing.password = await bcrypt.hash(password, 12);
        existing.termsAcceptedAt = new Date();
        await existing.save();

        let retryOtp = { otp: "", emailDelivered: true, emailNotice: "" };
        try {
          retryOtp = await generateAndSendOtp(existing, "registration_retry");
        } catch (err) {
          retryOtp = { otp: "", emailDelivered: false, emailNotice: err.message || "Email delivery failed" };
        }

        return res.status(200).json({
          success: true,
          requiresVerification: true,
          email: cleanEmail,
          emailSent: retryOtp.emailDelivered,
          message: retryOtp.emailDelivered
            ? "A fresh verification code has been sent to your email."
            : `Account created. Verification email delayed: ${retryOtp.emailNotice}. Please click Resend code.`,
        });
      }
      return res.status(400).json({ message: "This email is already registered." });
    }

    // Bcrypt cost factor 12
    const hashedPassword = await bcrypt.hash(password, 12);

    const isAdminUser = ADMIN_EMAILS.includes(cleanEmail);
    const initialRole = isAdminUser ? "admin" : "student";
    const initialVerified = isAdminUser;

    let user = null;
    let studentId = "";
    const maxTries = 5;

    for (let attempt = 0; attempt < maxTries; attempt++) {
      try {
        studentId = await generateNextStudentId();
        user = await User.create({
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: initialRole,
          studentId: isAdminUser ? undefined : studentId,
          termsAcceptedAt: new Date(),
          createdAt: new Date(),
          emailVerified: initialVerified,
          isEmailVerified: initialVerified,
          lastLoginAt: new Date(),
          lastActiveAt: new Date(),
        });
        break;
      } catch (createErr) {
        if (createErr.code === 11000) {
          if (createErr.keyPattern?.email) {
            return res.status(400).json({ message: "This email is already registered." });
          }
          if (createErr.keyPattern?.studentId) {
            console.warn(`[handleRegister] studentId collision on ${studentId}, retrying... (attempt ${attempt + 1})`);
            continue;
          }
        }
        throw createErr;
      }
    }

    if (!user) {
      throw new Error("Unable to create user account. Please try again.");
    }

    let otpResult = { otp: "", emailDelivered: true, emailNotice: "" };
    try {
      otpResult = await generateAndSendOtp(user, "registration");
    } catch (sendErr) {
      otpResult = {
        otp: "",
        emailDelivered: false,
        emailNotice: sendErr.message || "Email service error",
      };
    }

    // Background notification for admin
    const adminEmail = (process.env.ADMIN_EMAILS || "").split(",")[0].trim() || "jdguru7777@gmail.com";
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #111827; margin-bottom: 8px;">New Student Signed Up (Pending Verification)</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          A new student has registered on Rightway Skill Builder and has been sent a verification OTP.
        </p>
        <ul style="color: #374151; font-size: 14px; line-height: 1.8;">
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Email:</strong> ${cleanEmail}</li>
          <li><strong>Student ID:</strong> ${studentId}</li>
          <li><strong>Registered At:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>
    `;
    sendMail({
      to: adminEmail,
      subject: "New user signed up (Pending Verification) - Rightway Skill Builder",
      html: adminNotificationHtml,
      text: `New student signed up: ${user.name} (${cleanEmail}), ID: ${studentId}`,
    }).catch((err) => console.error("Admin notification email error:", err.message));

    recordAuditLog({
      userId: user._id,
      userEmail: cleanEmail,
      userName: user.name,
      action: "register",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { role: user.role, studentId },
    });

    if (isAdminUser) {
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      user.refreshTokenHash = hashToken(refreshToken);
      await user.save();
      setAuthCookies(res, accessToken, refreshToken);

      return res.status(201).json({
        success: true,
        requiresVerification: false,
        email: cleanEmail,
        emailSent: otpResult.emailDelivered,
        token: accessToken,
        name: user.name,
        role: user.role,
        user: { name: user.name, email: user.email, role: user.role, studentId, enrolledCourse: user.enrolledCourse },
        message: "Administrator account created and verified successfully.",
      });
    }

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      emailSent: otpResult.emailDelivered,
      message: otpResult.emailDelivered
        ? "Registration successful. A 6-digit verification code has been sent to your email."
        : `Account created. Verification email is delayed: ${otpResult.emailNotice}. Please click 'Resend code'.`,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
}

app.post(
  ["/api/register", "/api/auth/register", "/api/signup", "/api/auth/signup", "/register", "/auth/signup", "/auth/register"],
  registerRateLimiter,
  handleRegister
);

// Verify OTP Handler
async function handleVerifyOtp(req, res) {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errMsg = parseResult.error.errors[0]?.message || "Invalid OTP or email.";
      return res.status(400).json({ message: errMsg });
    }

    const { email, otp } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({ email: cleanEmail }).select("+otpHash +refreshTokenHash");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or verification code." });
    }

    // Already verified
    if (user.emailVerified || user.isEmailVerified) {
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      user.refreshTokenHash = hashToken(refreshToken);
      await user.save();
      setAuthCookies(res, accessToken, refreshToken);
      return res.json({
        success: true,
        message: "Email is already verified.",
        token: accessToken,
        name: user.name,
        email: user.email,
        role: user.role,
        user: { name: user.name, email: user.email, role: user.role },
      });
    }

    // Check attempts limit (5 attempts)
    if (user.otpAttempts >= 5) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(400).json({
        message: "Too many failed attempts. This verification code has been invalidated. Please request a new code.",
        attemptsExceeded: true,
      });
    }

    // Check expiry (10 minutes)
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        message: "Verification code has expired. Please request a new code.",
        expired: true,
      });
    }

    // Verify SHA-256 hash
    const enteredHash = hashToken(cleanOtp);
    if (!user.otpHash || user.otpHash !== enteredHash) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      const remaining = Math.max(0, 5 - user.otpAttempts);
      if (user.otpAttempts >= 5) {
        user.otpHash = null;
        user.otpExpiresAt = null;
      }
      await user.save();

      if (remaining === 0) {
        return res.status(400).json({
          message: "Invalid OTP. You have reached the maximum number of attempts (5). Please request a new code.",
          attemptsExceeded: true,
          remainingAttempts: 0,
        });
      }

      return res.status(400).json({
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining,
      });
    }

    // OTP is valid and matches
    user.emailVerified = true;
    user.isEmailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.otpResendAvailableAt = null;
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    recordAuditLog({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: "otp_verified",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Email verified successfully! Welcome to Rightway Skill Builder.",
      token: accessToken,
      name: user.name,
      email: user.email,
      role: user.role,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        enrolledCourse: user.enrolledCourse,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error verifying code." });
  }
}

app.post(
  ["/api/verify-otp", "/api/auth/verify-otp", "/verify-otp", "/auth/verify-otp"],
  verifyOtpRateLimiter,
  handleVerifyOtp
);

// Resend OTP Handler
async function handleResendOtp(req, res) {
  try {
    const parseResult = resendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid email." });
    }

    const cleanEmail = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select("+otpHash");

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    if (user.emailVerified || user.isEmailVerified) {
      return res.status(400).json({ message: "This email is already verified. Please log in." });
    }

    // Enforce 60-second cooldown
    if (user.otpResendAvailableAt && user.otpResendAvailableAt > new Date()) {
      const secondsLeft = Math.ceil((user.otpResendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft} second(s) before requesting another verification code.`,
        secondsLeft,
      });
    }

    // Generate and send new OTP (replaces old one, resets attempts)
    user.otpAttempts = 0;
    let otpResult = { otp: "", emailDelivered: true, emailNotice: "" };
    try {
      otpResult = await generateAndSendOtp(user, "resend");
    } catch (err) {
      otpResult = {
        otp: "",
        emailDelivered: false,
        emailNotice: err.message || "Email service error",
      };
    }

    recordAuditLog({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: "otp_resend",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!otpResult.emailDelivered) {
      return res.status(500).json({
        message: `Could not send verification code: ${otpResult.emailNotice}. Please contact support.`,
      });
    }

    res.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error sending verification code." });
  }
}

app.post(
  ["/api/resend-otp", "/api/auth/resend-otp", "/resend-otp", "/auth/resend-otp"],
  resendOtpRateLimiter,
  handleResendOtp
);

// Login Handler with Account Lockout & Email Verification Check
app.post(
  ["/api/auth/login", "/api/login", "/auth/login", "/login"],
  loginRateLimiter,
  async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errMsg = parseResult.error.errors[0]?.message || "Invalid login data.";
      return res.status(400).json({ message: errMsg });
    }

    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Select password and lockout fields
    const user = await User.findOne({ email: cleanEmail }).select("+password +lockUntil +loginAttempts +refreshTokenHash +otpHash");
    if (!user || !user.password) {
      recordAuditLog({
        userEmail: cleanEmail,
        action: "login_fail",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { reason: "User not found or no password set" },
      });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.deletedAt) {
      recordAuditLog({
        userId: user._id,
        userEmail: cleanEmail,
        userName: user.name,
        action: "login_fail",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { reason: "Account is deleted" },
      });
      return res.status(403).json({ message: "This account has been deleted. Please contact support." });
    }

    if (user.isBlocked) {
      recordAuditLog({
        userId: user._id,
        userEmail: cleanEmail,
        userName: user.name,
        action: "login_fail",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { reason: "Account is suspended/blocked" },
      });
      return res.status(403).json({ message: "This account has been suspended/blocked. Please contact support." });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      recordAuditLog({
        userId: user._id,
        userEmail: cleanEmail,
        userName: user.name,
        action: "login_fail",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { reason: "Account temporarily locked", minutesLeft },
      });
      return res.status(403).json({
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`,
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      await user.save();
      recordAuditLog({
        userId: user._id,
        userEmail: cleanEmail,
        userName: user.name,
        action: "login_fail",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { reason: "Password mismatch", attempts: user.loginAttempts },
      });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Admin auto-promotion and verification
    const isAdminEmail = ADMIN_EMAILS.includes(cleanEmail);
    if (isAdminEmail) {
      user.role = "admin";
      user.emailVerified = true;
      user.isEmailVerified = true;
    }

    // Password matches: check email verification for non-admins
    if (!isAdminEmail && !user.emailVerified && !user.isEmailVerified) {
      let otpResult = { otp: "", emailDelivered: true, emailNotice: "" };
      try {
        otpResult = await generateAndSendOtp(user, "login_unverified");
      } catch (sendErr) {
        otpResult = {
          otp: "",
          emailDelivered: false,
          emailNotice: sendErr.message || "Failed to send email",
        };
      }

      return res.status(403).json({
        requiresVerification: true,
        email: cleanEmail,
        message: otpResult.emailDelivered
          ? "Please verify your email before logging in. A 6-digit verification code has been sent to your email."
          : `Please verify your email before logging in. (Email delivery error: ${otpResult.emailNotice})`,
      });
    }

    // Verified: reset lockout
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    recordAuditLog({
      userId: user._id,
      userEmail: cleanEmail,
      userName: user.name,
      action: "login_success",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      token: accessToken,
      name: user.name,
      email: user.email,
      role: user.role,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        enrolledCourse: user.enrolledCourse,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Refresh Token Handler
app.post(["/api/auth/refresh", "/api/refresh"], async (req, res) => {
  try {
    const refreshToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required." });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid or revoked refresh token." });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      token: newAccessToken,
    });
  } catch (err) {
    clearAuthCookies(res);
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
});

// Logout Handler (Clears cookies & revokes refresh token)
app.post(["/api/auth/logout", "/api/logout"], async (req, res) => {
  try {
    let token = req.cookies && req.cookies.accessToken;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
        if (user) {
          recordAuditLog({
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            action: "logout",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          });
        }
      } catch {
        /* token already expired */
      }
    }
  } catch (err) {
    console.warn("Logout revoke error:", err.message);
  } finally {
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out successfully." });
  }
});

// Forgot Password Handler - Generates 6-digit OTP and emails to user via Resend API
app.post(["/api/auth/forgot-password", "/api/forgot-password"], forgotPasswordRateLimiter, async (req, res) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid email." });
    }

    const cleanEmail = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select("+passwordResetTokenHash");

    recordAuditLog({
      userId: user ? user._id : null,
      userEmail: cleanEmail,
      userName: user ? user.name : "",
      action: "password_reset_request",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ message: "No registered account found with this email." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "This account has been suspended. Please contact support." });
    }

    // Enforce 60-second resend cooldown
    if (user.passwordResetResendAvailableAt && user.passwordResetResendAvailableAt > new Date()) {
      const secondsLeft = Math.ceil((user.passwordResetResendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft} second(s) before requesting another verification code.`,
        secondsLeft,
      });
    }

    // Generate secure 6-digit numeric OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    user.passwordResetTokenHash = hashToken(otp);
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
    user.passwordResetOtpAttempts = 0; // Reset failed attempts count
    user.passwordResetResendAvailableAt = new Date(Date.now() + 60 * 1000); // 60s cooldown
    await user.save();

    const resetHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #111827; font-size: 22px; font-weight: 800;">
            Rightway <span style="color: #dc2626;">Skill Builder</span>
          </h2>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Interactive Professional Courses</p>
        </div>
        <h3 style="color: #111827; font-size: 18px; font-weight: 700; margin: 0 0 12px;">Reset Your Password</h3>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">Hi <strong>${user.name}</strong>,</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          We received a request to reset your password. Use the following 6-digit verification code:
        </p>
        <div style="background-color: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #dc2626;">
            ${otp}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
          ⏳ This code is single-use and will expire in <strong>15 minutes</strong>.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          If you did not request a password reset, please ignore this email. Your account remains completely secure.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
          Rightway Skill Builder Security Team
        </p>
      </div>
    `;

    let emailDelivered = true;
    let emailNotice = "";

    try {
      const mailResult = await sendMail({
        to: cleanEmail,
        subject: "Your Password Reset OTP - Rightway Skill Builder",
        html: resetHtml,
        text: `Your Rightway Skill Builder password reset code is ${otp}. It expires in 15 minutes.`,
      });
      emailDelivered = mailResult.success;
      if (!mailResult.success) {
        emailNotice = mailResult.error || "Could not deliver email.";
      }
    } catch (emailErr) {
      emailDelivered = false;
      emailNotice = emailErr.message || "Failed to deliver email.";
      console.error(`[Email Service Error] Could not deliver password reset email to ${cleanEmail}:`, emailErr.message);
      console.log(`\n=================================================`);
      console.log(`🔑 [PASSWORD RESET OTP] For ${cleanEmail}: ${otp}`);
      console.log(`=================================================\n`);
    }

    if (!emailDelivered) {
      return res.status(502).json({
        success: false,
        message: `Could not deliver password reset email: ${emailNotice}`,
      });
    }

    res.json({
      success: true,
      message: "A 6-digit password reset code has been sent to your email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error processing request." });
  }
});

// Verify Reset OTP Handler - Validates 6-digit OTP before allowing password change
app.post(["/api/auth/verify-reset-otp", "/api/verify-reset-otp"], async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and 6-digit OTP code are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const codeClean = String(otp).trim();

    if (codeClean.length !== 6) {
      return res.status(400).json({ message: "Please enter the complete 6-digit verification code." });
    }

    const user = await User.findOne({ email: cleanEmail }).select("+passwordResetTokenHash");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or verification code." });
    }

    if (user.deletedAt) {
      return res.status(404).json({ message: "No registered account found with this email." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "This account has been suspended. Please contact support." });
    }

    // Check attempts limit (5 attempts max)
    if ((user.passwordResetOtpAttempts || 0) >= 5) {
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      await user.save();
      return res.status(400).json({
        message: "Too many failed attempts. This verification code has been invalidated. Please request a new code.",
        attemptsExceeded: true,
      });
    }

    // Check expiry (15 minutes)
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return res.status(400).json({
        message: "Verification code has expired. Please request a new code.",
        expired: true,
      });
    }

    // Verify SHA-256 hash
    const enteredHash = hashToken(codeClean);
    if (!user.passwordResetTokenHash || user.passwordResetTokenHash !== enteredHash) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      const remaining = Math.max(0, 5 - user.passwordResetOtpAttempts);
      if (user.passwordResetOtpAttempts >= 5) {
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
      }
      await user.save();

      if (remaining === 0) {
        return res.status(400).json({
          message: "Invalid OTP. You have reached the maximum number of attempts (5). Please request a new code.",
          attemptsExceeded: true,
          remainingAttempts: 0,
        });
      }

      return res.status(400).json({
        message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining,
      });
    }

    // Single-use validation: Invalidate OTP and generate temporary verified reset token (15 min expiry)
    // allowing password change ONLY after this successful OTP verification
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    user.passwordResetOtpAttempts = 0;
    await user.save();

    recordAuditLog({
      userId: user._id,
      userEmail: cleanEmail,
      userName: user.name,
      action: "password_reset_otp_verified",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "OTP verified successfully. You can now set your new password.",
      resetToken,
    });
  } catch (err) {
    console.error("Verify reset OTP error:", err);
    res.status(500).json({ message: "Server error verifying OTP." });
  }
});

// Reset Password Handler - Only allows password reset after successful OTP verification (verified resetToken)
app.post(["/api/auth/reset-password", "/api/reset-password"], async (req, res) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input data." });
    }

    const { email, token, resetToken, password, newPassword } = req.body;
    const finalPassword = password || newPassword;
    const finalToken = token || resetToken;

    if (!finalPassword || String(finalPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (!finalToken) {
      return res.status(400).json({ message: "Verification token is required. Please verify your OTP code first." });
    }

    const tokenHash = hashToken(finalToken);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset session. Please verify OTP again." });
    }

    // Bcrypt cost 12
    user.password = await bcrypt.hash(finalPassword, 12);
    // Single-use validation: Invalidate reset token and clear reset state
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetResendAvailableAt = null;
    user.refreshTokenHash = null; // Revoke all existing sessions
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.emailVerified = true;
    user.isEmailVerified = true;
    await user.save();

    clearAuthCookies(res);

    recordAuditLog({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: "password_reset_success",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Password has been successfully updated! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

// Authenticated Password Change
app.post(["/api/auth/change-password", "/api/change-password"], requireAuth, async (req, res) => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid data." });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!user || !user.password) {
      return res.status(400).json({ message: "Password cannot be changed for this account." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.refreshTokenHash = null; // Revoke old sessions
    await user.save();

    recordAuditLog({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: "password_reset_success",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { method: "direct_change" },
    });

    res.json({
      success: true,
      message: "Password changed successfully! Your account is now secured.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to update password." });
  }
});
app.all(["/api/auth/verify-email", "/api/verify-email"], async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) {
      return res.status(400).json({ message: "Verification token required." });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    }).select("+emailVerificationTokenHash");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired email verification link." });
    }

    user.isEmailVerified = true;
    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    recordAuditLog({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: "email_verified",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Email successfully verified. Thank you!",
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Failed to verify email." });
  }
});

// Request Email Verification Handler (Same response whether user exists or not)
app.post(["/api/auth/verify-email/request", "/api/verify-email/request"], async (req, res) => {
  try {
    const email = req.body.email && req.body.email.toLowerCase().trim();
    if (email) {
      const user = await User.findOne({ email });
      if (user && !user.isEmailVerified) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationTokenHash = hashToken(rawToken);
        user.emailVerificationExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const verifyUrl = `${FRONTEND_URL}/verify-email?token=${rawToken}`;
        sendMail({
          to: email,
          subject: "Verify your email - Rightway Skill Builder",
          html: `<p>Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
        }).catch((e) => console.error("[Nodemailer Error] Verification link email failed:", e.message));
      }
    }
    res.json({
      success: true,
      message: "If an account with that email exists, a verification link has been sent.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to process verification request." });
  }
});

// Google Sign-In Handler
app.post(["/api/auth/google", "/api/google", "/auth/google"], async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Google ID token required." });
    }

    const decoded = jwt.decode(idToken);
    if (!decoded || !decoded.email) {
      return res.status(400).json({ message: "Invalid Google token payload." });
    }

    const cleanEmail = decoded.email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (user.deletedAt) {
        recordAuditLog({
          userId: user._id,
          userEmail: cleanEmail,
          userName: user.name,
          action: "login_fail",
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          details: { reason: "Account is deleted", provider: "google" },
        });
        return res.status(403).json({ message: "This account has been deleted. Please contact support." });
      }
      if (user.isBlocked) {
        recordAuditLog({
          userId: user._id,
          userEmail: cleanEmail,
          userName: user.name,
          action: "login_fail",
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          details: { reason: "Account is blocked", provider: "google" },
        });
        return res.status(403).json({ message: "This account has been suspended/blocked. Please contact support." });
      }
    }

    if (!user) {
      const isAdminEmail = ADMIN_EMAILS.includes(cleanEmail);
      const studentId = isAdminEmail ? undefined : await generateNextStudentId();
      user = await User.create({
        name: decoded.name || decoded.email.split("@")[0],
        email: cleanEmail,
        studentId,
        role: isAdminEmail ? "admin" : "student",
        emailVerified: true,
        isEmailVerified: true,
        authProvider: "google",
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      });

      recordAuditLog({
        userId: user._id,
        userEmail: cleanEmail,
        userName: user.name,
        action: "register",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { provider: "google", studentId },
      });
    } else {
      user.emailVerified = true;
      user.isEmailVerified = true;
      user.authProvider = "google";
      if (ADMIN_EMAILS.includes(cleanEmail) && user.role !== "admin") {
        user.role = "admin";
      }
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();
      await user.save();
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    recordAuditLog({
      userId: user._id,
      userEmail: cleanEmail,
      userName: user.name,
      action: "login_success",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { provider: "google" },
    });

    res.json({
      success: true,
      token: accessToken,
      name: user.name,
      email: user.email,
      role: user.role,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        enrolledCourse: user.enrolledCourse,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Server error during Google auth." });
  }
});

// Current User Session
app.get(["/api/auth/me", "/api/me", "/auth/me"], requireAuth, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    studentId: req.user.studentId || "RSB001",
    enrolledCourse: req.user.enrolledCourse || "Full Stack Web Development",
    xp: req.user.xp || 0,
    isEmailVerified: req.user.isEmailVerified,
    createdAt: req.user.createdAt,
  });
});

/* =========================================================
   PROGRESS ROUTES
   ========================================================= */

// Progress - Get
app.get("/api/progress", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    statuses: u.statuses,
    cssStatuses: u.cssStatuses,
    jsStatuses: u.jsStatuses,
    medicalStatuses: u.medicalStatuses,
    graphicDesignStatuses: u.graphicDesignStatuses,
    xp: u.xp,
    certificateId: u.certificateId,
    certificateIssuedAt: u.certificateIssuedAt,
  });
});

// Progress - Save Lesson
app.patch("/api/progress/lesson", requireAuth, async (req, res) => {
  try {
    const { lessonId, taskCompleted, testPassed, xpAward } = req.body;
    const slot = getLessonSlot(lessonId);
    const user = req.user;

    if (slot) {
      const arr = user[slot.field] ? [...user[slot.field]] : [];
      const current = arr[slot.index] || { taskCompleted: false, testPassed: false };

      arr[slot.index] = {
        taskCompleted: taskCompleted !== undefined ? Boolean(taskCompleted) : current.taskCompleted,
        testPassed: testPassed !== undefined ? Boolean(testPassed) : current.testPassed,
      };

      user[slot.field] = arr;
      user.markModified(slot.field);
    }

    if (typeof xpAward === "number" && xpAward > 0) {
      user.xp = (user.xp || 0) + xpAward;
    }
    user.lastActiveAt = new Date();
    await user.save();

    if (taskCompleted || testPassed) {
      recordAuditLog({
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        action: "lesson_completed",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { lessonId, taskCompleted, testPassed, xpAward },
      });
    }

    res.json({ xp: user.xp });
  } catch (err) {
    console.error("Save lesson error:", err);
    res.status(500).json({ message: "Failed to save lesson progress." });
  }
});

// Heartbeat
app.patch("/api/progress/heartbeat", requireAuth, async (req, res) => {
  try {
    req.user.lastActiveAt = new Date();
    await req.user.save();
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

// Audit - Course Opened
app.post("/api/audit/course-opened", requireAuth, async (req, res) => {
  try {
    const { courseId } = req.body;
    recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "course_opened",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { courseId },
    });
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

// Issue Certificate
app.post("/api/certificate/issue", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.certificateId) {
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      user.certificateId = `RSB-${user.studentId || "CERT"}-${randomCode}`;
      user.certificateIssuedAt = new Date();
      await user.save();
    }
    res.json({
      certificateId: user.certificateId,
      issuedAt: user.certificateIssuedAt,
    });
  } catch (err) {
    console.error("Certificate issue error:", err);
    res.status(500).json({ message: "Failed to issue certificate." });
  }
});

/* =========================================================
   ADMIN ROUTES (requireAdmin)
   ========================================================= */

// Admin - Dashboard Analytics Cards
app.get("/api/admin/dashboard", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const [
      totalUsers,
      newToday,
      newThisWeek,
      verifiedUsers,
      unverifiedUsers,
      activeUsersNow,
      failedLoginsToday,
      blockedUsers,
      deletedUsers,
      studentCount,
      adminCount,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, createdAt: { $gte: startOfToday } }),
      User.countDocuments({ deletedAt: null, createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ deletedAt: null, $or: [{ emailVerified: true }, { isEmailVerified: true }] }),
      User.countDocuments({ deletedAt: null, emailVerified: false, isEmailVerified: false }),
      User.countDocuments({ deletedAt: null, lastActiveAt: { $gte: fifteenMinsAgo } }),
      AuditLog.countDocuments({ action: "login_fail", timestamp: { $gte: startOfToday } }),
      User.countDocuments({ deletedAt: null, isBlocked: true }),
      User.countDocuments({ deletedAt: { $ne: null } }),
      User.countDocuments({ deletedAt: null, role: "student" }),
      User.countDocuments({ deletedAt: null, role: "admin" }),
    ]);

    const liveSseClients = sseClients.size;

    res.json({
      totalUsers,
      newToday,
      newThisWeek,
      verifiedUsers,
      unverifiedUsers,
      activeUsersNow: Math.max(activeUsersNow, liveSseClients),
      failedLoginsToday,
      blockedUsers,
      deletedUsers,
      roleBreakdown: {
        students: studentCount,
        admins: adminCount,
      },
      liveSseClients,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard metrics." });
  }
});

// Admin - Users Table (Search, Filter, Pagination)
app.get("/api/admin/users", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Search query: name, email, studentId
    if (req.query.search && req.query.search.trim()) {
      const s = req.query.search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { studentId: { $regex: s, $options: "i" } },
      ];
    }

    // Role filter
    if (req.query.role && req.query.role !== "all") {
      query.role = req.query.role;
    }

    // Verified filter
    if (req.query.verified === "verified") {
      query.$or = [{ emailVerified: true }, { isEmailVerified: true }];
    } else if (req.query.verified === "unverified") {
      query.emailVerified = false;
      query.isEmailVerified = false;
    }

    // Status filter
    if (req.query.status === "deleted") {
      query.deletedAt = { $ne: null };
    } else if (req.query.status === "blocked") {
      query.deletedAt = null;
      query.isBlocked = true;
    } else if (req.query.status === "active") {
      query.deletedAt = null;
      query.isBlocked = { $ne: true };
    } else if (req.query.includeDeleted !== "true") {
      query.deletedAt = null;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password -otpHash -refreshTokenHash -emailVerificationTokenHash -passwordResetTokenHash"),
      User.countDocuments(query),
    ]);

    const sanitized = users.map((u) => ({
      _id: u._id,
      studentId: u.studentId || "RSB000",
      name: u.name,
      email: u.email,
      role: u.role || "student",
      verified: Boolean(u.emailVerified || u.isEmailVerified),
      provider: u.authProvider || (u.password ? "email" : "google"),
      isBlocked: Boolean(u.isBlocked),
      isDeleted: Boolean(u.deletedAt),
      deletedAt: u.deletedAt,
      enrolledCourse: u.enrolledCourse || "Full Stack Web Development",
      xp: u.xp || 0,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || u.createdAt,
      lastActiveAt: u.lastActiveAt,
    }));

    res.json({
      users: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// Admin - Edit User (name, role, verified, isBlocked)
app.put("/api/admin/users/:id", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const parseResult = adminUpdateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid update data." });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const { name, role, emailVerified, isBlocked } = req.body;

    // RULE: Admin cannot remove their own admin role
    if (req.user._id.toString() === targetUser._id.toString() && role !== undefined && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin role." });
    }

    // RULE: Admin cannot block their own account
    if (req.user._id.toString() === targetUser._id.toString() && isBlocked === true) {
      return res.status(400).json({ message: "You cannot block your own admin account." });
    }

    const before = {
      name: targetUser.name,
      role: targetUser.role,
      emailVerified: Boolean(targetUser.emailVerified || targetUser.isEmailVerified),
      isBlocked: Boolean(targetUser.isBlocked),
    };

    if (name !== undefined) targetUser.name = name.trim();
    if (role !== undefined) targetUser.role = role;
    if (emailVerified !== undefined) {
      targetUser.emailVerified = Boolean(emailVerified);
      targetUser.isEmailVerified = Boolean(emailVerified);
    }
    if (isBlocked !== undefined) {
      targetUser.isBlocked = Boolean(isBlocked);
      if (targetUser.isBlocked) {
        targetUser.refreshTokenHash = null; // Revoke session immediately
      }
    }

    await targetUser.save();

    const after = {
      name: targetUser.name,
      role: targetUser.role,
      emailVerified: Boolean(targetUser.emailVerified),
      isBlocked: Boolean(targetUser.isBlocked),
    };

    recordAuditLog({
      userId: targetUser._id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "user_updated",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { before, after },
    });

    res.json({
      success: true,
      message: "User updated successfully.",
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        verified: targetUser.emailVerified,
        isBlocked: targetUser.isBlocked,
      },
    });
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ message: "Failed to update user." });
  }
});

// Admin - Delete User (Soft delete with deletedAt, blocks login; or permanent hard delete with ?permanent=true)
app.delete("/api/admin/users/:id", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const rawId = req.params.id;
    let targetUser = null;

    targetUser = await User.findById(rawId);
    if (!targetUser) {
      targetUser = await User.findOne({ $or: [{ studentId: rawId }, { email: rawId }] });
    }

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // RULE: Admin cannot delete their own account or system administrators
    if (req.user._id.toString() === targetUser._id.toString() || req.user.email === targetUser.email) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }
    if (ADMIN_EMAILS.includes(targetUser.email.toLowerCase())) {
      return res.status(400).json({ message: "System administrator accounts configured in ADMIN_EMAILS cannot be deleted." });
    }

    const isPermanent = req.query.permanent === "true";

    if (isPermanent) {
      const userEmail = targetUser.email;
      const userName = targetUser.name;
      const userId = targetUser._id;

      await User.findByIdAndDelete(userId);

      recordAuditLog({
        userId,
        userEmail,
        userName,
        adminId: req.user._id,
        adminEmail: req.user.email,
        action: "user_deleted",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: { permanent: true, message: "User permanently deleted from database" },
      });

      return res.json({
        success: true,
        message: `User ${userEmail} was permanently deleted from the database.`,
      });
    }

    // Soft delete
    targetUser.deletedAt = new Date();
    targetUser.isBlocked = true;
    targetUser.refreshTokenHash = null; // Revoke session
    await targetUser.save();

    recordAuditLog({
      userId: targetUser._id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "user_deleted",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { deletedAt: targetUser.deletedAt, permanent: false },
    });

    res.json({
      success: true,
      message: `User ${targetUser.email} has been deactivated (soft-deleted).`,
    });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ message: "Failed to delete user: " + err.message });
  }
});

// Admin - Restore Soft-deleted User
app.post("/api/admin/users/:id/restore", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const rawId = req.params.id;
    let targetUser = null;
    targetUser = await User.findById(rawId);
    if (!targetUser) {
      targetUser = await User.findOne({ $or: [{ studentId: rawId }, { email: rawId }] });
    }

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    targetUser.deletedAt = null;
    targetUser.isBlocked = false;
    await targetUser.save();

    recordAuditLog({
      userId: targetUser._id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "user_unblocked",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { restored: true, message: "User account restored from deletion" },
    });

    res.json({
      success: true,
      message: `User ${targetUser.email} has been restored successfully.`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isBlocked: targetUser.isBlocked,
        deletedAt: targetUser.deletedAt,
      },
    });
  } catch (err) {
    console.error("Admin restore user error:", err);
    res.status(500).json({ message: "Failed to restore user: " + err.message });
  }
});

// Admin - Reset User Password (sends email, never shows password hash)
app.post("/api/admin/users/:id/reset-password", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || targetUser.deletedAt) {
      return res.status(404).json({ message: "User not found or account is deleted." });
    }

    const rawResetToken = crypto.randomBytes(32).toString("hex");
    targetUser.passwordResetTokenHash = hashToken(rawResetToken);
    targetUser.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await targetUser.save();

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawResetToken}`;
    const resetHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #111827; margin-bottom: 8px;">Reset Your Password</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hi <strong>${targetUser.name}</strong>,</p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          An administrator has issued a password reset link for your <strong>Rightway Skill Builder</strong> account.
        </p>
        <div style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">This link is single-use and will expire in 30 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 13px; margin: 0;">
          Rightway Skill Builder Security Team
        </p>
      </div>
    `;

    await sendMail({
      to: targetUser.email,
      subject: "Password Reset Request - Rightway Skill Builder",
      html: resetHtml,
      text: `Hello ${targetUser.name}, an administrator requested a password reset for your Rightway Skill Builder account. Reset link: ${resetUrl}`,
    });

    recordAuditLog({
      userId: targetUser._id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: "password_reset_sent",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: `Password reset email sent to ${targetUser.email}.`,
    });
  } catch (err) {
    console.error("Admin send reset email error:", err);
    res.status(500).json({ message: "Failed to send password reset email: " + err.message });
  }
});

// Admin - Toggle User Block/Active Status
app.post("/api/admin/users/:id/toggle-block", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || targetUser.deletedAt) {
      return res.status(404).json({ message: "User not found." });
    }

    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ message: "You cannot block your own admin account." });
    }

    targetUser.isBlocked = !targetUser.isBlocked;
    if (targetUser.isBlocked) {
      targetUser.refreshTokenHash = null; // Revoke session
    }
    await targetUser.save();

    const action = targetUser.isBlocked ? "user_blocked" : "user_unblocked";
    recordAuditLog({
      userId: targetUser._id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details: { isBlocked: targetUser.isBlocked },
    });

    res.json({
      success: true,
      message: `User ${targetUser.email} is now ${targetUser.isBlocked ? "blocked" : "active"}.`,
      isBlocked: targetUser.isBlocked,
    });
  } catch (err) {
    console.error("Admin toggle block error:", err);
    res.status(500).json({ message: "Failed to update block status." });
  }
});

// Admin - Audit Logs (with search, action & date filters, pagination)
app.get("/api/admin/audit-logs", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.user && req.query.user.trim()) {
      const u = req.query.user.trim();
      query.$or = [
        { userEmail: { $regex: u, $options: "i" } },
        { userName: { $regex: u, $options: "i" } },
        { adminEmail: { $regex: u, $options: "i" } },
      ];
    }

    if (req.query.action && req.query.action !== "all") {
      query.action = req.query.action;
    }

    if (req.query.dateRange === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query.timestamp = { $gte: startOfToday };
    } else if (req.query.dateRange === "7days") {
      query.timestamp = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (req.query.dateRange === "30days") {
      query.timestamp = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("Admin audit logs error:", err);
    res.status(500).json({ message: "Failed to fetch audit logs." });
  }
});

// Admin - Live Audit Log Stream (Server-Sent Events)
app.get("/api/admin/audit-logs/stream", requireAuth, requireAdmin, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const clientId = Date.now() + Math.random().toString(36).substring(2);
  const clientObj = { id: clientId, res, user: req.user };
  sseClients.add(clientObj);

  res.write(`data: ${JSON.stringify({ type: "connected", message: "Live audit log stream connected" })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(clientObj);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(clientObj);
  });
});

// Admin - Export Audit Logs as CSV
app.get("/api/admin/audit-logs/export", requireAuth, requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const query = {};
    if (req.query.action && req.query.action !== "all") query.action = req.query.action;
    if (req.query.dateRange === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query.timestamp = { $gte: startOfToday };
    } else if (req.query.dateRange === "7days") {
      query.timestamp = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(10000);

    const escapeCsv = (str) => `"${String(str || "").replace(/"/g, '""')}"`;

    let csv = "Timestamp,Action,User Email,User Name,Admin Email,IP Address,Device/Browser,Details\n";
    for (const log of logs) {
      const detailsStr = log.details ? JSON.stringify(log.details) : "";
      csv +=
        [
          escapeCsv(log.timestamp ? log.timestamp.toISOString() : ""),
          escapeCsv(log.action),
          escapeCsv(log.userEmail),
          escapeCsv(log.userName),
          escapeCsv(log.adminEmail),
          escapeCsv(log.ip),
          escapeCsv(log.userAgent),
          escapeCsv(detailsStr),
        ].join(",") + "\n";
    }

    res.setHeader("Content-Disposition", `attachment; filename="rightway-audit-logs-${Date.now()}.csv"`);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csv);
  } catch (err) {
    console.error("Export audit logs error:", err);
    res.status(500).json({ message: "Failed to export audit logs." });
  }
});

// Admin - Students & Dashboard Data
app.get("/api/admin/students", requireAuth, requireAdmin, async (req, res) => {
  try {
    const allUsers = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 });
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(20);

    const now = Date.now();
    const students = allUsers.map((u) => {
      const htmlDone = (u.statuses || []).filter((s) => s && s.testPassed).length;
      const cssDone = (u.cssStatuses || []).filter((s) => s && s.testPassed).length;
      const jsDone = (u.jsStatuses || []).filter((s) => s && s.testPassed).length;
      const webDone = htmlDone + cssDone + jsDone;

      const medicalDone = (u.medicalStatuses || []).filter((s) => s && (s.testPassed || s.taskCompleted)).length;
      const graphicDone = (u.graphicDesignStatuses || []).filter((s) => s && (s.testPassed || s.taskCompleted)).length;

      let course = u.enrolledCourse || "Full Stack Web Development";
      let totalLessons = 28;
      let lessonsDone = webDone;

      if (graphicDone > 0) {
        course = "Graphic Design";
        totalLessons = 12;
        lessonsDone = graphicDone;
      } else if (medicalDone > 0) {
        course = "Medical Billing & Coding";
        totalLessons = 15;
        lessonsDone = medicalDone;
      }

      const progress = Math.min(100, Math.round((lessonsDone / totalLessons) * 100));
      const status = progress >= 100 ? "Completed" : progress > 0 ? "Pursuing" : "Enrolled";
      const isOnline = u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < 180000;

      return {
        id: u._id,
        studentId: u.studentId || "RSB000",
        name: u.name,
        email: u.email,
        course,
        totalLessons,
        lessonsDone,
        graphicDone,
        medicalDone,
        progress,
        status,
        xp: u.xp || 0,
        certificateIssuedAt: u.certificateIssuedAt,
        lastLoginAt: u.lastLoginAt || u.createdAt,
        loginCount: u.loginCount || 1,
        isOnline,
      };
    });

    const totalStudents = students.length;
    const noOfLogins = students.reduce((sum, s) => sum + s.loginCount, 0);
    const pursuingStudents = students.filter((s) => s.status === "Pursuing").length;
    const completedStudents = students.filter((s) => s.status === "Completed").length;

    const recentLogins = students.slice(0, 10).map((s) => ({
      _id: s.id,
      studentId: s.studentId,
      name: s.name,
      email: s.email,
      loginAt: s.lastLoginAt,
      isOnline: s.isOnline,
    }));

    res.json({
      summary: {
        totalStudents,
        noOfLogins,
        pursuingStudents,
        completedStudents,
        totalEnquiries: enquiries.length,
      },
      students,
      enquiries,
      recentLogins,
    });
  } catch (err) {
    console.error("Admin students error:", err);
    res.status(500).json({ message: "Failed to load admin students data." });
  }
});

// Admin - Send Certificate
app.post("/api/admin/certificate/send", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { studentId, course } = req.body;
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: "Student not found." });

    if (!user.certificateId) {
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      user.certificateId = `RSB-${user.studentId || "CERT"}-${randomCode}`;
    }
    user.certificateIssuedAt = new Date();
    await user.save();

    res.json({ success: true, message: `Certificate email queued for ${user.email} (${course})` });
  } catch (err) {
    res.status(500).json({ message: "Failed to send certificate." });
  }
});

// Admin - Export Excel
app.get("/api/admin/students/export", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 });
    const rows = users.map((u) => ({
      "Student ID": u.studentId || "N/A",
      "Full Name": u.name,
      "Email Address": u.email,
      "Course": u.enrolledCourse || "Full Stack Web Development",
      "XP Earned": u.xp || 0,
      "Certificate ID": u.certificateId || "Not Issued",
      "Certificate Date": u.certificateIssuedAt ? new Date(u.certificateIssuedAt).toISOString() : "N/A",
      "Joined Date": u.createdAt ? new Date(u.createdAt).toISOString() : "N/A",
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Students");
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="rightway-students.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ message: "Failed to export Excel spreadsheet." });
  }
});

// Public - Contact / Enquiry submission
app.post("/api/admin/enquiries/public", async (req, res) => {
  try {
    const { name, email, phone, course, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }
    const enquiry = await Enquiry.create({ name, email, phone, course, message });
    res.status(201).json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit enquiry." });
  }
});

/* =========================================================
   VIDEO STREAMING & STATIC SPA FILES
   ========================================================= */

function safeJoin(root, reqPath) {
  const resolved = path.join(root, path.normalize(reqPath));
  return resolved === root || resolved.startsWith(root + path.sep) ? resolved : null;
}

function streamVideo(req, res, filePath) {
  try {
    const { size } = fs.statSync(filePath);
    const range = req.headers.range;

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
        if (start >= size || start > end) {
          res.writeHead(416, { "Content-Range": `bytes */${size}` });
          return res.end();
        }
        res.writeHead(206, {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
          "Access-Control-Allow-Origin": "*",
        });
        const stream = fs.createReadStream(filePath, { start, end });
        req.on("close", () => stream.destroy());
        stream.on("error", () => {
          if (!res.headersSent) res.status(500).end();
        });
        return stream.pipe(res);
      }
    }

    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": size,
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
    });
    const stream = fs.createReadStream(filePath);
    req.on("close", () => stream.destroy());
    stream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  } catch (err) {
    if (!res.headersSent) res.status(500).send("Video streaming error");
  }
}

// Serve lesson videos
app.get("/courses-videos/:filename", (req, res) => {
  const filePath = safeJoin(VIDEOS_DIR, req.params.filename);
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return streamVideo(req, res, filePath);
  }
  res.status(404).send("Video not found");
});

// Dedicated 404 handler for unknown API routes (never return HTML index.html for API calls)
app.all("/api/*", (req, res) => {
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve frontend dist static files
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res) => {
    const indexPath = path.join(DIST_DIR, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend not built. Run: cd frontend && npm run build");
    }
  });
}

// Global Express JSON Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "An unexpected internal server error occurred.",
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
  console.log(`API endpoints available under http://${HOST}:${PORT}/api/`);
});
