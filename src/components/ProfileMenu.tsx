import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { getUser, setUser, loadScores, loadQuizzes } from "@/lib/quiz-store";

export function ProfileMenu() {
  const [user, setU] = useState<ReturnType<typeof getUser>>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => setU(getUser()), []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const stats = useMemo(() => {
    if (!user) return null;
    const scores = loadScores().filter((s) => s.player === user.name || s.player === user.name.split(" ")[0]);
    const created = loadQuizzes().length;
    const attended = scores.length;
    const best = scores.reduce((m, s) => Math.max(m, s.pct), 0);
    const avg = attended ? Math.round(scores.reduce((a, s) => a + s.pct, 0) / attended) : 0;
    return { created, attended, best, avg };
  }, [user, open]);

  if (!user) {
    return (
      <Link to="/login" className="rounded-full border-2 border-foreground px-4 py-2 text-sm font-bold hover:bg-foreground hover:text-background transition">
        Log in
      </Link>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full bg-primary font-extrabold text-primary-foreground shadow-card transition hover:scale-105"
        aria-label="Open profile"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl border-2 border-border bg-card shadow-xl">
          {/* Header */}
          <div className="bg-primary p-5 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-foreground text-xl font-extrabold text-primary">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-extrabold">{user.name}</div>
                <div className="truncate text-sm opacity-80">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-px bg-border">
            <Stat label="Quizzes attended" value={stats!.attended} />
            <Stat label="Quizzes created" value={stats!.created} />
            <Stat label="Best score" value={`${stats!.best}%`} />
            <Stat label="Avg. score" value={`${stats!.avg}%`} />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 p-2">
            <Link
              to="/leaderboard"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              🏆 View leaderboard
            </Link>
            <Link
              to="/create"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              ✨ Create a quiz
            </Link>
            <button
              onClick={() => {
                setUser(null);
                setU(null);
                setOpen(false);
                nav({ to: "/login" });
              }}
              className="mt-1 rounded-lg border-t border-border px-3 py-2 text-left text-sm font-bold text-destructive hover:bg-destructive/10"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card p-4">
      <div className="text-2xl font-extrabold text-primary">{value}</div>
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}
