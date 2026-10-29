import { api } from "../api/client";

const isSupportedProtocol = ["http:", "https:", "chrome-extension:"].includes(window.location.protocol);

let pending = null;

// Firebase credentials are loaded from the backend (.env) instead of being bundled.
export function initFirebase() {
  if (pending) return pending;
  if (!isSupportedProtocol) return Promise.resolve(null);

  pending = (async () => {
    try {
      const res = await api.firebaseConfig();
      if (res.ok) {
        const config = await res.json();
        if (!config || !config.apiKey || config.apiKey.trim() === "") {
          return null;
        }
        // Loaded on demand so the Firebase SDK stays out of the main bundle.
        const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup }] = await Promise.all([
          import("firebase/app"),
          import("firebase/auth"),
        ]);
        const app = getApps().length ? getApps()[0] : initializeApp(config);
        return { auth: getAuth(app), provider: new GoogleAuthProvider(), signInWithPopup };
      }
    } catch (err) {
      console.warn("Could not load Firebase configuration from backend:", err);
    }
    return null;
  })().then((result) => {
    if (!result) pending = null; // allow a retry on the next click
    return result;
  });
  return pending;
}

// Opens the Google popup and returns the Firebase ID token, or null when Firebase is unavailable.
export async function googleIdToken() {
  const fb = await initFirebase();
  if (!fb) return null;
  const result = await fb.signInWithPopup(fb.auth, fb.provider);
  return result.user.getIdToken();
}
