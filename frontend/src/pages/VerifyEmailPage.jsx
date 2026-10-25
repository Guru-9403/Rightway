import { useLocation, useNavigate } from "react-router-dom";
import VerifyEmailCard from "../components/VerifyEmailCard";
import { PATHS } from "../utils/paths";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get("email") || location.state?.email || "";
  const emailSentParam = queryParams.get("emailSent") !== "false" && location.state?.emailSent !== false;
  const messageParam = queryParams.get("message") || location.state?.message || "";
  const returnToParam = queryParams.get("returnTo") || sessionStorage.getItem("returnTo") || "";

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-gray-50/50">
      <VerifyEmailCard
        initialEmail={emailParam}
        initialEmailSent={emailSentParam}
        initialMessage={messageParam}
        returnTo={returnToParam}
        onSuccess={(data, target) => {
          navigate(target || PATHS.home);
        }}
        onBack={() => {
          navigate(PATHS.login);
        }}
      />
    </div>
  );
}
