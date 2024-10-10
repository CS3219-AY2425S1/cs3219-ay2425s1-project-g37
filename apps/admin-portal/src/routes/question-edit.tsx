import type { Difficulty, Question, UpdateQuestion } from "@peerprep/schemas";
import { questions, validate } from "@peerprep/schemas/validators";
import { Button, LinkButton } from "@peerprep/ui/button";
import { cn } from "@peerprep/ui/cn";
import { FormControl } from "@peerprep/ui/form-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@peerprep/ui/select";
import { Input, Textarea } from "@peerprep/ui/text-input";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { useEditQuestion, useQuestion } from "~/lib/questions";

function UpdateForm({ question }: { question: Question }) {
  const { isMutating, trigger } = useEditQuestion(question.id);
  const navigate = useNavigate();

  const [title, setTitle] = useState(question.title);
  const [content, setContent] = useState(question.content);
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [tagsString, setTagsString] = useState(question.tags.join(", "));
  const tags = tagsString
    .split(", ")
    .map(x => x.trim())
    .filter(Boolean);
  const [leetCodeLink, setLeetCodeLink] = useState(question.leetCodeLink);

  const updatedQuestion: UpdateQuestion = { title, content, difficulty, tags, leetCodeLink };
  const isValid = validate(questions.updateSchema, updatedQuestion).success;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async e => {
        e.preventDefault();
        await trigger(updatedQuestion);
        toast.success("Question updated successfully!");
        navigate("..");
      }}
    >
      <h2 className="text-xl font-semibold text-white">Update question</h2>
      <Input label="Title" type="text" required value={title} onValueChange={setTitle} />
      <Textarea
        label="Content"
        required
        value={content}
        onValueChange={setContent}
        className="font-mono"
      />
      <FormControl label="Difficulty">
        <Select value={difficulty} onValueChange={value => setDifficulty(value as Difficulty)}>
          <SelectTrigger>
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>
      </FormControl>
      <Input
        label="Tags"
        type="text"
        required
        pattern="^[\w\s,]+$"
        value={tagsString}
        onValueChange={setTagsString}
        helpText={
          <>
            Comma-separated list of tags. The tags will be updated to:{" "}
            {tags.map((tag, index) => (
              <span
                className={cn(
                  "bg-main-800 inline-block px-2 py-0.5 text-white",
                  index !== tags.length - 1 && "mr-1.5",
                )}
                key={tag}
              >
                {tag}
              </span>
            ))}
            .
          </>
        }
      />
      <Input
        label="LeetCode Link"
        type="url"
        required
        value={leetCodeLink}
        onValueChange={setLeetCodeLink}
      />
      <div className="flex flex-row justify-end gap-3">
        <LinkButton href=".." className="w-auto">
          Cancel
        </LinkButton>
        <Button
          className="w-auto"
          variants={{ variant: "primary" }}
          type="submit"
          disabled={!isValid || isMutating}
        >
          Update question
        </Button>
      </div>
    </form>
  );
}

export default function QuestionEditPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("invariant: id is undefined");

  const { data: question } = useQuestion(id);
  if (!question) return null;

  return <UpdateForm question={question} />;
}
