// Full lesson list: 1-28 HTML/CSS/JS (code lessons), 29-43 Medical Coding, 44-55 Graphic Design.
import { BASE_LESSONS } from "./baseLessons";
import MEDICAL_LEVELS_DATA from "./medicalLevels.json";
import GRAPHIC_DESIGN_LEVELS_DATA from "./graphicDesignLevels.json";

const toQuiz = (lvl) => ({
  passMark: 70,
  questions: (lvl.mcqs || []).map((m) => ({
    q: m.q,
    options: m.options,
    correct: m.options[m.answer],
  })),
});

const medicalLessons = MEDICAL_LEVELS_DATA.map((lvl, i) => ({
  id: 29 + i,
  title: `Level ${lvl.levelNumber || i + 1}`,
  desc: `Level ${lvl.levelNumber}: Master foundational anatomical structures, organ physiology, and clinical documentation conventions.`,
  tagsToLearn: "ANATOMY & PHYSIOLOGY",
  topic: `Level ${lvl.levelNumber || i + 1}`,
  levelNumber: lvl.levelNumber,
  videoUrl: lvl.videoUrl,
  theoryHtml: lvl.theoryHtml,
  notice: lvl.notice,
  cards: [
    {
      tag: "THEORY & CONCEPTS",
      title: `Level ${lvl.levelNumber}`,
      explanation: "Study the key anatomical terms (underlined), clinical examples (purple), and physiological functions (blue).",
      exampleCode: "<!-- Level " + lvl.levelNumber + " -->",
      preview: null,
    },
  ],
  practice: {
    desc: "Study the theory and complete the video lesson walkthrough.",
    reqs: ["Study the theory paragraph", "Watch the video lesson"],
    starterCode: "",
    validateFn: null,
  },
  quiz: toQuiz(lvl),
}));

const graphicDesignLessons = GRAPHIC_DESIGN_LEVELS_DATA.map((lvl, i) => ({
  id: 44 + i,
  title: `Level ${lvl.levelNumber || i + 1}`,
  desc: `Level ${lvl.levelNumber}. Master professional vector tools, shortcuts, and digital artwork creation in Adobe Illustrator.`,
  tagsToLearn: "GRAPHIC DESIGN & ILLUSTRATOR",
  topic: `Level ${lvl.levelNumber || i + 1}`,
  levelNumber: lvl.levelNumber,
  videoUrl: lvl.videoUrl,
  theoryHtml: lvl.theoryHtml,
  notice: lvl.notice,
  cards: [
    {
      tag: "GRAPHIC DESIGN THEORY",
      title: `Level ${lvl.levelNumber}`,
      explanation: "Study the design fundamentals, tools, workflows, and keyboard shortcuts.",
      exampleCode: "<!-- Level " + lvl.levelNumber + " -->",
      preview: null,
    },
  ],
  practice: {
    desc: "Study the theory and complete the video demonstration walkthrough.",
    reqs: ["Study the theory and shortcut references", "Watch the video lesson walkthrough"],
    starterCode: "",
    validateFn: null,
  },
  quiz: toQuiz(lvl),
}));

export const LESSONS_DATA = [...BASE_LESSONS, ...medicalLessons, ...graphicDesignLessons];

export const getLesson = (id) => LESSONS_DATA.find((l) => l.id === id);

export const MEDICAL_FIRST_ID = 29;
export const MEDICAL_LAST_ID = 43;
export const GRAPHIC_FIRST_ID = 44;
export const GRAPHIC_LAST_ID = 55;
