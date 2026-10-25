import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CertificateModal from "../components/modals/CertificateModal";
import { useApp } from "../context/AppContext";
import { LESSONS_DATA } from "../data/lessons";
import { PATHS } from "../utils/paths";
import { isDone } from "../utils/progress";

const BACK_PATH = {
  HTML: PATHS.track.html,
  CSS: PATHS.track.css,
  JavaScript: PATHS.track.js,
  "Medical Coding": PATHS.medical,
};

function CertificateDoc({ courseName, onBack }) {
  const { user } = useApp();
  const d = new Date();
  const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const certId = `CL-${courseName.slice(0, 4).toUpperCase()}-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="cl-cert-doc">
        <div className="cl-cert-logo">Rightway <span>Skill Builder</span></div>
        <div className="cl-cert-eyebrow">{courseName} Certificate</div>
        <div className="cl-cert-name">{user?.name || "Rightway Skill Builder Student"}</div>
        <div className="cl-cert-course">has successfully completed the {courseName} learning path</div>
        <div className="cl-cert-meta-row">
          <div className="cl-cert-meta"><div className="lbl">Date</div><div className="val">{dateStr}</div></div>
          <div className="cl-cert-meta"><div className="lbl">ID</div><div className="val">{certId}</div></div>
        </div>
        <div className="cl-cert-sign-line"></div>
        <div className="cl-cert-sign-label">Instruction Team</div>
      </div>
      <div className="flex gap-3 mt-6">
        <button className="border border-gray-300 px-5 py-2.5 rounded-lg font-semibold text-sm" onClick={onBack}>Back</button>
        <button className="bg-black text-white px-5 py-2.5 rounded-lg font-semibold text-sm" onClick={() => window.print()}>⬇ Download</button>
      </div>
    </div>
  );
}

// Lesson list + progress for one of the HTML / CSS / JavaScript tracks.
export default function TrackDashboardPage({ courseName, statusKey, total, startId, nextPath }) {
  const app = useApp();
  const navigate = useNavigate();
  const [certDoc, setCertDoc] = useState(false);
  const [certModal, setCertModal] = useState(false);

  const statusArr = app[statusKey];
  const done = statusArr.reduce((acc, s) => acc + (isDone(s) ? 1 : 0), 0);
  const percent = Math.round((done / total) * 100);
  const allCompleted = done === total;

  if (allCompleted && certDoc) {
    return <CertificateDoc courseName={courseName} onBack={() => navigate(BACK_PATH[courseName] || PATHS.graphicDesign)} />;
  }

  let nextIndex = 0;
  for (let i = 0; i < total; i++) {
    if (!isDone(statusArr[i])) {
      nextIndex = i;
      break;
    }
  }
  const nextLessonId = startId + nextIndex;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
      <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition mb-4" onClick={() => navigate(PATHS.home)}>
        <span>← Back to Courses</span>
      </button>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold text-gray-900">{courseName} Course</h1>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${allCompleted ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
          {done} / {total} Lessons
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4">{done} of {total} lessons complete — {percent}%</p>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-black transition-all duration-300" style={{ width: `${percent}%` }}></div>
      </div>

      {statusArr.map((s, i) => {
        const lessonId = startId + i;
        const lesson = LESSONS_DATA.find((l) => l.id === lessonId);
        const complete = isDone(s);
        const locked = i > 0 && !isDone(statusArr[i - 1]) && !complete;
        return (
          <div
            key={lessonId}
            className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl ${complete ? "bg-emerald-50 text-emerald-900 border border-emerald-100" : "bg-gray-50 border border-gray-100 text-gray-800"} mb-1.5 ${locked ? "opacity-50" : "cursor-pointer hover:bg-gray-100 transition"}`}
            onClick={locked ? undefined : () => navigate(PATHS.lesson(lessonId))}
          >
            <span className="text-sm font-medium">Lesson {i + 1}{lesson ? `: ${lesson.title}` : ""}</span>
            <span className="text-xs font-semibold">{complete ? "✅ Done" : locked ? "🔒 Locked" : "▶️ Start"}</span>
          </div>
        );
      })}

      {allCompleted ? (
        <div className="flex gap-3 flex-wrap mt-6">
          <button className="bg-black text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition" onClick={() => navigate(nextPath)}>
            Continue to next course →
          </button>
          <button className="border border-gray-300 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition" onClick={() => setCertDoc(true)}>
            👁 View Certificate
          </button>
          <button className="border border-gray-300 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition" onClick={() => setCertModal(true)}>
            🏆 Get Certificate
          </button>
        </div>
      ) : (
        <button className="bg-black text-white px-5 py-2.5 rounded-lg font-semibold text-sm mt-6 hover:bg-gray-800 transition" onClick={() => navigate(PATHS.lesson(nextLessonId))}>
          Continue Lesson {nextIndex + 1} →
        </button>
      )}

      {certModal && <CertificateModal courseName={courseName} onClose={() => setCertModal(false)} />}
    </div>
  );
}
