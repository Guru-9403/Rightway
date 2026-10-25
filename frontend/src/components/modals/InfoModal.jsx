import { useApp } from "../../context/AppContext";

export default function InfoModal() {
  const { closeModal } = useApp();
  return (
    <div className="rw-modal-backdrop" onClick={closeModal}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-500 relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" onClick={closeModal}>
          &times;
        </button>

        <div className="flex items-center gap-2 mb-2">
          <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className="text-lg font-extrabold text-red-600">Rightway Skill Builder</h3>
        </div>

        <p className="text-xs text-gray-700 mb-4 leading-relaxed">
          <strong>Rightway Skill Builder Development Area</strong> provides hands-on practical education across 14 high-demand professional disciplines.
        </p>

        <div className="space-y-2.5 text-xs text-gray-600 mb-5">
          {[
            ["14 Industry Tracks:", "UI/UX, Graphic Design, Python, ML, Medical Coding, Tally Prime, Excel, Accounting, and Design Suites."],
            ["Practical & Video-Guided:", "Real-world tasks, video tutorials, and interactive validation."],
            ["Verifiable Certificates:", "Earn authentic completion certificates with verifiable credentials."],
            ["Instructor Guidance:", "Direct contact and mentoring whenever you need support."],
          ].map(([title, text]) => (
            <div key={title} className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <strong>{title}</strong> {text}
              </div>
            </div>
          ))}
        </div>

        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition" onClick={closeModal}>
          Got It, Explore Courses!
        </button>
      </div>
    </div>
  );
}
