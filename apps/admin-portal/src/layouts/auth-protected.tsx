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
import { getOrigin, useAuth, useLogout } from "@peerprep/utils/client";
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
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={getOrigin("frontend")}>
              PeerPrep app
              <ArrowUpRight />
            </Link>
          </DropdownMenuItem>
          {/* TODO */}
          <DropdownMenuItem>
            User settings
            <ArrowUpRight />
          </DropdownMenuItem>
        </DropdownMenuGroup>
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
  if (user === null || !user.isAdmin) return <Navigate to="/login" />;
  return (
    <div>
      <nav className="container flex flex-row justify-between py-6">
        <NavLogo />
        <NavAvatar />
      </nav>
      <main className="container py-6 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
