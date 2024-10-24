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

export function NavAvatar() {
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
