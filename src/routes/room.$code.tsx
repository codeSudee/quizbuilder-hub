import { createFileRoute, useParams, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchPlayers,
  fetchRoom,
  subscribeRoom,
  type RemotePlayer,
  type RemoteRoom,
} from "@/lib/rooms-remote";

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
  const [room, setRoom] = useState<RemoteRoom | null>(null);
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const [r, p] = await Promise.all([fetchRoom(code), fetchPlayers(code)]);
        if (cancelled) return;
        setRoom(r);
        setPlayers(p);
      } catch {}
    };
    refresh().finally(() => { if (!cancelled) setLoading(false); });
    const unsub = subscribeRoom(code, refresh);
    return () => { cancelled = true; unsub(); };
  }, [code]);

  // When host starts, redirect joined player to the quiz
  useEffect(() => {
    if (!room || !player) return;
    const me = players.find((p) => p.id === player);
    if (room.started && me && !me.finished && me.answered_idx < 0) {
      nav({ to: "/quiz/$quizId", params: { quizId: room.quiz_id }, search: { room: code, player } });
    }
  }, [room?.started, player, players, room?.quiz_id, code, nav, room]);

  if (loading) {
    return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10 text-center text-muted-foreground">Loading…</p></div>;
  }

  if (!room) {
    return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10 text-center">Room not found.</p></div>;
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const allFinished = players.length > 0 && players.every((p) => p.finished);
  const totalQ = room.quiz_data.questions.length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{room.quiz_data.title}</h1>
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
            <span className="text-sm text-muted-foreground">{totalQ} questions</span>
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
