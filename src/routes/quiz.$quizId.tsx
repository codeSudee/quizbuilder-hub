import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getQuiz, getRoom, getUser, saveRoom, saveScore, type Quiz, type Room } from "@/lib/quiz-store";

export const Route = createFileRoute("/quiz/$quizId")({
  component: PlayPage,
  validateSearch: (s: Record<string, unknown>) => ({
    room: typeof s.room === "string" ? s.room : undefined,
    player: typeof s.player === "string" ? s.player : undefined,
  }),
});

interface AnswerRecord {
  question: string;
  given: string;
  correct: string;
  isCorrect: boolean;
  timedOut: boolean;
}

function PlayPage() {
  const { quizId } = useParams({ from: "/quiz/$quizId" });
  const { room: roomCode, player: playerId } = useSearch({ from: "/quiz/$quizId" });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    setQuiz(getQuiz(quizId) ?? null);
  }, [quizId]);

  const savedRef = useRef(false);
  useEffect(() => {
    if (!done || !quiz || savedRef.current) return;
    savedRef.current = true;
    const total = quiz.questions.length;
    const pct = total ? Math.round((score / total) * 100) : 0;
    let playerName = "You";
    if (roomCode && playerId) {
      const room = getRoom(roomCode);
      const me = room?.players.find((p) => p.id === playerId);
      if (me?.name) playerName = me.name;
    } else {
      const u = getUser();
      if (u?.name) playerName = u.name;
    }
    saveScore({ quizId: quiz.id, quizTitle: quiz.title, player: playerName, score, total, pct });
  }, [done, quiz, score, roomCode, playerId]);

  const perQ = quiz?.timePerQuestion ?? 20;

  const updateRoomScore = useCallback((finalScore: number, finished: boolean, lastIdx: number) => {
    if (!roomCode || !playerId) return;
    const room = getRoom(roomCode);
    if (!room) return;
    const updated: Room = {
      ...room,
      players: room.players.map((p) =>
        p.id === playerId ? { ...p, score: finalScore, answeredIdx: lastIdx, finished } : p,
      ),
    };
    saveRoom(updated);
  }, [roomCode, playerId]);

  const normalize = (s: string) => s.trim().toLowerCase();

  const advance = useCallback((timedOut: boolean) => {
    if (!quiz || advancingRef.current) return;
    advancingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const q = quiz.questions[idx];
    const given = value;
    const correct =
      !!given && (q.type === "mcq" ? given === q.answer : normalize(given) === normalize(q.answer));
    const ns = correct ? score + 1 : score;

    const record: AnswerRecord = {
      question: q.prompt,
      given: given ? (q.type === "mcq" ? (q.options?.[Number(given)] ?? given) : given) : "",
      correct: q.type === "mcq" ? (q.options?.[Number(q.answer)] ?? q.answer) : q.answer,
      isCorrect: correct,
      timedOut: timedOut && !given,
    };
    const newHistory = [...history, record];

    setScore(ns);
    setHistory(newHistory);

    const isLast = idx + 1 >= quiz.questions.length;
    if (isLast) {
      setDone(true);
      updateRoomScore(ns, true, idx);
    } else {
      setIdx(idx + 1);
      setValue("");
      updateRoomScore(ns, false, idx);
    }
    // release lock next tick
    setTimeout(() => { advancingRef.current = false; }, 0);
  }, [quiz, idx, value, score, history, updateRoomScore]);

  // Timer per question
  useEffect(() => {
    if (!quiz || done) return;
    setTimeLeft(perQ);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // auto-advance when time runs out
          setTimeout(() => advance(true), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, quiz, done, perQ]);

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

  const total = quiz.questions.length;

  if (done) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-3xl border-2 border-border bg-card p-10 shadow-card text-center">
            <div className="text-7xl">{pct >= 80 ? "🏆" : pct >= 50 ? "🎉" : "💪"}</div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">All done!</h1>
            <p className="mt-2 text-muted-foreground">You scored</p>
            <div className="mt-4 text-6xl font-extrabold text-primary">
              {score}<span className="text-2xl text-muted-foreground">/{total}</span>
            </div>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              {roomCode ? (
                <Link to="/room/$code" params={{ code: roomCode }} search={{ player: playerId }} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">View leaderboard</Link>
              ) : (
                <Link to="/quiz/$quizId" params={{ quizId }} reloadDocument className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Play again</Link>
              )}
              <Link to="/" className="rounded-xl border-2 border-border px-5 py-3 font-bold">Back to library</Link>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border-2 border-border bg-card p-6 shadow-card">
            <h2 className="text-xl font-extrabold">Review</h2>
            <ol className="mt-4 space-y-3">
              {history.map((h, i) => (
                <li key={i} className={`rounded-xl border-2 p-4 ${h.isCorrect ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}`}>
                  <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Q{i + 1}</div>
                  <div className="mt-1 font-bold">{h.question}</div>
                  <div className="mt-2 text-sm">
                    Your answer: <span className="font-bold">{h.given || (h.timedOut ? "⏰ Time's up" : "—")}</span>
                  </div>
                  {!h.isCorrect && (
                    <div className="text-sm">Correct: <span className="font-bold text-success">{h.correct}</span></div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz.questions[idx];
  const timePct = (timeLeft / perQ) * 100;
  const lowTime = timeLeft <= 5;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
            <span>
              {quiz.title}
              {roomCode && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">Room {roomCode}</span>}
            </span>
            <span>{idx + 1} / {total}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${(idx / total) * 100}%` }} />
          </div>

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
                  return (
                    <button
                      key={oi}
                      onClick={() => setValue(String(oi))}
                      className={`rounded-xl border-2 px-4 py-3 text-left font-semibold transition ${
                        selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"
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
                onKeyDown={(e) => e.key === "Enter" && advance(false)}
                placeholder="Type your answer..."
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-4 text-lg font-semibold focus:border-primary focus:outline-none"
                autoFocus
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm font-bold text-muted-foreground">Question {idx + 1} of {total}</div>
            <button
              onClick={() => advance(false)}
              className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card"
            >
              {idx + 1 >= total ? "Finish →" : "Next →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
