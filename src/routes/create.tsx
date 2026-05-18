import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { addQuiz, uid, type Question, type QuestionType } from "@/lib/quiz-store";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function blankQ(type: QuestionType = "mcq"): Question {
  return {
    id: uid(),
    type,
    prompt: "",
    options: type === "mcq" ? ["", "", "", ""] : undefined,
    answer: type === "mcq" ? "0" : "",
  };
}

function CreatePage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([blankQ()]);

  const updateQ = (i: number, patch: Partial<Question>) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const changeType = (i: number, type: QuestionType) => {
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== i) return q;
        return {
          ...q,
          type,
          options: type === "mcq" ? q.options ?? ["", "", "", ""] : undefined,
          answer: type === "mcq" ? "0" : "",
        };
      }),
    );
  };

  const onImage = (i: number, file: File | null) => {
    if (!file) return updateQ(i, { image: undefined });
    const reader = new FileReader();
    reader.onload = () => updateQ(i, { image: reader.result as string });
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!title.trim()) return alert("Add a title");
    const cleaned = questions.filter((q) => q.prompt.trim() && (q.type !== "mcq" || (q.options && q.options.every((o) => o.trim()))));
    if (cleaned.length === 0) return alert("Add at least one complete question");
    const id = uid();
    addQuiz({ id, title: title.trim(), description: description.trim(), questions: cleaned, createdAt: Date.now() });
    nav({ to: "/quiz/$quizId", params: { quizId: id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Create a new quiz</h1>
        <p className="mt-2 text-muted-foreground">Mix multiple choice, one-word and fill-in-the-blank questions.</p>

        <div className="mt-8 space-y-4 rounded-2xl border-2 border-border bg-card p-6 shadow-card">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz title — e.g. World Capitals"
            className="w-full border-b-2 border-border bg-transparent pb-2 text-3xl font-extrabold tracking-tight placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={2}
            className="w-full resize-none rounded-lg bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mt-8 space-y-5">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border-2 border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Question {i + 1}</span>
                <div className="flex gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => changeType(i, e.target.value as QuestionType)}
                    className="rounded-lg border-2 border-border bg-background px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-primary"
                  >
                    <option value="mcq">Multiple choice</option>
                    <option value="one-word">One-word answer</option>
                    <option value="fill-blank">Fill in the blank</option>
                  </select>
                  {questions.length > 1 && (
                    <button
                      onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                      className="rounded-lg border-2 border-border px-3 py-1.5 text-sm font-semibold hover:bg-destructive hover:text-destructive-foreground"
                    >Remove</button>
                  )}
                </div>
              </div>

              <textarea
                value={q.prompt}
                onChange={(e) => updateQ(i, { prompt: e.target.value })}
                placeholder={q.type === "fill-blank" ? "Use ____ to mark the blank. e.g. Capital of Australia is ____." : "Type your question..."}
                rows={2}
                className="mt-4 w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-lg font-semibold focus:outline-none focus:border-primary"
              />

              <div className="mt-4">
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
                  📷 {q.image ? "Replace image" : "Add image (optional)"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(i, e.target.files?.[0] ?? null)} />
                </label>
                {q.image && (
                  <div className="mt-3 relative inline-block">
                    <img src={q.image} alt="" className="max-h-48 rounded-xl border-2 border-border" />
                    <button onClick={() => updateQ(i, { image: undefined })} className="absolute -right-2 -top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">×</button>
                  </div>
                )}
              </div>

              {q.type === "mcq" ? (
                <div className="mt-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Options · pick the correct one</span>
                  {q.options!.map((opt, oi) => (
                    <label key={oi} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 transition ${q.answer === String(oi) ? "border-primary bg-primary/5" : "border-border"}`}>
                      <input
                        type="radio"
                        name={`answer-${q.id}`}
                        checked={q.answer === String(oi)}
                        onChange={() => updateQ(i, { answer: String(oi) })}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...q.options!];
                          next[oi] = e.target.value;
                          updateQ(i, { options: next });
                        }}
                        placeholder={`Option ${oi + 1}`}
                        className="w-full bg-transparent font-semibold focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Correct answer</span>
                  <input
                    value={q.answer}
                    onChange={(e) => updateQ(i, { answer: e.target.value })}
                    placeholder={q.type === "one-word" ? "One word..." : "Word(s) that fill the blank"}
                    className="mt-2 w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setQuestions((qs) => [...qs, blankQ()])}
            className="rounded-xl border-2 border-dashed border-border px-5 py-3 font-bold hover:bg-muted"
          >+ Add question</button>
          <button
            onClick={save}
            className="ml-auto rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card hover:opacity-95"
          >Save quiz</button>
        </div>
      </main>
    </div>
  );
}
