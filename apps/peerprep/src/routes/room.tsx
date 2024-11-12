import { HocuspocusProvider } from "@hocuspocus/provider";
import Editor from "@monaco-editor/react";
import { env } from "@peerprep/env";
import type { Room, User } from "@peerprep/schemas";
import { Avatar } from "@peerprep/ui/avatar";
import { Button, LinkButton } from "@peerprep/ui/button";
import { Link } from "@peerprep/ui/link";
import { MarkdownRenderer } from "@peerprep/ui/markdown-renderer";
import { QuestionDifficultyLabel } from "@peerprep/ui/question-difficulty-label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@peerprep/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@peerprep/ui/tabs";
import { Textarea } from "@peerprep/ui/text-input";
import { useAuth, useRoom } from "@peerprep/utils/client";
import { BotMessageSquare, Lock, Send, Tags } from "lucide-react";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useY } from "react-yjs";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";

import { NavAvatar } from "~/components/nav-avatar";
import { NavLogo } from "~/components/nav-logo";
import { useDebounce } from "~/lib/debounce";
import { generateContext } from "~/lib/generate-context";

interface UserAwareness {
  username: string;
}

type StatelessMessage = { type: "chat"; userId: string } | { type: "ai" };

interface ChatMessageType<AI extends boolean = boolean> {
  id: string;
  userId: AI extends false ? string : null;
  timestamp: string;
  content: string;
}

interface ChatMessageGroupType<AI extends boolean = boolean> {
  firstTimestamp: string;
  lastTimestamp: string;
  userId: AI extends false ? string : null;
  messages: ChatMessageType<AI>[];
}

const [PageDataProvider, usePageData] = generateContext<{ user: User; room: Room }>("room data");

function getTagString(tags: string[]) {
  if (tags.length >= 4) return `${tags.slice(0, 3).join(", ")}, +${tags.length - 3}`;
  return tags.join(", ");
}

function useInitialiseHocuspocus() {
  const { user, room } = usePageData();

  const [isReady, setReady] = useState(false);
  const [rawCollaboratorIsOnline, setCollaboratorIsOnline] = useState(false);
  const collaboratorIsOnline = useDebounce(false, rawCollaboratorIsOnline);
  const [stylesheets, setStylesheets] = useState<string[]>([]);
  const [chatPending, setChatPending] = useState(false);
  const [readOnly, setReadOnly] = useState(true);
  const [{ provider, ...documents }] = useState(() => {
    const ydoc = new Y.Doc();
    const yCodeContent = ydoc.getText("monaco");
    const yLanguage = ydoc.getText("language");
    const yChatMessages = ydoc.getArray<Y.Map<string>>("chatMessages");
    const yAIChatMessages = ydoc.getArray<Y.Map<string>>("aIChatMessages");

    const provider = new HocuspocusProvider({
      url: `${env.VITE_SELF_HOST ? "wss://peerprep.joulev.dev" : "ws://localhost:3000"}/api/collaboration/collab/${room.id}`,
      name: room.id,
      document: ydoc,
      token: "dummy token",
    });
    provider.setAwarenessField("user", {
      username: user.username,
    } satisfies UserAwareness);
    provider.on(
      "awarenessUpdate",
      ({ states }: { states: { clientId: number; user: UserAwareness }[] }) => {
        let collaboratorIsOnline = false;
        const newStylesheets = states.map(({ clientId, user: awarenessUser }) => {
          const colour = user.username === awarenessUser.username ? "#a855f7" : "#f59e0b";
          if (user.username !== awarenessUser.username) collaboratorIsOnline = true;
          const stylesheet = `
            .yRemoteSelection-${clientId} {
              background-color: ${colour}60;
            }
            .yRemoteSelectionHead-${clientId} {
              position: absolute;
              border-left: ${colour} solid 2px;
              border-top: ${colour} solid 2px;
              border-bottom: ${colour} solid 2px;
              height: 100%;
              box-sizing: border-box;
            }
          `.trim();
          return stylesheet;
        });
        setCollaboratorIsOnline(collaboratorIsOnline);
        setStylesheets(newStylesheets);
      },
    );
    provider.on("synced", () => setReady(true));
    provider.on("stateless", ({ payload }: { payload: string }) => {
      const decoded = JSON.parse(payload) as StatelessMessage;
      if (decoded.type === "chat" && decoded.userId !== user.id) setChatPending(true);
    });
    provider.on("authenticated", () =>
      setReadOnly(room.alreadyStale || provider.authorizedScope === "readonly"),
    );
    return {
      provider,
      ydoc,
      yCodeContent,
      yLanguage,
      yChatMessages,
      yAIChatMessages,
    };
  });

  return {
    provider,
    ...documents,
    readOnly: !isReady || (isReady && readOnly),
    isReady,
    collaboratorIsOnline,
    stylesheets,
    chatPending,
    clearChatPending: () => setChatPending(false),
  };
}

