import { env } from "@peerprep/env";
import type { Difficulty } from "@peerprep/schemas";
import { Button } from "@peerprep/ui/button";
import { cn } from "@peerprep/ui/cn";
import { FormControl } from "@peerprep/ui/form-control";
import { Link } from "@peerprep/ui/link";
import { QuestionDifficultyLabel } from "@peerprep/ui/question-difficulty-label";
import { useAuth, useQuestions, useUserHistory, useWsSubscription } from "@peerprep/utils/client";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useStopwatch } from "react-timer-hook";

function useTags() {
  const { data: questions } = useQuestions();
  if (!questions) return [];
  const tagsSet = new Set<string>();
  questions.forEach(question => question.tags.forEach(tag => tagsSet.add(tag)));
  return Array.from(tagsSet).sort();
}

function useMatchedQuestions(difficulties: Difficulty[], tags: string[]) {
  const { data: questions } = useQuestions();
  if (!questions) return [];
  return questions.filter(
    question =>
      (difficulties.length === 0 || difficulties.includes(question.difficulty)) &&
      (tags.length === 0 || tags.some(tag => question.tags.includes(tag))),
  );
}

function MatchmakingForm({
  difficulties,
  setDifficulties,
  selectedTags,
  setSelectedTags,
  onSubmit,
}: {
  difficulties: Difficulty[];
  setDifficulties: React.Dispatch<React.SetStateAction<Difficulty[]>>;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: () => void;
}) {
  const { data: user } = useAuth();
  const allTags = useTags();
  const matchedQuestions = useMatchedQuestions(difficulties, selectedTags);

  function toggleDifficulty(difficulty: Difficulty) {
    setDifficulties(prev =>
      prev.includes(difficulty) ? prev.filter(t => t !== difficulty) : [...prev, difficulty],
    );
  }

  function toggleTag(tag: string) {
    setSelectedTags(prevTags =>
      prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag],
    );
  }

  if (!user || !allTags.length) return null;

  return (
    <form
      className="bg-main-900 flex flex-col gap-6 overflow-auto p-12"
      onSubmit={async e => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="text-main-50 text-2xl">Match a new session</h2>
      <p>
        Select the filtering criteria below and we will match you with a fellow user to collaborate
        on a problem.
      </p>
      <div className="flex flex-col gap-1.5">
        <FormControl label="Difficulty" />
        <div className="flex flex-row flex-wrap gap-1.5">
          {(["EASY", "MEDIUM", "HARD"] satisfies Difficulty[]).map(difficulty => (
            <button
              type="button"
              className={cn(
                "block px-3 py-1 text-sm",
                difficulties.includes(difficulty) ? "bg-main-600 text-main-50" : "bg-main-800",
              )}
              key={difficulty}
              onClick={() => toggleDifficulty(difficulty)}
            >
              {difficulty === "EASY" ? "Easy" : difficulty === "MEDIUM" ? "Medium" : "Hard"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <FormControl
          label={
            <span className="flex flex-row gap-4">
              Topics
              {selectedTags.length > 0 ? (
                <button
                  type="button"
                  className="text-main-50 tracking-normal"
                  onClick={() => setSelectedTags([])}
                >
                  [Clear selection]
                </button>
              ) : null}
            </span>
          }
        />
        <div className="flex flex-row flex-wrap gap-1.5">
          {allTags.map(tag => (
            <button
              type="button"
              className={cn(
                "block px-3 py-1 text-sm",
                selectedTags.includes(tag) ? "bg-main-600 text-main-50" : "bg-main-800",
              )}
              key={tag}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <Button
        variants={{ variant: "primary" }}
        disabled={matchedQuestions.length <= 0}
        type="submit"
      >
        Start matching
      </Button>
      {matchedQuestions.length <= 0 ? (
        <p className="text-red-500">
          No questions match the selected difficulty and tags. Try changing the filters.
        </p>
      ) : null}
    </form>
  );
}

function CurrentActiveSessions() {
  const { data: user } = useAuth();
  if (!user) throw new Error("invariant: user is undefined");

  const { data: history } = useUserHistory(user.id);
  if (!history) return null;

  const activeRooms = history.filter(room => !room.alreadyStale);
  if (!activeRooms.length) return null;

  return (
    <div className="bg-main-900 flex flex-col gap-6 p-12 pb-6">
      <h2 className="text-main-50 text-2xl">Active sessions</h2>
      <p>You can view the currently active session(s) that you are in, in the list below.</p>
      <ul className="-mr-12 flex flex-col">
        {activeRooms.map(room => {
          const collaborator = room.users.find(u => u.id !== user.id)!;
          return (
            <li key={room.id}>
              <Link
                href={`/room/${room.id}`}
                className="border-main-800 flex flex-col gap-1.5 border-t py-6 pr-12"
              >
                <h3 className="line-clamp-2 text-lg text-white">{room.question.title}</h3>
                <div className="flex flex-row items-center justify-between gap-6">
                  <QuestionDifficultyLabel difficulty={room.question.difficulty} />
                  <div className="text-main-500 text-sm">
                    With <span className="text-main-300">@{collaborator.username}</span>, on{" "}
                    {room.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LoadingScreen({ onAbort }: { onAbort: () => void }) {
  const { seconds, minutes } = useStopwatch({ autoStart: true });
  return (
    <div className="flex w-full flex-row justify-center px-6 py-12">
      <div className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-12">
        <div className="flex items-center justify-center">
          <div className="border-main-50 h-16 w-16 animate-spin rounded-full border-2 border-b-transparent border-t-transparent"></div>
        </div>
        <h1 className="text-main-50 text-center text-2xl">Matching in progress...</h1>
        <p className="text-center">
          You will be redirected to the room when you are matched with a collaborator. Closing the
          tab will abort matching.
        </p>
        <div className="text-center">
          Time taken: {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
        </div>
        <div className="flex justify-center">
          <Button variants={{ variant: "secondary" }} onClick={onAbort}>
            Abort
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({
  title,
  message,
  onRetry,
  onExit,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex w-full flex-row justify-center px-6 py-12">
      <div className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-12">
        <h1 className="text-main-50 text-center text-2xl">{title}</h1>
        <p className="text-center">{message}</p>
        <div className="grid grid-cols-2 gap-6">
          <Button onClick={onRetry} variants={{ variant: "primary" }}>
            Retry
          </Button>
          <Button onClick={onExit} variants={{ variant: "secondary" }}>
            Change filters
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function IndexPage() {
  const ws = useWsSubscription<
    { type: "match"; difficulties: Difficulty[]; tags: string[] } | { type: "abort" },
    | { type: "success"; matched: [string, string]; questionId: string; roomId: string }
    | { type: "acknowledgement" }
    | { type: "error"; title: string; message: string }
  >(
    "matching:/",
    `${env.VITE_SELF_HOST ? "wss://peerprep.joulev.dev" : "ws://localhost:3000"}/api/matching`,
  );

  const { data: user } = useAuth();
  if (!user) throw new Error("invariant: user is undefined");

  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFormIfError, setShowFormIfError] = useState(true);

  if (!ws.isReady) return null;

  if (ws.data?.type === "error" && !showFormIfError)
    return (
      <ErrorScreen
        title={ws.data.title}
        message={ws.data.message}
        onRetry={() => ws.send({ type: "match", difficulties, tags: selectedTags })}
        onExit={() => setShowFormIfError(true)}
      />
    );

  if (!ws.data || ws.data.type === "error")
    return (
      <div className="mx-auto flex w-full max-w-[35rem] flex-col gap-6 px-6">
        <h2 className="text-main-50 text-3xl font-semibold">Welcome, @{user.username}!</h2>
        <CurrentActiveSessions />
        <MatchmakingForm
          difficulties={difficulties}
          setDifficulties={setDifficulties}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          onSubmit={() => {
            ws.send({ type: "match", difficulties, tags: selectedTags });
            setShowFormIfError(false);
          }}
        />
      </div>
    );

  if (ws.data.type === "acknowledgement")
    return <LoadingScreen onAbort={() => ws.send({ type: "abort" })} />;

  if (ws.data.type === "success") return <Navigate to={`/room/${ws.data.roomId}`} />;
}
