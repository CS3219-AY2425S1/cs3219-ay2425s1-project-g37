import Editor from "@monaco-editor/react";
import { Button } from "@peerprep/ui/button";
import { MarkdownRenderer } from "@peerprep/ui/markdown-renderer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@peerprep/ui/select";
import { useQuestion } from "@peerprep/utils/client";
import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("invariant: id is undefined");

  const location = useLocation();
  const { matched, questionId } = location.state || {};

  // const editorRef = useRef(null);
  // function handleEditorDidMount(editor, monaco) {
  //   editorRef.current = editor;
  // }

  const [language, setLanguage] = useState("JavaScript");

  const { data: question } = useQuestion(questionId);

  if (!question) return <div>Question not found.</div>;

  return (
    <div className="flex h-full w-full gap-6">
      <div className="bg-main-900 flex w-full flex-grow flex-col gap-6 overflow-auto p-12">
        <p>Room ID: {id}</p>
        {matched && <p>Matched Users: {matched.join(", ")}</p>}
        {questionId && <p>Question ID: {questionId}</p>}
        <h1 className="text-2xl font-semibold text-white">{question.title}</h1>
        <div className="prose prose-stone prose-invert max-w-full">
          {<MarkdownRenderer markdown={question.content} />}
        </div>
      </div>

      <div className="bg-main-900 flex w-full flex-grow flex-col px-4 py-4">
        <div className="flex-grow overflow-auto">
          <Editor
            height="100%"
            theme="vs-dark"
            // defaultLanguage="javascript"
            language={language}
            defaultValue="// some comment"
            // onMount={handleEditorDidMount}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-48">
          <Select value={language} onValueChange={value => setLanguage(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JavaScript">JavaScript</SelectItem>
              <SelectItem value="Python">Python</SelectItem>
              <SelectItem value="Java">Java</SelectItem>
            </SelectContent>
          </Select>
          <Button variants={{ variant: "primary" }}>Run sample tests</Button>
        </div>
      </div>
    </div>
  );
}
