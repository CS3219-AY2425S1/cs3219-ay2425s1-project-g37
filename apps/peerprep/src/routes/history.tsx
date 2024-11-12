import { LinkButton } from "@peerprep/ui/button";
import { Link } from "@peerprep/ui/link";
import { QuestionDifficultyLabel } from "@peerprep/ui/question-difficulty-label";
import { useAuth, useUserHistory } from "@peerprep/utils/client";

export default function HistoryPage() {
  const { data: user } = useAuth();
  if (!user) throw new Error("invariant: user is undefined");

  const { data: history } = useUserHistory(user.id);
  if (!history) return null;

  const staleRooms = history.filter(room => room.alreadyStale);

  if (history.length === 0) {
    return (
      <div className="bg-main-900 flex flex-col items-center gap-6 p-9">
        <div>It's empty in here. Go match with someone now!</div>
        <LinkButton href="/" variants={{ variant: "primary" }}>
          Start matching
        </LinkButton>
      </div>
    );
  }

  if (staleRooms.length === 0) {
    return (
      <div className="bg-main-900 flex flex-col items-center gap-6 p-9">
        <div>You have no stale rooms.</div>
        <LinkButton href="/" variants={{ variant: "primary" }} forceNativeAnchor>
          Check my currently active rooms
        </LinkButton>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-6">
      {staleRooms.map(room => {
        const collaborator = room.users.find(u => u.id !== user.id)!;
        return (
          <li key={room.id}>
            <Link href={`/room/${room.id}`} className="bg-main-900 flex flex-col gap-1.5 p-6">
              <h2 className="line-clamp-2 text-lg text-white">{room.question.title}</h2>
              <div className="flex flex-row items-center justify-between gap-6">
                <QuestionDifficultyLabel difficulty={room.question.difficulty} />
                <div className="text-main-500 text-sm">
                  With <span className="text-main-300">@{collaborator.username}</span>, last updated
                  on {room.updatedAt.toLocaleDateString()}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
