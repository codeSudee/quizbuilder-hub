import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { setUser } from "@/lib/quiz-store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setUser({ name: name || email.split("@")[0], email });
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">Q</div>
          <span className="text-2xl font-extrabold tracking-tight">Quizly</span>
        </Link>
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-95"
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </header>

      <main className="mx-auto grid max-w-7xl gap-12 px-6 py-10 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col justify-center">
          <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.95] tracking-tighter">
            LEARN,
            <br />
            PLAY, AND
            <br />
            WIN. <span className="text-primary">TOGETHER.</span>
          </h1>
          <p className="mt-8 max-w-md text-lg text-foreground/80">
            Build quizzes with images, multiple choice, one-word answers and
            fill-in-the-blanks. Host live with friends, climb the leaderboard, and
            make studying click.
          </p>

          <div className="mt-10 flex flex-wrap gap-6">
            <Feature emoji="⚡" title="Live rooms" desc="4-digit codes" />
            <Feature emoji="🏆" title="Leaderboards" desc="Track every score" />
            <Feature emoji="🎨" title="Rich media" desc="Add images & more" />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border-2 border-foreground bg-card p-8 shadow-[8px_8px_0_0_var(--foreground)] sm:p-10">
            <div className="inline-flex rounded-full border-2 border-border bg-muted p-1 text-sm font-bold">
              <button
                onClick={() => setMode("login")}
                className={`rounded-full px-5 py-1.5 transition ${mode === "login" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >Log in</button>
              <button
                onClick={() => setMode("signup")}
                className={`rounded-full px-5 py-1.5 transition ${mode === "signup" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >Sign up</button>
            </div>

            <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login" ? "Log in to keep learning." : "Start building in seconds — no card required."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <Field label="Full name">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="lp-input" placeholder="Ada Lovelace" />
                </Field>
              )}
              <Field label="Email">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="lp-input" placeholder="you@example.com" />
              </Field>
              <Field label="Password">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="lp-input" placeholder="••••••••" />
              </Field>

              <button type="submit" className="w-full rounded-full bg-primary py-3.5 font-bold text-primary-foreground shadow-card transition hover:opacity-95">
                {mode === "login" ? "Log in" : "Get started for free"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={() => { setUser({ name: "Guest", email: "guest@quizly.app" }); nav({ to: "/" }); }}
              className="w-full rounded-full border-2 border-border py-3 text-sm font-bold hover:bg-muted"
            >
              Continue as guest
            </button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our terms & privacy policy.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .lp-input {
          width: 100%;
          border-radius: 9999px;
          border: 2px solid var(--color-border);
          background: var(--color-background);
          padding: 0.85rem 1.1rem;
          font-size: 0.95rem;
          font-weight: 500;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .lp-input:focus {
          border-color: var(--color-foreground);
          box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary) 20%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Feature({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-foreground bg-card text-xl shadow-card">{emoji}</div>
      <div>
        <div className="text-sm font-extrabold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
