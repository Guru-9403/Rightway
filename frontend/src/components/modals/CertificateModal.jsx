import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID } from "../../config/env";

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

// Certificate request form — sends the details through EmailJS.
export default function CertificateModal({ courseName, onClose }) {
  const { user } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const n = name.trim();
    const e = email.trim();
    const c = college.trim();

    if (!n) return setError("Full name is required.");
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setError("Enter a valid email address.");
    if (!c) return setError("College name is required.");

    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === "YOUR_EMAILJS_SERVICE_ID") {
      return setError("Email service is not yet configured with valid EmailJS credentials. You can view or print your certificate directly.");
    }

    setError("");
    setSending(true);
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: { full_name: n, to_email: e, college_name: c, course_name: courseName },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSent(true);
    } catch {
      setError("Something went wrong sending your certificate email. Please try again.");
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-2">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-extrabold mb-2">Certificate Request Sent!</h3>
            <p className="text-sm text-gray-600 mb-5">We've emailed your {courseName} certificate details to {email.trim()}.</p>
            <button className="bg-black text-white rounded-lg py-2.5 px-6 font-semibold text-sm" onClick={onClose}>Close</button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-extrabold mb-1">Get Your {courseName} Certificate</h3>
            <p className="text-sm text-gray-600 mb-5">Fill in your details below and we'll email your certificate.</p>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input className={inputCls} placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input type="email" className={inputCls} placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1">College Name</label>
              <input className={inputCls} placeholder="Your College" value={college} onChange={(e) => setCollege(e.target.value)} />
            </div>
            <div className="text-red-600 text-xs mb-3">{error}</div>
            <div className="flex gap-3">
              <button className="flex-1 border border-gray-300 rounded-lg py-2.5 font-semibold text-sm" onClick={onClose}>Cancel</button>
              <button className="flex-1 bg-black text-white rounded-lg py-2.5 font-semibold text-sm" disabled={sending} onClick={submit}>
                {sending ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
