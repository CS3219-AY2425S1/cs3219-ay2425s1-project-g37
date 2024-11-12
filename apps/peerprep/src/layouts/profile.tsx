import { Avatar } from "@peerprep/ui/avatar";
import { useAuth } from "@peerprep/utils/client";
import { Outlet, type UIMatch, useMatches } from "react-router-dom";

export default function ProfileLayout() {
  const { data: user } = useAuth();
  const matches = useMatches() as UIMatch<unknown, { title: string }>[];

  if (!user) return null;

  const [title] = matches
    .filter(match => Boolean(match.handle?.title))
    .map(match => match.handle.title);

  return (
    <main className="flex flex-row items-start justify-center gap-6">
      <div className="sticky top-12 flex w-full max-w-72 flex-col gap-6">
        <h1 className="text-main-50 text-2xl">{title}</h1>
        <div className="flex flex-row items-center gap-6">
          <Avatar imageUrl={user.imageUrl} username={user.username} className="size-16 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <div className="text-main-50 truncate text-lg">@{user.username}</div>
            <div className="text-main-500 truncate">{user.email}</div>
            <div className="text-main-500 mt-1.5 text-xs">
              Member since {user.createdAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-lg">
        <Outlet />
      </div>
    </main>
  );
}
