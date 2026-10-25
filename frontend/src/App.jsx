import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Toast from "./components/Toast";
import TopNav from "./components/TopNav";
import ContactModal from "./components/modals/ContactModal";
import CourseModal from "./components/modals/CourseModal";
import InfoModal from "./components/modals/InfoModal";
import ProfileModal from "./components/modals/ProfileModal";
import { AppProvider, useApp } from "./context/AppContext";
import AdminPage from "./pages/AdminPage";
import CertificatePage from "./pages/CertificatePage";
import CourseIntroPage from "./pages/CourseIntroPage";
import CourseSelectPage from "./pages/CourseSelectPage";
import GenericLessonPage from "./pages/GenericLessonPage";
import LessonPage from "./pages/LessonPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import TrackDashboardPage from "./pages/TrackDashboardPage";
import { PATHS } from "./utils/paths";

const AUTH_PATHS = [PATHS.login, PATHS.signup, PATHS.verifyEmail];

// Shell shared by every page: toast, top bar, and the global modals.
function Layout() {
  const { toast, activeModal, closeModal, setActiveModal } = useApp();
  const { pathname } = useLocation();

  // Navigating closes any open modal, or automatically opens profile modal if requested after auth/signup
  useEffect(() => {
    const shouldOpenProfile = sessionStorage.getItem("openProfileAfterAuth") === "true";
    if (shouldOpenProfile) {
      sessionStorage.removeItem("openProfileAfterAuth");
      setActiveModal("profile");
    } else {
      closeModal();
    }
    window.scrollTo(0, 0);
  }, [pathname, closeModal, setActiveModal]);

  return (
    <div className="cl-root">
      <Toast toast={toast} />
      {!AUTH_PATHS.includes(pathname) && <TopNav />}
      <Outlet />
      {activeModal === "contact" && <ContactModal />}
      {activeModal === "info" && <InfoModal />}
      {activeModal === "profile" && <ProfileModal />}
      {activeModal && activeModal.type === "course" && <CourseModal courseId={activeModal.courseId} />}
    </div>
  );
}

// /medical and /graphic-design entry redirects
function DirectEntry({ to }) {
  return <Navigate to={to} replace />;
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path={PATHS.home} element={<CourseSelectPage />} />
            <Route path={PATHS.login} element={<LoginPage />} />
            <Route path={PATHS.signup} element={<SignupPage />} />
            <Route path={PATHS.verifyEmail} element={<VerifyEmailPage />} />

            <Route path="/course/:courseId" element={<CourseIntroPage />} />
            <Route path="/course/:courseId/level/:levelNum" element={<GenericLessonPage />} />

            <Route path={PATHS.track.html} element={<TrackDashboardPage courseName="HTML" statusKey="statuses" total={10} startId={1} nextPath={PATHS.track.css} />} />
            <Route path={PATHS.track.css} element={<TrackDashboardPage courseName="CSS" statusKey="cssStatuses" total={12} startId={11} nextPath={PATHS.track.js} />} />
            <Route path={PATHS.track.js} element={<TrackDashboardPage courseName="JavaScript" statusKey="jsStatuses" total={6} startId={23} nextPath={PATHS.medical} />} />

            <Route path="/lesson/:lessonId" element={<LessonPage />} />
            <Route path={PATHS.certificate} element={<CertificatePage />} />
            <Route path={PATHS.admin} element={<AdminPage />} />

            <Route path="/medical" element={<DirectEntry to={PATHS.medical} />} />
            <Route path="/graphic-design" element={<DirectEntry to={PATHS.graphicDesign} />} />

            <Route path="*" element={<Navigate to={PATHS.home} replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
