import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getUser, setUser } from "@/lib/quiz-store";

export function SiteHeader() {
  const [user, setU] = useState<ReturnType<typeof getUser>>(null);
  const nav = useNavigate();
  useEffect(() => setU(getUser()), []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">Q</div>
          <span className="text-xl font-extrabold tracking-tight">Quizly</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted sm:inline">Browse</Link>
          <Link to="/join" className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted">Join</Link>
          <Link to="/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-card hover:opacity-95">+ Create</Link>
          {user ? (
            <button
              onClick={() => { setUser(null); setU(null); nav({ to: "/login" }); }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              {user.name.split(" ")[0]} · Log out
            </button>
          ) : (
            <Link to="/login" className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
