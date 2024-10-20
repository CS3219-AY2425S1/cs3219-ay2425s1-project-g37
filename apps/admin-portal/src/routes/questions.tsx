import { questions, t, validate } from "@peerprep/schemas/validators";
import { buttonVariants } from "@peerprep/ui/button-variants";
import { cn } from "@peerprep/ui/cn";
import { Link } from "@peerprep/ui/link";
import { QuestionDifficultyLabel } from "@peerprep/ui/question-difficulty-label";
import { useAddQuestions, useQuestions } from "@peerprep/utils/client";
import { Plus, Tags } from "lucide-react";
import { useRef } from "react";
import toast from "react-hot-toast";

const createSchema = t.Union([t.Array(questions.createSchema), questions.createSchema]);

function getTagString(tags: string[]) {
  if (tags.length >= 4) return `${tags.slice(0, 3).join(", ")}, +${tags.length - 3}`;
  return tags.join(", ");
}

export default function QuestionsPage() {
  const { data: questions } = useQuestions();

  const addQuestionInputRef = useRef<HTMLInputElement>(null);
  const { trigger, isMutating } = useAddQuestions();

  function clearInput() {
    if (addQuestionInputRef.current) addQuestionInputRef.current.value = "";
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (isMutating) return clearInput();

    const file = event.target.files?.[0];
    if (!file) return clearInput();

    const json = JSON.parse(await file.text());
    const { data, success } = validate(createSchema, json);
    if (!success) {
      toast.error(
        <>
          Invalid JSON file. Content must be <code>NewQuestion</code> or <code>NewQuestion[]</code>.
        </>,
      );
      return clearInput();
    }

    try {
      const info = await trigger(data);
      toast.success(info);
    } catch {
      /* Empty */
    } finally {
      clearInput();
    }
  }

  if (!questions) return null;
  return (
    <div className="mx-auto flex max-w-prose flex-col gap-6">
      <div className="flex flex-row justify-between">
        <h1 className="text-3xl font-semibold text-white">Questions</h1>
        <label>
          <input
            id="new-question"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
            disabled={isMutating}
            ref={addQuestionInputRef}
          />
          <span className={cn("cursor-pointer", buttonVariants({ variant: "primary" }))}>
            <Plus />
            Add questions via JSON
          </span>
        </label>
      </div>
      {questions.length === 0 ? (
        <div>Nothing here yet. Please add some.</div>
      ) : (
        <ul className="flex flex-col gap-6">
          {questions.map(question => (
            <li key={question.id}>
              <Link
                href={`/questions/${question.id}`}
                className="bg-main-900 flex flex-col gap-1.5 p-6"
              >
                <h2 className="line-clamp-2 text-lg text-white">{question.title}</h2>
                <div className="flex flex-row items-center gap-6">
                  <QuestionDifficultyLabel difficulty={question.difficulty} />
                  <div className="text-main-500 flex flex-row items-center gap-1.5 text-sm">
                    <Tags className="shrink-0" />
                    <span>{getTagString(question.tags)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
