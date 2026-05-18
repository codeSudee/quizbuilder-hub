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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground text-primary font-extrabold">Q</div>
          <span className="text-2xl font-extrabold">Quizly</span>
        </Link>
        <div>
          <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
            Smarter studying starts here.
          </h2>
          <p className="mt-4 max-w-md text-lg text-primary-foreground/80">
            Join thousands of learners building quizzes that actually stick.
          </p>
          <div className="mt-10 rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur">
            <div className="text-sm font-bold uppercase tracking-wide opacity-80">Today's streak</div>
            <div className="mt-2 text-4xl font-extrabold">🔥 7 days</div>
          </div>
        </div>
        <p className="text-sm opacity-70">© {new Date().getFullYear()} Quizly</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">Q</div>
            <span className="text-xl font-extrabold">Quizly</span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "login" ? "Log in to keep learning." : "Start building your first quiz in seconds."}
          </p>

          <div className="mt-6 inline-flex rounded-xl border-2 border-border bg-muted p-1 text-sm font-bold">
            <button
              onClick={() => setMode("login")}
              className={`rounded-lg px-4 py-1.5 ${mode === "login" ? "bg-background shadow-card" : "text-muted-foreground"}`}
            >Log in</button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-lg px-4 py-1.5 ${mode === "signup" ? "bg-background shadow-card" : "text-muted-foreground"}`}
            >Sign up</button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field label="Full name">
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ada Lovelace" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </Field>

            <button type="submit" className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-card hover:opacity-95">
              {mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By continuing you agree to our terms.
          </p>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 2px solid var(--color-border);
          background: var(--color-background);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          font-weight: 500;
          outline: none;
          transition: border-color .15s;
        }
        .input:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}
