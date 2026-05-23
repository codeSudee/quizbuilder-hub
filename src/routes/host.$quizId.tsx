import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getQuiz, uid, type Quiz } from "@/lib/quiz-store";
import {
  createRoomRemote,
  fetchPlayers,
  startRoomRemote,
  subscribeRoom,
  type RemotePlayer,
  type RemoteRoom,
} from "@/lib/rooms-remote";

export const Route = createFileRoute("/host/$quizId")({
  component: HostPage,
});

function HostPage() {
  const { quizId } = useParams({ from: "/host/$quizId" });
  const nav = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [room, setRoom] = useState<RemoteRoom | null>(null);
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Create the room (once) — guard against StrictMode double effect
  useEffect(() => {
    const q = getQuiz(quizId);
    setQuiz(q ?? null);
    if (!q) return;
    let cancelled = false;
    const key = `quizly.host-room-for.${quizId}`;
    const existing = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
    (async () => {
      try {
        if (existing) {
          const parsed = JSON.parse(existing) as RemoteRoom;
          if (!cancelled) setRoom(parsed);
          return;
        }
        const r = await createRoomRemote(q, uid());
        if (cancelled) return;
        sessionStorage.setItem(key, JSON.stringify(r));
        setRoom(r);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to create room");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // Realtime players
  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const p = await fetchPlayers(room.code);
        if (!cancelled) setPlayers(p);
      } catch {}
    };
    refresh();
    const unsub = subscribeRoom(room.code, refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [room?.code]);

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-10 text-center">Quiz not found.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-10 text-center text-destructive font-bold">{error}</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-10 text-center text-muted-foreground">Creating room…</p>
      </div>
    );
  }

  const joinLink = `${window.location.origin}/join/${room.code}`;

  const startGame = async () => {
    try {
      await startRoomRemote(room.code);
      nav({ to: "/room/$code", params: { code: room.code } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Live room for "{quiz.title}"</h1>
        <p className="mt-1 text-muted-foreground">Share the code or link. When everyone is in, start the game.</p>

        <div className="mt-8 rounded-3xl border-2 border-border bg-card p-8 shadow-card text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Room code</div>
          <div className="mt-2 text-7xl font-extrabold tracking-[0.3em] text-primary">{room.code}</div>
          <div className="mt-6 flex flex-col gap-2 items-center">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Or share this link</div>
            <div className="flex w-full max-w-md gap-2">
              <input readOnly value={joinLink} className="flex-1 rounded-lg border-2 border-border bg-muted px-3 py-2 text-sm" />
              <button
                onClick={copy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >{copied ? "Copied!" : "Copy"}</button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border-2 border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Players ({players.length})</h2>
            <span className="text-sm text-muted-foreground">Live · updates instantly</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has joined yet.</p>
            ) : players.map((p) => (
              <span key={p.id} className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold">{p.name}</span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={startGame}
            disabled={players.length === 0}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card disabled:opacity-40"
          >Start game →</button>
        </div>
      </main>
    </div>
  );
}
