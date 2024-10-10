import { Navigate, Outlet } from "react-router-dom";

import { NavLogo } from "~/components/nav-logo";
import { useAuth } from "~/lib/auth";

// Redirect away from this layout if the user is authenticated
export default function PublicNotAuthLayout() {
  const { data: user } = useAuth();
  if (user === undefined) return null;
  if (user) return <Navigate to="/" />;
  return (
    <div className="flex h-screen w-screen flex-col justify-center">
      <nav className="container fixed inset-x-0 top-0 flex flex-row justify-between py-6">
        <NavLogo />
      </nav>
      <div className="flex w-full flex-row justify-center px-6 py-12">
        <Outlet />
      </div>
    </div>
  );
}
