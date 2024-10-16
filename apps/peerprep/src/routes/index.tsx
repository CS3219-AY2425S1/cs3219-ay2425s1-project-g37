import { env } from "@peerprep/env";
import type { Difficulty } from "@peerprep/schemas";
import { Button } from "@peerprep/ui/button";
import { cn } from "@peerprep/ui/cn";
import { FormControl } from "@peerprep/ui/form-control";
import { useAuth, useQuestions, useWsSubscription } from "@peerprep/utils/client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
  onMatchmaking,
}: {
  onMatchmaking: (difficulties: Difficulty[], tags: string[]) => void;
}) {
  const { data: user } = useAuth();
  const allTags = useTags();
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
    <div className="flex w-full flex-row justify-center px-6 py-12">
      <form
        className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-12"
        onSubmit={async e => {
          e.preventDefault();
          onMatchmaking(difficulties, selectedTags);
        }}
      >
        <h1 className="text-main-50 text-2xl">Welcome, @{user.username}!</h1>
        <p>
          Select the filtering criteria below and we will match you with a fellow user to
          collaborate on a problem.
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
    </div>
  );
}

function LoadingScreen() {
  const { seconds, minutes, hours } = useStopwatch({ autoStart: true });
  return (
    <div className="flex w-full flex-row justify-center px-6 py-12">
      <div className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-12">
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-b-transparent border-t-transparent"></div>
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-white border-b-transparent border-t-transparent"></div>
        </div>
        <h1 className="text-main-50 text-center text-2xl">Matching in progress...</h1>
        <p className="text-center">
          You will be redirected to the room when you are matched with a collaborator. Closing the
          tab will abort matching.
        </p>
        <div className="text-center">
          <span>{hours < 10 ? `0${hours}` : hours}</span>:
          <span>{minutes < 10 ? `0${minutes}` : minutes}</span>:
          <span>{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>
        <div className="flex justify-center">
          <Button variants={{ variant: "secondary" }} type="submit">
            Abort
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function IndexPage() {
  const ws = useWsSubscription<
    { difficulties: Difficulty[]; tags: string[] },
    | { type: "success"; matched: [string, string]; questionId: string; roomId: string }
    | { type: "acknowledgement" }
    | { type: "timeout" }
  >("matching:/", `ws://localhost:${env.VITE_MATCHING_SERVICE_PORT}`);

  useEffect(() => {
    if (ws.data?.type === "timeout") toast.error("Timed out");
  }, [ws.data]);

  if (!ws.isReady) return null;

  function handleMatchmaking(difficulties: Difficulty[], tags: string[]) {
    ws.send({ difficulties, tags });
  }

  if (!ws.data || ws.data.type === "timeout")
    return <MatchmakingForm onMatchmaking={handleMatchmaking} />;

  if (ws.data.type === "acknowledgement") return <LoadingScreen />;

  if (ws.data.type === "success")
    return (
      <Navigate
        to={`/room/${ws.data.roomId}`}
        state={{
          matched: ws.data.matched,
          questionId: ws.data.questionId,
        }}
      />
    );
}
