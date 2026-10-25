# Rightway Skill Builder (React)

Converted from the vanilla HTML/CSS/JS app in `rightway.zip` into a React frontend plus a small backend.

```
rightway-react/
├─ frontend/   React 18 + Vite + Tailwind (all the UI)
├─ backend/    Node server: serves the built frontend + lesson videos
└─ tools/      one-off image scripts from the original zip (not used by the app)
```

## Run it

Development (hot reload):

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Production-style (what `server.js` did before):

```bash
cd frontend && npm install && npm run build
cd ../backend && npm start     # http://127.0.0.1:5500
```

## Configuration

Copy `frontend/.env.example` to `frontend/.env`. It holds the API base URL (`VITE_API_BASE_URL`) and the EmailJS keys.
These replace the commented-out lines that used to live in `config.js`.

The API itself (auth, progress, certificates, admin) is **not** in the zip. The app talks to the hosted service at
`https://rwbackend-wyvm.onrender.com/api`; point `VITE_API_BASE_URL` elsewhere if you run your own.

## Where things moved

| Vanilla file | React location |
|---|---|
| `index.html`, `medical.html`, `graphic-design.html` | `frontend/index.html` + routes `/`, `/medical`, `/graphic-design` |
| `config.js` | `src/config/env.js`, `src/lib/firebase.js`, `src/api/client.js` |
| `app.js` (state, render functions) | `src/context/AppContext.jsx`, `src/pages/*`, `src/components/*` |
| `app.js` validators + highlighter | `src/data/validators.js`, `src/utils/htmlTools.js`, `src/utils/highlight.jsx` |
| `lessons.js` | `src/data/baseLessons.js` (HTML/CSS/JS) + `src/data/lessons.js` |
| `medical_levels.js`, `graphic_design_levels.js` | `src/data/medicalLevels.json`, `graphicDesignLevels.json` |
| `course_curriculum.js` | `src/data/curriculum.js` |
| `style.css` | `src/index.css` (Tailwind is now built, not loaded from the CDN) |
| `server.js` | `backend/server.js` |
| `images/` | `frontend/public/images/` (`New folder` duplicates and the reference sheet were left out) |

## Routes

`/` courses · `/login` · `/signup` · `/course/:id` · `/course/:id/level/:n` · `/track/html|css|js` ·
`/lesson/:id` (1–28 code, 29–43 medical, 44–55 graphic design) · `/certificate` · `/admin`

## Lesson videos

Graphic Design level N plays `/courses-videos/N.mp4` from `backend/videos/`, falling back to the Cloudinary embed.
The original `courses videos` folder was not in the zip, so add the MP4s there if you want local playback.
