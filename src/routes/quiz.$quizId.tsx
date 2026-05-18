import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getQuiz, getRoom, saveRoom, type Quiz, type Room } from "@/lib/quiz-store";

export const Route = createFileRoute("/quiz/$quizId")({
  component: PlayPage,
  validateSearch: (s: Record<string, unknown>) => ({
    room: typeof s.room === "string" ? s.room : undefined,
    player: typeof s.player === "string" ? s.player : undefined,
  }),
});

function PlayPage() {
  const { quizId } = useParams({ from: "/quiz/$quizId" });
  const { room: roomCode, player: playerId } = useSearch({ from: "/quiz/$quizId" });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const q = getQuiz(quizId);
    setQuiz(q ?? null);
  }, [quizId]);

  const perQ = quiz?.timePerQuestion ?? 20;

  // Reset timer when question changes
  useEffect(() => {
    if (!quiz || done) return;
    setTimeLeft(perQ);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx, quiz, done, perQ]);

  // Stop timer when revealed
  useEffect(() => {
    if (revealed && timerRef.current) clearInterval(timerRef.current);
  }, [revealed]);

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
    if (!value) return false;
    if (q.type === "mcq") return value === q.answer;
    return normalize(value) === normalize(q.answer);
  };

  const updateRoomScore = (finalScore: number, finished: boolean, lastIdx: number) => {
    if (!roomCode || !playerId) return;
    const room = getRoom(roomCode);
    if (!room) return;
    const updated: Room = {
      ...room,
      players: room.players.map((p) => p.id === playerId ? { ...p, score: finalScore, answeredIdx: lastIdx, finished } : p),
    };
    saveRoom(updated);
  };

  const submit = () => {
    if (revealed) return;
    if (!value) return;
    const correct = isCorrect();
    const ns = correct ? score + 1 : score;
    if (correct) setScore(ns);
    setRevealed(true);
    updateRoomScore(ns, false, idx);
  };

  const next = () => {
    if (idx + 1 >= total) {
      setDone(true);
      updateRoomScore(score, true, idx);
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
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              {roomCode ? (
                <Link to="/room/$code" params={{ code: roomCode }} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">View leaderboard</Link>
              ) : (
                <button onClick={restart} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Play again</button>
              )}
              <Link to="/" className="rounded-xl border-2 border-border px-5 py-3 font-bold">Back to library</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timePct = (timeLeft / perQ) * 100;
  const lowTime = timeLeft <= 5;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
            <span>{quiz.title}{roomCode && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">Room {roomCode}</span>}</span>
            <span>{idx + 1} / {total}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${((idx) / total) * 100}%` }} />
          </div>

          {/* Timer */}
          <div className="mt-4 flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-full border-2 font-extrabold text-lg ${lowTime ? "border-destructive bg-destructive/10 text-destructive animate-pulse" : "border-primary bg-primary/5 text-primary"}`}>
              {timeLeft}
            </div>
            <div className="flex-1 h-3 overflow-hidden rounded-full bg-muted">
              <div className={`h-full transition-all ${lowTime ? "bg-destructive" : "bg-primary"}`} style={{ width: `${timePct}%` }} />
            </div>
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
              <div className="font-extrabold">{isCorrect() ? "✓ Correct!" : timeLeft === 0 && !value ? "⏰ Time's up!" : "✗ Not quite"}</div>
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
