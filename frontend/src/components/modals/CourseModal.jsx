import { useCourseNav } from "../../hooks/useCourseNav";
import { useApp } from "../../context/AppContext";
import { RIGHTWAY_COURSES } from "../../data/courses";
import CourseImage from "../CourseImage";

export default function CourseModal({ courseId }) {
  const { enrolledCourses, closeModal, setActiveModal, enrollInCourse } = useApp();
  const { startCourse } = useCourseNav();
  const c = RIGHTWAY_COURSES.find((item) => item.id === courseId);
  if (!c) return null;
  const isEnrolled = enrolledCourses.includes(courseId);

  return (
    <div className="rw-modal-backdrop" onClick={closeModal}>
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-red-500 relative" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-black h-40">
          <CourseImage course={c} className="w-full h-full object-cover" />
          <button className="absolute top-3 right-3 text-white bg-black/60 hover:bg-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg" onClick={closeModal}>
            &times;
          </button>
          <span className="absolute bottom-3 left-3 bg-red-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">{c.category}</span>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-extrabold text-red-600">{c.title}</h3>
            <span className="text-xs font-semibold bg-gray-100 px-2.5 py-1 rounded-full text-gray-700">{c.duration}</span>
          </div>

          <p className="text-xs text-gray-700 mb-4 leading-relaxed">{c.desc}</p>

          <div className="mb-4">
            <div className="text-xs font-bold text-gray-900 mb-2">Key Modules & Skills:</div>
            <div className="grid grid-cols-2 gap-2">
              {c.topics.map((t) => (
                <div key={t} className="text-[11px] bg-red-50 text-red-800 border border-red-100 rounded-lg px-2.5 py-1 font-medium flex items-center gap-1.5">
                  <span className="text-red-500 font-bold">▸</span> {t}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-5 flex items-center gap-2">
            <span>🛠 Tools:</span>
            <span className="font-semibold text-gray-800">{c.tools}</span>
          </div>

          <div className="flex gap-2">
            {c.isReady ? (
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-sm active:scale-95"
                onClick={() => {
                  closeModal();
                  startCourse(c.id);
                }}
              >
                Launch Course Now &rarr;
              </button>
            ) : (
              <button
                className={`flex-1 ${isEnrolled ? "bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"} font-bold text-xs py-2.5 rounded-lg transition shadow-sm active:scale-95`}
                onClick={() => enrollInCourse(c.id)}
              >
                {isEnrolled ? "✓ Enrolled in Track" : "Enroll & Start Learning"}
              </button>
            )}
            <button
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-lg transition"
              onClick={() => setActiveModal("contact")}
            >
              Ask Counselor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
