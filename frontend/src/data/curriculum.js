import MEDICAL_LEVELS_DATA from "./medicalLevels.json";
import GRAPHIC_DESIGN_LEVELS_DATA from "./graphicDesignLevels.json";

// Rightway Skill Builder - Comprehensive Course Curriculums & Level Definitions
// Strict requirement: Only display "Level 1", "Level 2", etc. No descriptive topic headings.

export function generateCourseLevels(count = 15) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Level ${i + 1}`,
    topic: `Level ${i + 1}`
  }));
}

export const COURSES_CURRICULUM_DATA = {
  medical_coding: {
    title: "Medical Code",
    sessionName: "medical coding",
    category: "Healthcare Informatics",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/uBGl2BujkPQ",
    levels: generateCourseLevels(15)
  },

  graphic_design: {
    title: "Graphic Design",
    sessionName: "graphic design",
    category: "Creative Media",
    totalLevels: 100,
    videoUrl: "https://player.cloudinary.com/embed/?cloud_name=rsjsxs77&public_id=Lesson%201",
    levels: generateCourseLevels(12)
  },

  ui_ux_design: {
    title: "UI/UX Design",
    sessionName: "UI/UX design",
    category: "Product Design",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/c9Wg6Cb_YlU",
    levels: generateCourseLevels(15)
  },

  ui_ux_architect: {
    title: "UI/UX Architect",
    sessionName: "UI/UX architecture",
    category: "System Design",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/c9Wg6Cb_YlU",
    levels: generateCourseLevels(15)
  },

  industrial_design: {
    title: "Industrial Design",
    sessionName: "industrial design",
    category: "Product & 3D",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/2t0r1q5lW_Q",
    levels: generateCourseLevels(15)
  },

  python: {
    title: "Python",
    sessionName: "Python programming",
    category: "Programming",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/_uQrJ0TkZlc",
    levels: generateCourseLevels(15)
  },

  machine_learn: {
    title: "Machine Learn",
    sessionName: "machine learning",
    category: "Artificial Intelligence",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/ukzFI9rgwfU",
    levels: generateCourseLevels(15)
  },

  python_ml: {
    title: "Python & ML",
    sessionName: "Python & ML",
    category: "Data Science & AI",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/ukzFI9rgwfU",
    levels: generateCourseLevels(15)
  },

  office_accounting: {
    title: "Office Accounting",
    sessionName: "office accounting",
    category: "Finance & Accounts",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/yYX4bvQSqbo",
    levels: generateCourseLevels(15)
  },

  tally: {
    title: "Tally",
    sessionName: "tally",
    category: "Business Software",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/14qfT5g5m1I",
    levels: generateCourseLevels(15)
  },

  excel: {
    title: "Excel",
    sessionName: "excel",
    category: "Business Productivity",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/Vl0H-qTclOg",
    levels: generateCourseLevels(15)
  },

  adobe_illustrator: {
    title: "Adobe Illustrator",
    sessionName: "adobe illustrator",
    category: "Graphic Design Suite",
    totalLevels: 100,
    videoUrl: "https://player.cloudinary.com/embed/?cloud_name=rsjsxs77&public_id=Lesson%201",
    levels: generateCourseLevels(15)
  },

  adobe_photoshop: {
    title: "Adobe Photoshop",
    sessionName: "adobe photoshop",
    category: "Digital Imaging",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/hJbJbXbQ2V4",
    levels: generateCourseLevels(15)
  },

  coreldraw: {
    title: "CorelDRAW",
    sessionName: "coreldraw",
    category: "Vector Illustration",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/gI8gP_lF5a0",
    levels: generateCourseLevels(15)
  }
};

export function getCourseDisplayInfo(courseId) {
  const c = COURSES_CURRICULUM_DATA[courseId];
  if (c) return c;
  
  // Pretty-print fallback
  const title = (courseId || "course")
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: title,
    sessionName: title.toLowerCase(),
    category: "Professional Training",
    totalLevels: 100,
    videoUrl: "https://www.youtube.com/embed/uBGl2BujkPQ",
    levels: generateCourseLevels(15)
  };
};

export function getCourseLevelData(courseId, levelNum) {
  // If specific data exists in medical_levels or graphic_design_levels, use that
  if (courseId === "medical_coding") {
    const medLvl = MEDICAL_LEVELS_DATA.find(l => l.id === levelNum);
    if (medLvl) return medLvl;
  }
  if (courseId === "graphic_design") {
    const gdLvl = GRAPHIC_DESIGN_LEVELS_DATA.find(l => l.id === levelNum);
    if (gdLvl) return gdLvl;
  }

  const course = getCourseDisplayInfo(courseId);
  const lvlName = `Level ${levelNum}`;
  const levelNumStr = String(levelNum).padStart(2, '0');

  return {
    id: levelNum,
    levelNumber: levelNumStr,
    title: lvlName,
    topic: lvlName,
    videoUrl: course.videoUrl || "https://www.youtube.com/embed/uBGl2BujkPQ",
    theoryHtml: `
      <p class="leading-relaxed text-gray-900 text-base mb-4">
        <strong class="text-red-600 text-lg">Level ${levelNum}</strong><br><br>
        Welcome to Level ${levelNum}. In this session, study the core theory and practical walkthrough to master the key skills and unlock the next level.
        Carefully examine each concept, follow standard procedures, and verify your results to achieve high accuracy and quality.
      </p>
      <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
        <div class="font-bold text-gray-900 mb-2">Key Competencies & Principles:</div>
        <ul class="list-disc list-inside space-y-1.5 text-gray-700 text-sm font-medium">
          <li>Systematic application of standard tools and techniques in Level ${levelNum}.</li>
          <li>Optimized shortcuts and streamlined execution patterns.</li>
          <li>Standard verification, quality control, and error prevention guidelines.</li>
        </ul>
      </div>
      <p class="text-sm text-gray-600">Review the documentation and study points carefully before attempting the assessment below.</p>
    `,
    notice: `Study the Level ${levelNum} theory and watch the video walkthrough above, then pass the 5-question task with at least 70% to complete Level ${levelNum} and unlock the next level.`,
    mcqs: [
      {
        q: `What is the primary objective of Level ${levelNum}?`,
        options: [
          `To establish standard operational excellence and master Level ${levelNum}`,
          `To bypass all safety and quality controls`,
          `To eliminate the need for systematic testing`,
          `To discard industry best practices`
        ],
        answer: 0
      },
      {
        q: `Which approach is considered best practice when completing Level ${levelNum}?`,
        options: [
          `Random trial and error without documentation`,
          `Structured methodology following core principles and verified steps`,
          `Skipping review steps to rush delivery`,
          `Ignoring project specifications`
        ],
        answer: 1
      },
      {
        q: `Why is thorough mastery of Level ${levelNum} essential for progress?`,
        options: [
          `It is not necessary for actual work`,
          `It only applies to theoretical research`,
          `It ensures accuracy, scalability, and adherence to industry standards`,
          `It makes file sizes larger`
        ],
        answer: 2
      },
      {
        q: `When verifying your output in Level ${levelNum}, what should you prioritize?`,
        options: [
          `Accuracy, quality consistency, and prompt compliance`,
          `Only completion speed regardless of errors`,
          `Omitting testing phases`,
          `Ignoring feedback criteria`
        ],
        answer: 0
      },
      {
        q: `What is the requirement to officially complete Level ${levelNum} and unlock the next level?`,
        options: [
          `Submit an empty answer form`,
          `Pass the knowledge assessment task with at least 70% accuracy`,
          `Wait 24 hours without taking action`,
          `Skip to the final task directly`
        ],
        answer: 1
      }
    ]
  };
}

