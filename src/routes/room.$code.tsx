import { createFileRoute, useParams, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getQuiz, getRoom, type Quiz, type Room } from "@/lib/quiz-store";

export const Route = createFileRoute("/room/$code")({
  component: RoomPage,
  validateSearch: (s: Record<string, unknown>) => ({
    player: typeof s.player === "string" ? s.player : undefined,
  }),
});

function RoomPage() {
  const { code } = useParams({ from: "/room/$code" });
  const { player } = useSearch({ from: "/room/$code" });
  const nav = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    const r = getRoom(code);
    setRoom(r ?? null);
    if (r) setQuiz(getQuiz(r.quizId) ?? null);
  }, [code]);

  useEffect(() => {
    const tick = () => {
      const fresh = getRoom(code);
      if (fresh) setRoom(fresh);
    };
    const id = setInterval(tick, 1000);
    let bc: BroadcastChannel | null = null;
    try { bc = new BroadcastChannel("quizly-rooms"); bc.onmessage = tick; } catch {}
    return () => { clearInterval(id); bc?.close(); };
  }, [code]);

  // If game started and this user is a player who hasn't finished, send them to play
  useEffect(() => {
    if (!room || !quiz || !player) return;
    const me = room.players.find((p) => p.id === player);
    if (room.started && me && !me.finished && me.answeredIdx < 0) {
      nav({ to: "/quiz/$quizId", params: { quizId: room.quizId }, search: { room: code, player } });
    }
  }, [room?.started, player, room?.quizId, code, quiz, nav, room]);

  if (!room || !quiz) {
    return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10 text-center">Room not found.</p></div>;
  }

  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const allFinished = room.players.length > 0 && room.players.every((p) => p.finished);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{quiz.title}</h1>
            <p className="text-muted-foreground">Room <span className="font-bold text-primary tracking-widest">{code}</span></p>
          </div>
          {!room.started && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Waiting…</span>
          )}
        </div>

        {!room.started && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <p className="font-semibold">Waiting for host to start the game…</p>
          </div>
        )}

        <div className="mt-8 rounded-3xl border-2 border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">{allFinished ? "🏆 Final leaderboard" : "Live leaderboard"}</h2>
            <span className="text-sm text-muted-foreground">{quiz.questions.length} questions</span>
          </div>
          <ol className="mt-4 space-y-2">
            {sorted.length === 0 && <p className="text-sm text-muted-foreground">No players yet.</p>}
            {sorted.map((p, i) => (
              <li key={p.id} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${p.id === player ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full font-extrabold ${i === 0 ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
                    {i + 1}
                  </span>
                  <span className="font-bold">{p.name}{p.id === player && " (you)"}</span>
                  {p.finished && <span className="text-xs font-bold text-success">✓ done</span>}
                </div>
                <span className="text-xl font-extrabold text-primary">{p.score}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex justify-center">
          <Link to="/" className="rounded-xl border-2 border-border px-5 py-3 font-bold">Back to library</Link>
        </div>
      </main>
    </div>
  );
}
