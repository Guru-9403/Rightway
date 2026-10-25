import { useParams } from "react-router-dom";
import { getLesson } from "../data/lessons";
import CodeLessonPage from "./CodeLessonPage";
import GraphicDesignLessonPage from "./GraphicDesignLessonPage";
import MedicalLessonPage from "./MedicalLessonPage";

// /lesson/:lessonId -> picks the lesson layout by id range (1-28 code, 29-43 medical, 44-55 graphic design).
export default function LessonPage() {
  const lessonId = parseInt(useParams().lessonId, 10);
  const lesson = getLesson(lessonId);

  if (!lesson) return <div className="p-10 text-center">Lesson not found.</div>;
  if (lessonId >= 29 && lessonId <= 43) return <MedicalLessonPage key={lessonId} lesson={lesson} />;
  if (lessonId >= 44 && lessonId <= 55) return <GraphicDesignLessonPage key={lessonId} lesson={lesson} />;
  return <CodeLessonPage key={lessonId} lesson={lesson} />;
}
