// Edit values via frontend/.env (see .env.example) — no source changes needed.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

// EmailJS — from https://www.emailjs.com/, Email Service + Template.
export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_EMAILJS_SERVICE_ID";
export const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "YOUR_EMAILJS_TEMPLATE_ID";
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_EMAILJS_PUBLIC_KEY";
