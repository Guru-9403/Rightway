import { useNavigate } from "react-router-dom";
import CourseImage from "../components/CourseImage";
import { useApp } from "../context/AppContext";
import { useCourseNav } from "../hooks/useCourseNav";
import { RIGHTWAY_COURSES } from "../data/courses";
import { PATHS } from "../utils/paths";
import { trackPercent } from "../utils/progress";

function WebTrackCard({ title, pct, onClick, colorClass, iconLabel }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition hover:-translate-y-0.5" onClick={onClick}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>{iconLabel}</div>
        <div>
          <h4 className="font-bold text-sm text-gray-900">{title}</h4>
          <span className="text-[11px] text-gray-500">{pct}% complete</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

export default function CourseSelectPage() {
  const { statuses, cssStatuses, jsStatuses, setActiveModal } = useApp();
  const { startCourse, requireAuthOrRedirect } = useCourseNav();
  const navigate = useNavigate();

  return (
    <div className="rw-landing">
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-5 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
            Welcome to our <span className="text-red-600 font-extrabold">Rightway Skill Builder</span> Development Area!
          </h1>
          <p className="text-xs sm:text-[13.5px] text-gray-800 mt-2 leading-relaxed">
            Here, you will find 14 types of useful courses. Choose that one that suits your needs and Start enhancing your skills, my dear friend. Rightway Skill Builder is always here to provide you with all the support and assistance you need. Why delayed? Choose Your preferred course today starts your professional journey.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-red-600">Choose your Course</h2>
          <span className="text-xs font-semibold text-gray-500 hidden sm:inline">14 Professional Tracks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-10">
          {RIGHTWAY_COURSES.map((c) => (
            <div key={c.id} className="rw-card group" onClick={() => setActiveModal({ type: "course", courseId: c.id })}>
              <div className="rw-card-img-wrap">
                <CourseImage course={c} className="rw-card-img" />
              </div>
              <div className="rw-card-divider"></div>
              <div className="rw-card-body">
                <h3 className="rw-card-title">{c.title}</h3>
                <button
                  className="rw-start-btn"
                  title="Start Course"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCourse(c.id);
                  }}
                >
                  Start &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Web Development Tracks</h3>
              <p className="text-xs text-gray-500">Interactive live code sandbox & validators for core web technologies</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <WebTrackCard
              title="HTML Track"
              pct={trackPercent(statuses, 10)}
              onClick={() => {
                if (!requireAuthOrRedirect(PATHS.track.html)) return;
                navigate(PATHS.track.html);
              }}
              colorClass="bg-orange-500"
              iconLabel="HTML"
            />
            <WebTrackCard
              title="CSS Track"
              pct={trackPercent(cssStatuses, 12)}
              onClick={() => {
                if (!requireAuthOrRedirect(PATHS.track.css)) return;
                navigate(PATHS.track.css);
              }}
              colorClass="bg-blue-500"
              iconLabel="CSS"
            />
            <WebTrackCard
              title="JavaScript Track"
              pct={trackPercent(jsStatuses, 6)}
              onClick={() => {
                if (!requireAuthOrRedirect(PATHS.track.js)) return;
                navigate(PATHS.track.js);
              }}
              colorClass="bg-yellow-500"
              iconLabel="JS"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
