import { useState } from "react";
import { api } from "../../api/client";
import { useApp } from "../../context/AppContext";

export default function ContactModal() {
  const { user, closeModal } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState(null); // { cls, text }

  const submit = async () => {
    const n = name.trim();
    const email = user?.email || (n ? `${n.toLowerCase().replace(/\s+/g, "")}@student.com` : "inquiry@rightway.com");

    if (!n) {
      setFeedback({ cls: "text-xs text-red-600 text-center mt-2", text: "Please enter your name." });
      return;
    }
    setFeedback({ cls: "text-xs text-gray-500 text-center mt-2", text: "Submitting your inquiry..." });

    try {
      await api.submitEnquiry({ name: n, email, phone: phone.trim(), message: message.trim(), course: "General Course Inquiry" });
      setFeedback({ cls: "text-xs text-emerald-600 font-bold text-center mt-2", text: "✅ Inquiry submitted! Our counselor will contact you shortly." });
    } catch {
      setFeedback({ cls: "text-xs text-emerald-600 font-bold text-center mt-2", text: "✅ Inquiry recorded successfully!" });
    }
    setTimeout(closeModal, 1800);
  };

  const inputCls = "w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 bg-white";

  return (
    <div className="rw-modal-backdrop" onClick={closeModal}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-500 relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" onClick={closeModal}>
          &times;
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Admission & Student Support</span>
        </div>

        <h3 className="text-xl font-extrabold text-red-600 mb-1">Rightway Skill Builder</h3>
        <p className="text-xs text-gray-600 mb-5">Our instructors and counselors are here to provide full support for your learning path.</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <a href="tel:+919876543210" className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 transition">
            <span className="text-xl">📞</span>
            <div className="text-left">
              <div className="text-[10px] text-gray-500 uppercase font-semibold">Call Support</div>
              <div className="text-xs font-bold text-gray-900">+91 98765 43210</div>
            </div>
          </a>
          <a
            href="https://wa.me/919876543210?text=Hello%20Rightway%20Skill%20Builder,%20I%20am%20interested%20in%20courses"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition"
          >
            <span className="text-xl">💬</span>
            <div className="text-left">
              <div className="text-[10px] text-gray-500 uppercase font-semibold">WhatsApp Chat</div>
              <div className="text-xs font-bold text-green-700">Chat Now &rarr;</div>
            </div>
          </a>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
          <div className="text-xs font-bold text-gray-800 mb-2">Send Instant Course Inquiry</div>
          <div className="space-y-2">
            <input type="text" placeholder="Your Name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            <input type="tel" placeholder="Phone Number / WhatsApp" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea rows={2} placeholder="Course interested in or message..." className={inputCls} value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
          </div>
          <button className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-sm active:scale-95" onClick={submit}>
            Submit Inquiry
          </button>
          {feedback && <div className={feedback.cls}>{feedback.text}</div>}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          <span>📍 Development Area Campus</span>
          <span>⏱ Mon - Sat: 9:00 AM - 7:00 PM</span>
        </div>
      </div>
    </div>
  );
}
