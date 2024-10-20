import { Avatar } from "@peerprep/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@peerprep/ui/dropdown-menu";
import { Link } from "@peerprep/ui/link";
import { getOrigin } from "@peerprep/utils/client";
import { useAuth, useLogout } from "@peerprep/utils/client";
import { ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { Navigate, Outlet } from "react-router-dom";

import { NavLogo } from "~/components/nav-logo";

function NavAvatar() {
  const { data: user } = useAuth();
  const { trigger } = useLogout();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar imageUrl={user.imageUrl} username={user.username} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <div>Logged in as</div>
            <div className="max-w-full truncate text-base text-white">@{user.username}</div>
          </DropdownMenuLabel>
          <DropdownMenuItem>View profile</DropdownMenuItem>
          <DropdownMenuItem>User settings</DropdownMenuItem>
        </DropdownMenuGroup>
        {user.isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={getOrigin("admin-portal")}>
                  Admin portal
                  <ArrowUpRight />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <button
              onClick={async () => {
                await trigger();
                toast.success("Log out successfully. See you again!");
              }}
            >
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Redirect away from this layout if the user is not authenticated
export default function AuthProtectedLayout() {
  const { data: user } = useAuth();
  if (user === undefined) return null; // loading state
  if (user === null) return <Navigate to="/login" />;
  return (
    <div className="flex h-screen flex-col">
      <nav className="container flex flex-shrink-0 flex-row justify-between py-6">
        <NavLogo />
        <NavAvatar />
      </nav>
      <main className="container flex w-full flex-grow overflow-hidden py-6">
        <Outlet />
      </main>
    </div>
  );
}
