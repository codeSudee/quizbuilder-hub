import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchRoom } from "@/lib/rooms-remote";

export const Route = createFileRoute("/join")({
  component: JoinPage,
});

function JoinPage() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    const c = code.trim();
    if (!/^\d{4}$/.test(c)) { setError("Enter a 4-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetchRoom(c);
      if (!r) { setError("Room not found. Double-check the code with the host."); return; }
      nav({ to: "/join/$code", params: { code: c } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-center">Join a live quiz</h1>
        <p className="mt-2 text-center text-muted-foreground">Enter the 4-digit room code from your host.</p>
        <div className="mt-10 rounded-3xl border-2 border-border bg-card p-8 shadow-card">
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
            placeholder="0000"
            maxLength={4}
            inputMode="numeric"
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-6 text-center text-5xl font-extrabold tracking-[0.5em] focus:border-primary focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && !loading && go()}
            autoFocus
          />
          {error && <p className="mt-3 text-sm font-semibold text-destructive text-center">{error}</p>}
          <button onClick={go} disabled={loading} className="mt-6 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-card disabled:opacity-50">{loading ? "Checking…" : "Join"}</button>
        </div>
      </main>
    </div>
  );
}
