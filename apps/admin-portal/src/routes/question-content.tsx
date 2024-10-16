import { MarkdownRenderer } from "@peerprep/ui/markdown-renderer";
import { useQuestion } from "@peerprep/utils/client";
import { useParams } from "react-router-dom";

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("invariant: id is undefined");

  const { data: question } = useQuestion(id);
  if (!question) return null;

  return (
    <div className="prose prose-stone prose-invert max-w-full">
      <MarkdownRenderer markdown={question.content} />
    </div>
  );
}
