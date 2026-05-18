import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getQuiz, type Quiz } from "@/lib/quiz-store";

export const Route = createFileRoute("/quiz/$quizId")({
  component: PlayPage,
});

function PlayPage() {
  const { quizId } = useParams({ from: "/quiz/$quizId" });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const q = getQuiz(quizId);
    setQuiz(q ?? null);
  }, [quizId]);

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-3xl font-extrabold">Quiz not found</h1>
          <Link to="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Back home</Link>
        </div>
      </div>
    );
  }

  const q = quiz.questions[idx];
  const total = quiz.questions.length;

  const normalize = (s: string) => s.trim().toLowerCase();
  const isCorrect = () => {
    if (q.type === "mcq") return value === q.answer;
    return normalize(value) === normalize(q.answer);
  };

  const submit = () => {
    if (revealed) return;
    if (!value) return;
    if (isCorrect()) setScore((s) => s + 1);
    setRevealed(true);
  };

  const next = () => {
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setValue("");
      setRevealed(false);
    }
  };

  const restart = () => {
    setIdx(0); setValue(""); setRevealed(false); setScore(0); setDone(false);
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="rounded-3xl border-2 border-border bg-card p-10 shadow-card">
            <div className="text-7xl">{pct >= 80 ? "🏆" : pct >= 50 ? "🎉" : "💪"}</div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">All done!</h1>
            <p className="mt-2 text-muted-foreground">You scored</p>
            <div className="mt-4 text-6xl font-extrabold text-primary">{score}<span className="text-2xl text-muted-foreground">/{total}</span></div>
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={restart} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Play again</button>
              <Link to="/" className="rounded-xl border-2 border-border px-5 py-3 font-bold">Back to library</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
            <span>{quiz.title}</span>
            <span>{idx + 1} / {total}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${((idx) / total) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-3xl border-2 border-border bg-card p-8 shadow-card">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {q.type === "mcq" ? "Multiple choice" : q.type === "one-word" ? "One word" : "Fill the blank"}
          </span>
          <h2 className="mt-4 text-2xl font-extrabold leading-snug md:text-3xl">{q.prompt}</h2>
          {q.image && (
            <img src={q.image} alt="" className="mt-4 max-h-72 w-full rounded-2xl border-2 border-border object-contain" />
          )}

          <div className="mt-6">
            {q.type === "mcq" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {q.options!.map((opt, oi) => {
                  const selected = value === String(oi);
                  const correctOpt = revealed && String(oi) === q.answer;
                  const wrongOpt = revealed && selected && !correctOpt;
                  return (
                    <button
                      key={oi}
                      disabled={revealed}
                      onClick={() => setValue(String(oi))}
                      className={`rounded-xl border-2 px-4 py-3 text-left font-semibold transition ${
                        correctOpt ? "border-success bg-success/10 text-success" :
                        wrongOpt ? "border-destructive bg-destructive/10 text-destructive" :
                        selected ? "border-primary bg-primary/5 text-primary" :
                        "border-border hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={revealed}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Type your answer..."
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-4 text-lg font-semibold focus:border-primary focus:outline-none"
                autoFocus
              />
            )}
          </div>

          {revealed && (
            <div className={`mt-5 rounded-xl border-2 p-4 ${isCorrect() ? "border-success bg-success/10" : "border-destructive bg-destructive/10"}`}>
              <div className="font-extrabold">{isCorrect() ? "✓ Correct!" : "✗ Not quite"}</div>
              {!isCorrect() && (
                <div className="mt-1 text-sm">
                  Answer: <span className="font-bold">{q.type === "mcq" ? q.options![Number(q.answer)] : q.answer}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm font-bold text-muted-foreground">Score: {score}</div>
            {revealed ? (
              <button onClick={next} className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card">
                {idx + 1 >= total ? "See results" : "Next →"}
              </button>
            ) : (
              <button onClick={submit} disabled={!value} className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card disabled:opacity-40">
                Check
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
