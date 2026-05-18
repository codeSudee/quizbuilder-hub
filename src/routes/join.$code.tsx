import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getRoom, saveRoom, uid, type Room } from "@/lib/quiz-store";

export const Route = createFileRoute("/join/$code")({
  component: JoinRoomPage,
});

function JoinRoomPage() {
  const { code } = useParams({ from: "/join/$code" });
  const nav = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const r = getRoom(code);
    setRoom(r ?? null);
  }, [code]);

  const join = () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    const r = getRoom(code);
    if (!r) { setError("Room not found"); return; }
    const playerId = uid();
    const updated: Room = { ...r, players: [...r.players, { id: playerId, name: name.trim(), score: 0, answeredIdx: -1, finished: false }] };
    saveRoom(updated);
    nav({ to: "/room/$code", params: { code }, search: { player: playerId } });
  };

  if (!room) {
    return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10 text-center">Room not found. <a href="/join" className="text-primary font-bold">Try another code</a>.</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Joining room</div>
          <div className="mt-1 text-5xl font-extrabold tracking-[0.3em] text-primary">{room.code}</div>
        </div>
        <div className="mt-8 rounded-3xl border-2 border-border bg-card p-8 shadow-card">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Alex"
            className="mt-2 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && join()}
            autoFocus
          />
          {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
          <button onClick={join} className="mt-6 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-card">Join room</button>
        </div>
      </main>
    </div>
  );
}
