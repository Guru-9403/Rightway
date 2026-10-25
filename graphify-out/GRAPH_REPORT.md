# Graph Report - rightway-react  (2026-10-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 298 nodes · 641 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- baseLessons.js
- AppContext.jsx
- server.js
- validators.js
- useApp
- frontend/package.json
- react
- AdminPage.jsx
- backend/package.json

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 43 edges
2. `AppProvider()` - 21 edges
3. `react` - 19 edges
4. `checkSyntaxError()` - 17 edges
5. `react-router-dom` - 17 edges
6. `useCourseNav()` - 15 edges
7. `PATHS` - 15 edges
8. `getCourseProgress()` - 12 edges
9. `isDone()` - 11 edges
10. `hasTagFn()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `QuizSection()` --calls--> `useApp()`  [EXTRACTED]
  frontend/src/pages/GenericLessonPage.jsx → frontend/src/context/AppContext.jsx
- `Quiz()` --calls--> `useApp()`  [EXTRACTED]
  frontend/src/pages/CodeLessonPage.jsx → frontend/src/context/AppContext.jsx
- `QuizSection()` --calls--> `useApp()`  [EXTRACTED]
  frontend/src/pages/MedicalLessonPage.jsx → frontend/src/context/AppContext.jsx
- `AppProvider()` --calls--> `getToken()`  [EXTRACTED]
  frontend/src/context/AppContext.jsx → frontend/src/api/client.js
- `AppProvider()` --calls--> `getLesson()`  [EXTRACTED]
  frontend/src/context/AppContext.jsx → frontend/src/data/lessons.js

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "baseLessons.js"
Cohesion: 0.05
Nodes (42): BASE_LESSONS, L10_QUIZ, L11_QUIZ, L12_QUIZ, L13_QUIZ, L14_QUIZ, L15_QUIZ, L16_QUIZ (+34 more)

### Community 1 - "AppContext.jsx"
Cohesion: 0.13
Nodes (37): clearToken(), setToken(), AppContext, AppProvider(), DEFAULTS, freshQuiz(), GUEST_USER, withSlot() (+29 more)

### Community 2 - "server.js"
Cohesion: 0.07
Nodes (32): DIST_DIR, fs, http, isFile(), mimeTypes, path, safeJoin(), send() (+24 more)

### Community 3 - "validators.js"
Cohesion: 0.09
Nodes (18): validateAttributesTask(), validateBillingTask(), validateCptTask(), validateElementsTask(), validateFormsTask(), validateHcpcsTask(), validateHeadingsTask(), validateIcd10Task() (+10 more)

### Community 4 - "useApp"
Cohesion: 0.14
Nodes (22): AUTH_PATHS, DIRECT_ENTRY_USER, DirectEntry(), Layout(), CourseImage(), GoogleIcon(), CertificateModal(), CourseModal() (+14 more)

### Community 5 - "frontend/package.json"
Cohesion: 0.06
Nodes (29): dependencies, firebase, react, react-dom, react-router-dom, description, devDependencies, autoprefixer (+21 more)

### Community 6 - "react"
Cohesion: 0.17
Nodes (20): CodeEditor(), VideoTheaterModal(), getLesson(), VALIDATORS, CodeLessonPage(), consoleHook(), LEVEL_COLOR, Quiz() (+12 more)

### Community 7 - "AdminPage.jsx"
Cohesion: 0.11
Nodes (14): api, apiFetch(), authHeaders(), getToken(), ContactModal(), API_BASE_URL, EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID (+6 more)

### Community 8 - "backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, main, name, private, scripts, start (+1 more)

## Knowledge Gaps
- **94 isolated node(s):** `L10_QUIZ`, `L11_QUIZ`, `L12_QUIZ`, `L13_QUIZ`, `L14_QUIZ` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 127 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `AppContext.jsx`, `useApp`, `frontend/package.json`, `AdminPage.jsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `useApp()` connect `useApp` to `AppContext.jsx`, `react`, `AdminPage.jsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `react-router-dom` connect `react` to `AppContext.jsx`, `useApp`, `frontend/package.json`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `L10_QUIZ`, `L11_QUIZ`, `L12_QUIZ` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `baseLessons.js` be split into smaller, more focused modules?**
  _Cohesion score 0.048625792811839326 - nodes in this community are weakly interconnected._
- **Should `AppContext.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1273532668881506 - nodes in this community are weakly interconnected._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06685633001422475 - nodes in this community are weakly interconnected._