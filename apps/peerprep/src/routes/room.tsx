// import { HocuspocusProvider } from "@hocuspocus/provider";
import Editor from "@monaco-editor/react";
import { LinkButton } from "@peerprep/ui/button";
import { MarkdownRenderer } from "@peerprep/ui/markdown-renderer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@peerprep/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@peerprep/ui/tabs";
import { useQuestion } from "@peerprep/utils/client";
import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";

// import { MonacoBinding } from "y-monaco";
// import * as Y from "yjs";

// const ydoc = new Y.Doc();
// const provider = new HocuspocusProvider({
//   url: "ws://localhost:4000",
//   name: "test",
//   document: ydoc,
// });
// const ytext = ydoc.getText("monaco");

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
      <div className="bg-main-900 flex w-1/2 flex-grow flex-col gap-6 overflow-auto px-4 pt-2">
        <Tabs defaultValue="problem">
          <TabsList>
            <TabsTrigger value="problem" className="text-sm">
              PROBLEM STATEMENT
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-sm">
              CHAT ROOM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="problem">
            <h1 className="text-2xl font-semibold text-white">{question.title}</h1>
            <div className="prose prose-stone prose-invert max-w-full">
              {<MarkdownRenderer markdown={question.content} />}
            </div>
          </TabsContent>
          <TabsContent value="chat">
            <p>Room ID: {id}</p>
            {matched && <p>Matched Users: {matched.join(", ")}</p>}
            {questionId && <p>Question ID: {questionId}</p>}
          </TabsContent>
        </Tabs>
      </div>

      <div className="bg-main-900 flex w-1/2 flex-grow flex-col px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="w-48">
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
          </div>
          <div className="w-48">
            <LinkButton href={question.leetCodeLink} variants={{ variant: "primary" }}>
              Submit on Leetcode
            </LinkButton>
          </div>
        </div>

        <div className="flex-grow overflow-auto">
          <Editor
            height="100%"
            theme="vs-dark"
            // defaultLanguage="javascript"
            language={language}
            defaultValue="// some comment"
            // onMount={editor => {
            //   const editorModel = editor.getModel();
            //   if (!editorModel)
            //     throw new Error("invariant: monaco editor model is null, this shouldn't happen");
            //   new MonacoBinding(ytext, editorModel, new Set([editor]), provider.awareness);
            // }}
          />
        </div>
      </div>
    </div>
  );
}
