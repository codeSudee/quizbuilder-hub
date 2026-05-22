import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { loadScores, clearScores, type ScoreEntry } from "@/lib/quiz-store";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { setScores(loadScores()); }, []);

  const quizzes = useMemo(() => {
    const map = new Map<string, string>();
    scores.forEach((s) => map.set(s.quizId, s.quizTitle));
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [scores]);

  const filtered = useMemo(() => {
    const list = filter === "all" ? scores : scores.filter((s) => s.quizId === filter);
    return [...list].sort((a, b) => b.pct - a.pct || b.score - a.score || a.at - b.at);
  }, [scores, filter]);

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Leaderboard</h1>
            <p className="mt-1 text-muted-foreground">All scores from quizzes you've played, ranked.</p>
          </div>
          {scores.length > 0 && (
            <button
              onClick={() => { if (confirm("Clear all leaderboard history?")) { clearScores(); setScores([]); } }}
              className="rounded-lg border-2 border-border px-3 py-2 text-sm font-semibold hover:bg-destructive hover:text-destructive-foreground"
            >Clear history</button>
          )}
        </div>

        {quizzes.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold ${filter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            >All quizzes</button>
            {quizzes.map((q) => (
              <button
                key={q.id}
                onClick={() => setFilter(q.id)}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold ${filter === q.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
              >{q.title}</button>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-3xl border-2 border-border bg-card p-6 shadow-card">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-5xl">🏁</div>
              <p className="mt-3 font-semibold">No scores yet</p>
              <p className="text-sm text-muted-foreground">Play a quiz to land on the leaderboard.</p>
              <Link to="/" className="mt-5 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Browse quizzes</Link>
            </div>
          ) : (
            <ol className="space-y-2">
              {filtered.map((s, i) => (
                <li key={s.id} className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${i < 3 ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted font-extrabold">{medal(i)}</span>
                    <div className="min-w-0">
                      <div className="truncate font-bold">{s.player}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.quizTitle} · {new Date(s.at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-primary">{s.score}<span className="text-sm text-muted-foreground">/{s.total}</span></div>
                    <div className="text-xs font-bold text-muted-foreground">{s.pct}%</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>
    </div>
  );
}
