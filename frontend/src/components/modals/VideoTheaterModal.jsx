import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLesson } from "../../data/lessons";
import { PATHS } from "../../utils/paths";

// Full-screen video player for a Graphic Design lesson. Plays the local MP4, falling back to the Cloudinary embed.
export default function VideoTheaterModal({ lessonId, onClose, onComplete }) {
  const navigate = useNavigate();
  const lesson = getLesson(lessonId);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!lesson) return null;
  const levelNum = lessonId - 43;
  const cloudUrl = lesson.videoUrl || `https://player.cloudinary.com/embed/?cloud_name=rsjsxs77&public_id=Lesson%20${levelNum}`;

  return (
    <div className="rw-modal-backdrop" onClick={onClose}>
      <div className="bg-black text-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-gray-800 relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
          <div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Level {levelNum} Video Lesson</span>
            <h3 className="text-base sm:text-lg font-bold text-white">Level {levelNum}</h3>
          </div>
          <button
            className="text-gray-400 hover:text-white text-2xl font-bold w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition cursor-pointer"
            title="Close Video (Esc)"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-800 shadow-2xl relative">
          {failed ? (
            <iframe className="w-full h-full" src={cloudUrl} title={`Level ${levelNum} video`} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen></iframe>
          ) : (
            <video className="w-full h-full" controls autoPlay playsInline src={`/courses-videos/${levelNum}.mp4`} onError={() => setFailed(true)} />
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-gray-800">
          <span className="text-xs text-gray-400">Click ✕ or press Esc to return to lesson notes</span>
          <div className="flex items-center gap-2 flex-wrap">
            {levelNum > 1 && (
              <button
                className="border border-gray-700 hover:bg-gray-800 text-gray-200 font-semibold text-xs px-3.5 py-2.5 rounded-lg transition cursor-pointer"
                onClick={() => {
                  onClose();
                  navigate(PATHS.lesson(lessonId - 1));
                }}
              >
                &larr; Previous Session
              </button>
            )}
            <button className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer" onClick={onClose}>
              Close Video
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-md cursor-pointer"
              onClick={() => {
                onClose();
                onComplete();
              }}
            >
              ✓ Mark as Completed & Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
