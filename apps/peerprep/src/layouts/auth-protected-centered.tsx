import { Outlet } from "react-router-dom";

import { NavAvatar } from "~/components/nav-avatar";
import { NavLogo } from "~/components/nav-logo";

export default function AuthProtectedCenteredLayout() {
  return (
    <div className="flex h-screen flex-col">
      <nav className="container flex flex-shrink-0 flex-row justify-between py-6">
        <NavLogo />
        <NavAvatar />
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
