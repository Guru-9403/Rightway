import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { PATHS } from "../utils/paths";
import { trackPercent } from "../utils/progress";

// Full Stack certificate: unlocked once the HTML, CSS and JavaScript tracks are all complete.
export default function CertificatePage() {
  const { user, statuses, cssStatuses, jsStatuses, certificateId, certificateIssuedAt, requestCertificate } = useApp();
  const navigate = useNavigate();

  const allDone = trackPercent(statuses, 10) === 100 && trackPercent(cssStatuses, 12) === 100 && trackPercent(jsStatuses, 6) === 100;

  // Ask the backend for an official certificate id the first time this page is shown.
  useEffect(() => {
    if (allDone && !certificateId) requestCertificate();
  }, [allDone, certificateId, requestCertificate]);

  if (!allDone) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-extrabold mb-2">Certificate Locked</h1>
        <p className="text-gray-600">Complete all three courses (HTML, CSS, and JavaScript) to unlock your Full Stack certificate.</p>
      </div>
    );
  }

  const d = certificateIssuedAt ? new Date(certificateIssuedAt) : new Date();
  const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const certId = certificateId || `CL-FULL-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="cl-cert-doc">
        <div className="cl-cert-logo">Rightway <span>Skill Builder</span></div>
        <div className="cl-cert-eyebrow">Full Stack Developer Certificate</div>
        <div className="cl-cert-name">{user?.name || "Rightway Skill Builder Student"}</div>
        <div className="cl-cert-course">has successfully completed the HTML, CSS, and JavaScript learning paths</div>
        <div className="cl-cert-meta-row">
          <div className="cl-cert-meta"><div className="lbl">Date</div><div className="val">{dateStr}</div></div>
          <div className="cl-cert-meta"><div className="lbl">Verification ID</div><div className="val">{certId}</div></div>
        </div>
        <div className="cl-cert-sign-line"></div>
        <div className="cl-cert-sign-label">Instruction Team</div>
      </div>
      <div className="flex gap-3 justify-center mt-6">
        <button className="border border-gray-300 px-5 py-2.5 rounded-lg font-semibold text-sm" onClick={() => navigate(PATHS.home)}>Back</button>
        <button className="bg-black text-white px-5 py-2.5 rounded-lg font-semibold text-sm" onClick={() => window.print()}>⬇ Download / Print</button>
      </div>
    </div>
  );
}