const [HocuspocusInstanceProvider, useHocuspocus] =
  generateContext<ReturnType<typeof useInitialiseHocuspocus>>("hocuspocus");

function Navbar() {
  const { user, room } = usePageData();
  const { isReady, readOnly, collaboratorIsOnline } = useHocuspocus();
  const collaborator = room.users[0].id === user.id ? room.users[1] : room.users[0];
  return (
    <div className="flex flex-col">
      {(readOnly && isReady) || room.alreadyStale ? (
        <div className="bg-main-900 text-main-300 -mx-6 flex flex-row items-center justify-center gap-2 px-12 py-1.5 text-sm">
          <Lock />
          After 6 hours of inactivity, this room has been locked and is now read-only.
          <LinkButton
            href="/"
            className="w-auto"
            variants={{ size: "sm", variant: "secondary" }}
            forceNativeAnchor
          >
            Start matching
          </LinkButton>
        </div>
      ) : null}
      <nav className="flex flex-row justify-between p-6">
        <div className="flex flex-row items-center gap-6">
          <NavLogo forceNativeAnchor />
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-white">
              <Link href={room.question.leetCodeLink}>{room.question.title}</Link>
            </h1>
            <div className="flex flex-row items-center gap-6">
              <QuestionDifficultyLabel difficulty={room.question.difficulty} />
              <div className="text-main-500 flex flex-row items-center gap-1.5 text-sm">
                <Tags />
                <span>{getTagString(room.question.tags)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row items-center gap-9">
          <div className="flex flex-col gap-1">
            <span className="text-main-500 text-xs uppercase">Collaborator</span>
            <div className="flex flex-row items-center gap-3">
              <Avatar
                imageUrl={collaborator.imageUrl}
                username={collaborator.username}
                className="size-9 border-4 border-amber-500"
              />
              <div className="flex flex-col">
                <span className="text-sm">@{collaborator.username}</span>
                {collaboratorIsOnline ? (
                  <span className="text-xs text-emerald-500">Online</span>
                ) : (
                  <span className="text-main-500 text-xs">Offline</span>
                )}
              </div>
            </div>
          </div>
          <NavAvatar />
        </div>
      </nav>
    </div>
  );
}

function LanguageSelector() {
  const { isReady, readOnly, ydoc, yLanguage } = useHocuspocus();
  const language = useY(yLanguage) as unknown as string;
  return (
    <Select
      disabled={readOnly}
      value={isReady ? language || "cpp" : undefined}
      onValueChange={value => {
        ydoc.transact(() => {
          yLanguage.delete(0, yLanguage.length);
          yLanguage.insert(0, value);
        });
      }}
    >
      <SelectTrigger size="sm" className="h-[30px] w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cpp">C++</SelectItem>
        <SelectItem value="java">Java</SelectItem>
        <SelectItem value="python">Python</SelectItem>
        <SelectItem value="python3">Python3</SelectItem>
        <SelectItem value="c">C</SelectItem>
        <SelectItem value="csharp">C#</SelectItem>
        <SelectItem value="javascript">JavaScript</SelectItem>
        <SelectItem value="typescript">TypeScript</SelectItem>
        <SelectItem value="php">PHP</SelectItem>
        <SelectItem value="swift">Swift</SelectItem>
        <SelectItem value="kotlin">Kotlin</SelectItem>
        <SelectItem value="dart">Dart</SelectItem>
        <SelectItem value="go">Go</SelectItem>
        <SelectItem value="ruby">Ruby</SelectItem>
        <SelectItem value="scala">Scala</SelectItem>
        <SelectItem value="rust">Rust</SelectItem>
        <SelectItem value="racket">Racket</SelectItem>
        <SelectItem value="erlang">Erlang</SelectItem>
        <SelectItem value="elixir">Elixir</SelectItem>
      </SelectContent>
    </Select>
  );
}

function isToday(date: Date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function formatTimeLong(date: Date) {
  if (isToday(date)) return formatTimeShort(date);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return formatter.format(date);
}

function formatTimeShort(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", { timeStyle: "short" });
  return formatter.format(date);
}

function ChatMessage({ message, isFirst }: { message: ChatMessageType; isFirst?: boolean }) {
  return (
    <div className="group relative">
      {isFirst || (
        <span className="text-main-500 absolute right-full top-2 hidden -translate-x-4 -translate-y-px text-xs group-hover:block">
          {formatTimeShort(new Date(message.timestamp))}
        </span>
      )}
      <div className="prose prose-stone prose-invert max-w-full">
        <MarkdownRenderer markdown={message.content} />
      </div>
    </div>
  );
}

function ChatMessageGroup({ group }: { group: ChatMessageGroupType }) {
  const { room } = usePageData();
  const user =
    group.userId === null ? undefined : room.users.find(user => user.id === group.userId);
  return (
    <div className="flex flex-row gap-4">
      {user ? (
        <Avatar
          imageUrl={user.imageUrl}
          username={user.username}
          className="mt-2.5 size-9 shrink-0"
        />
      ) : (
        <span className="bg-main-800 text-main-500 grid size-9 shrink-0 place-items-center rounded-full">
          <BotMessageSquare />
        </span>
      )}
      <div className="flex flex-grow flex-col">
        <div className="flex flex-row items-baseline gap-2">
          <span className="text-lg font-semibold text-white">{user?.username ?? "AI chatbot"}</span>
          <span className="text-main-500 text-xs">
            {formatTimeLong(new Date(group.firstTimestamp))}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {group.messages.map((message, index) => (
            <ChatMessage key={index} message={message} isFirst={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatMessageBox({ ai = false }: { ai?: boolean }) {
  const [message, setMessage] = useState("");
  const { user } = usePageData();
  const { provider, readOnly, ydoc, yAIChatMessages, yChatMessages } = useHocuspocus();
  const disabled = readOnly || !message.trim();
  function submit() {
    const content = message.trim();
    if (!content) return;
    const chatMessage: ChatMessageType<false> = {
      id: nanoid(),
      userId: user.id,
      timestamp: new Date().toISOString(),
      content,
    };
    ydoc.transact(() => {
      const yChatMessage = new Y.Map<string>();
      yChatMessage.set("id", chatMessage.id);
      yChatMessage.set("userId", chatMessage.userId);
      yChatMessage.set("timestamp", chatMessage.timestamp);
      yChatMessage.set("content", chatMessage.content);
      if (ai) yAIChatMessages.push([yChatMessage]);
      else yChatMessages.push([yChatMessage]);
    });
    provider.sendStateless(
      JSON.stringify(
        (ai ? { type: "ai" } : { type: "chat", userId: user.id }) satisfies StatelessMessage,
      ),
    );
    setMessage("");
  }
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        submit();
      }}
      className="bg-main-800 focus-within:border-main-500 flex flex-col border border-transparent pt-2"
    >
      <Textarea
        className="h-24 resize-none border-none"
        placeholder={
          readOnly ? "This room has been locked and this channel is read-only." : "Say something"
        }
        disabled={readOnly}
        value={message}
        onValueChange={setMessage}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="flex flex-row items-end justify-between px-4 pb-4">
        <div className="text-main-500 text-xs">
          Markdown is supported. Shift+Enter for new line.
        </div>
        <Button
          type="submit"
          disabled={disabled}
          className="w-auto"
          variants={{ variant: "primary", size: "sm" }}
        >
          <Send />
          Send message
        </Button>
      </div>
    </form>
  );
}

function groupChatMessages(chatMessages: ChatMessageType[]): ChatMessageGroupType[] {
  const groupedMessages: ChatMessageGroupType[] = [];
  const maxTimeDiff = 5 * 60 * 1000; // 5 minutes
  let currentGroup: ChatMessageGroupType | null = null;
  for (const message of chatMessages) {
    const newGroup: ChatMessageGroupType = {
      firstTimestamp: message.timestamp,
      lastTimestamp: message.timestamp,
      userId: message.userId,
      messages: [message],
    };
    if (!currentGroup) {
      currentGroup = newGroup;
      continue;
    }
    if (message.userId !== currentGroup.userId) {
      groupedMessages.push(currentGroup);
      currentGroup = newGroup;
      continue;
    }
    const timeDiff =
      new Date(message.timestamp).getTime() - new Date(currentGroup.lastTimestamp).getTime();
    if (timeDiff < maxTimeDiff) {
      currentGroup.messages.push(message);
      currentGroup.lastTimestamp = message.timestamp;
    } else {
      groupedMessages.push(currentGroup);
      currentGroup = newGroup;
    }
  }
  if (currentGroup) groupedMessages.push(currentGroup);
  return groupedMessages;
}

function Chat({ ai = false }: { ai?: boolean }) {
  const { isReady, yAIChatMessages, yChatMessages } = useHocuspocus();
  const chatMessages = useY(ai ? yAIChatMessages : yChatMessages);
  const groupedChatMessages = useMemo(
    () => groupChatMessages(chatMessages as unknown as ChatMessageType[]),
    [chatMessages],
  );
  if (!isReady) return <div>Loading</div>;
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="-mx-6 flex flex-grow flex-col-reverse gap-4 overflow-y-auto px-6">
        {groupedChatMessages.toReversed().map((group, index) => (
          <ChatMessageGroup key={index} group={group} />
        ))}
      </div>
      <ChatMessageBox ai={ai} />
    </div>
  );
}

function getMonacoLanguage(language: string) {
  if (!language) return "cpp";
  if (language === "python3") return "python";
  return language;
}

function MainRoomPage() {
  const { room } = usePageData();
  const {
    provider,
    readOnly,
    stylesheets,
    chatPending,
    clearChatPending,
    yCodeContent,
    yLanguage,
  } = useHocuspocus();
  const language = useY(yLanguage) as unknown as string;
  const [tab, setTab] = useState("problem");
  return (
    <div className="flex h-screen w-screen flex-col px-6">
      <Navbar />
      <div className="grid min-h-0 flex-grow grid-cols-2 gap-6 p-6 pt-0">
        <Tabs
          className="bg-main-900 flex flex-col gap-6 overflow-y-auto"
          value={tab}
          onValueChange={tab => {
            setTab(tab);
            clearChatPending();
          }}
        >
          <TabsList className="p-6 pb-0 pt-3">
            <TabsTrigger value="problem" className="text-sm">
              Problem statement
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-sm">
              Chat room
              {chatPending && tab !== "chat" ? (
                <span className="ml-2 inline-block size-2 rounded-full bg-current" />
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-sm">
              AI chat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="problem" className="flex-grow overflow-y-auto p-6 pt-0">
            <div className="prose prose-stone prose-invert max-w-full">
              <MarkdownRenderer markdown={room.question.content} />
            </div>
          </TabsContent>
          <TabsContent value="chat" className="h-full flex-grow overflow-y-auto p-6 pt-0">
            <Chat />
          </TabsContent>
          <TabsContent value="ai" className="h-full flex-grow overflow-y-auto p-6 pt-0">
            <Chat ai />
          </TabsContent>
        </Tabs>
        <div className="bg-main-900 flex flex-col gap-6 p-6">
          <div className="flex flex-row items-center justify-between">
            <LanguageSelector />
            <LinkButton
              className="w-fit"
              href={room.question.leetCodeLink}
              variants={{ variant: "primary", size: "sm" }}
            >
              Submit on Leetcode
            </LinkButton>
          </div>

          <div className="flex-grow">
            <style>{stylesheets.join("")}</style>
            <Editor
              height="100%"
              theme="vs-dark"
              language={getMonacoLanguage(language)}
              options={{ readOnly }}
              onMount={editor => {
                const editorModel = editor.getModel();
                if (!editorModel)
                  throw new Error("invariant: monaco editor model is null, this shouldn't happen");
                new MonacoBinding(yCodeContent, editorModel, new Set([editor]), provider.awareness);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HocuspocusInstanceProviderWrapper({ children }: { children: React.ReactNode }) {
  const hocuspocus = useInitialiseHocuspocus();
  return <HocuspocusInstanceProvider value={hocuspocus}>{children}</HocuspocusInstanceProvider>;
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("invariant: id is undefined");

  const { data: user } = useAuth();
  const { data: room, error } = useRoom(id);

  if (error) return <Navigate to="/" />;
  if (!user || !room) return null;
  return (
    <PageDataProvider value={{ user, room }}>
      <HocuspocusInstanceProviderWrapper>
        <MainRoomPage />
      </HocuspocusInstanceProviderWrapper>
    </PageDataProvider>
  );
}
