import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchRoom, joinRoomRemote, type RemoteRoom } from "@/lib/rooms-remote";

export const Route = createFileRoute("/join/$code")({
  component: JoinRoomPage,
});

function JoinRoomPage() {
  const { code } = useParams({ from: "/join/$code" });
  const nav = useNavigate();
  const [room, setRoom] = useState<RemoteRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchRoom(code);
        if (!cancelled) setRoom(r);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error loading room");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const join = async () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    setJoining(true);
    setError("");
    try {
      const playerId = await joinRoomRemote(code, name.trim());
      nav({ to: "/room/$code", params: { code }, search: { player: playerId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10 text-center text-muted-foreground">Loading room…</p></div>;
  }

  if (!room) {
    return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10 text-center">Room not found. <a href="/join" className="text-primary font-bold">Try another code</a>.</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Joining "{room.quiz_data.title}"</div>
          <div className="mt-1 text-5xl font-extrabold tracking-[0.3em] text-primary">{room.code}</div>
        </div>
        <div className="mt-8 rounded-3xl border-2 border-border bg-card p-8 shadow-card">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Alex"
            className="mt-2 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && !joining && join()}
            autoFocus
          />
          {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
          <button onClick={join} disabled={joining} className="mt-6 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-card disabled:opacity-50">{joining ? "Joining…" : "Join room"}</button>
        </div>
      </main>
    </div>
  );
}
