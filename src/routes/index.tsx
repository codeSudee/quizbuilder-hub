import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { loadQuizzes, seedIfEmpty, deleteQuiz, type Quiz } from "@/lib/quiz-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  useEffect(() => {
    seedIfEmpty();
    setQuizzes(loadQuizzes());
  }, []);

  const refresh = () => setQuizzes(loadQuizzes());

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
              Learn anything
            </span>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Create, share and <span className="text-primary">play quizzes</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Build quizzes with images, multiple choice, one-word answers and fill-in-the-blanks. Made for curious minds.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/create" className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card hover:opacity-95">
                Create a quiz
              </Link>
              <a href="#library" className="rounded-xl border-2 border-border px-6 py-3 font-bold hover:bg-muted">
                Browse library
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="rotate-2 rounded-3xl border-2 border-border bg-card p-6 shadow-card">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Question 1 of 10</div>
              <div className="mt-3 text-2xl font-extrabold">Which planet is known as the Red Planet?</div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {["Venus", "Mars", "Jupiter", "Mercury"].map((o, i) => (
                  <div key={o} className={`rounded-xl border-2 px-4 py-3 font-semibold ${i === 1 ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                    {o}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 -rotate-3 rounded-2xl border-2 border-border bg-accent px-5 py-3 font-extrabold text-accent-foreground shadow-card">
              +50 XP
            </div>
          </div>
        </div>
      </section>

      {/* Library */}
      <section id="library" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Your quizzes</h2>
            <p className="text-muted-foreground">Everything you've created lives here.</p>
          </div>
          <Link to="/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">+ New</Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No quizzes yet — create your first one!</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <article key={q.id} className="group flex flex-col rounded-2xl border-2 border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <span>{q.questions.length} questions</span>
                  <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="mt-2 text-xl font-extrabold tracking-tight">{q.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{q.description || "No description"}</p>
                <div className="mt-5 flex gap-2">
                  <Link to="/quiz/$quizId" params={{ quizId: q.id }} className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-bold text-primary-foreground">
                    Play
                  </Link>
                  <button
                    onClick={() => { if (confirm("Delete this quiz?")) { deleteQuiz(q.id); refresh(); } }}
                    className="rounded-lg border-2 border-border px-3 py-2 text-sm font-semibold hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built with ❤ — Quizly
      </footer>
    </div>
  );
}
