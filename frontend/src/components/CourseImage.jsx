import { useState } from "react";

// Course art lives in /images/courses; fall back to /images/cards, then to <id>_card.png.
export default function CourseImage({ course, className }) {
  const file = course.image || `${course.id}.jpeg`;
  const sources = [`/images/courses/${file}`, `/images/cards/${file}`, `/images/courses/${course.id}_card.png`];
  const [attempt, setAttempt] = useState(0);

  return (
    <img
      src={sources[attempt]}
      alt={course.title}
      className={className}
      onError={() => setAttempt((a) => (a < sources.length - 1 ? a + 1 : a))}
    />
  );
}
