import { useAuth } from "@peerprep/utils/client";
import { Navigate, Outlet } from "react-router-dom";

// Redirect away from this layout if the user is not authenticated
export default function AuthProtectedEmptyLayout() {
  const { data: user } = useAuth();
  if (user === undefined) return null; // loading state
  if (user === null) return <Navigate to="/login" />;
  return <Outlet />;
}
