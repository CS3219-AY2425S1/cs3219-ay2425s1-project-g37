import { useLocation, useParams } from "react-router-dom";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("invariant: id is undefined");

  const location = useLocation();
  const { matched, questionId } = location.state || {};

  return (
    <div className="flex w-full flex-row justify-center px-6 py-12">
      <div className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-12">
        <p>Room ID: {id}</p>
        {matched && <p>Matched Users: {matched.join(", ")}</p>}
        {questionId && <p>Question ID: {questionId}</p>}
      </div>
    </div>
  );
}
