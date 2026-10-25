// Route helpers. The vanilla app switched on a `screen` string; each screen now has a URL.

export const PATHS = {
  home: "/",
  login: "/login",
  signup: "/signup",
  verifyEmail: "/verify-email",
  certificate: "/certificate",
  admin: "/admin",
  course: (courseId) => `/course/${courseId}`,
  courseLevel: (courseId, level) => `/course/${courseId}/level/${level}`,
  lesson: (lessonId) => `/lesson/${lessonId}`,
  track: { html: "/track/html", css: "/track/css", js: "/track/js" },
  medical: "/course/medical_coding", // was "medical-dashboard"
  graphicDesign: "/course/graphic_design", // was "graphic-design-dashboard"
};

// Where "Continue" goes after finishing a lesson.
export function lessonNextPath(lessonId) {
  if (lessonId === 10) return PATHS.track.css;
  if (lessonId === 22) return PATHS.track.js;
  if (lessonId === 28) return PATHS.medical;
  if (lessonId === 43) return PATHS.graphicDesign;
  if (lessonId === 55) return PATHS.certificate;
  return PATHS.lesson(lessonId + 1);
}

// "Back to dashboard" target for the HTML/CSS/JS code lessons.
export function lessonBackPath(lessonId) {
  if (lessonId <= 10) return PATHS.track.html;
  if (lessonId <= 22) return PATHS.track.css;
  if (lessonId <= 28) return PATHS.track.js;
  return PATHS.medical;
}
