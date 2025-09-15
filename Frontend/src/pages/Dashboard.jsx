import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case "buyer":
        navigate("/buyer/dashboard", { replace: true });
        break;
      case "farmer":
        navigate("/farmer/dashboard", { replace: true });
        break;
      case "fpo":
        navigate("/fpo/dashboard", { replace: true });
        break;
      default:
        navigate("/unauthorized", { replace: true });
        break;
    }
  }, [user, navigate]);

  return (
    <div className="p-4 text-center text-gray-700">
      Redirecting to your dashboard...
    </div>
  );
}
