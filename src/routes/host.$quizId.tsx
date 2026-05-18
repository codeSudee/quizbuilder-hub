import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { generateRoomCode, getQuiz, getRoom, saveRoom, uid, type Quiz, type Room } from "@/lib/quiz-store";

export const Route = createFileRoute("/host/$quizId")({
  component: HostPage,
});

function HostPage() {
  const { quizId } = useParams({ from: "/host/$quizId" });
  const nav = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const q = getQuiz(quizId);
    setQuiz(q ?? null);
    if (!q) return;
    // Create room
    let code = generateRoomCode();
    while (getRoom(code)) code = generateRoomCode();
    const r: Room = {
      code,
      quizId,
      hostId: uid(),
      players: [],
      started: false,
      createdAt: Date.now(),
    };
    saveRoom(r);
    setRoom(r);
  }, [quizId]);

  // Poll for players joining
  useEffect(() => {
    if (!room) return;
    const tick = () => {
      const fresh = getRoom(room.code);
      if (fresh) setRoom(fresh);
    };
    const id = setInterval(tick, 1000);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("quizly-rooms");
      bc.onmessage = tick;
    } catch {}
    return () => { clearInterval(id); bc?.close(); };
  }, [room?.code]);

  if (!quiz) {
    return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10 text-center">Quiz not found.</p></div>;
  }
  if (!room) return null;

  const joinLink = `${window.location.origin}/join/${room.code}`;

  const startGame = () => {
    const updated: Room = { ...room, started: true, startedAt: Date.now() };
    saveRoom(updated);
    // Host plays too — register as a player
    nav({ to: "/room/$code", params: { code: room.code } });
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
                onClick={() => { navigator.clipboard.writeText(joinLink); }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >Copy</button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border-2 border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Players ({room.players.length})</h2>
            <span className="text-sm text-muted-foreground">Waiting for players to join...</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {room.players.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has joined yet.</p>
            ) : room.players.map((p) => (
              <span key={p.id} className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold">{p.name}</span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={startGame}
            disabled={room.players.length === 0}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card disabled:opacity-40"
          >Start game →</button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">Note: this prototype syncs players within the same browser via local storage. For cross-device play you'd connect a real backend.</p>
      </main>
    </div>
  );
}
