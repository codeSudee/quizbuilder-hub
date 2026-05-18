export type QuestionType = "mcq" | "one-word" | "fill-blank";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  image?: string; // data URL
  options?: string[]; // for mcq
  answer: string; // for mcq: index as string; for others: the text
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  cover?: string;
  questions: Question[];
  createdAt: number;
}

const KEY = "quizly.quizzes.v1";
const AUTH_KEY = "quizly.auth.v1";

export function loadQuizzes(): Quiz[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveQuizzes(qs: Quiz[]) {
  localStorage.setItem(KEY, JSON.stringify(qs));
}

export function addQuiz(q: Quiz) {
  const all = loadQuizzes();
  all.unshift(q);
  saveQuizzes(all);
}

export function getQuiz(id: string): Quiz | undefined {
  return loadQuizzes().find((q) => q.id === id);
}

export function deleteQuiz(id: string) {
  saveQuizzes(loadQuizzes().filter((q) => q.id !== id));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Auth (frontend only stub)
export function getUser(): { name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}
export function setUser(u: { name: string; email: string } | null) {
  if (!u) localStorage.removeItem(AUTH_KEY);
  else localStorage.setItem(AUTH_KEY, JSON.stringify(u));
}

export function seedIfEmpty() {
  if (loadQuizzes().length > 0) return;
  const sample: Quiz = {
    id: uid(),
    title: "World Capitals",
    description: "A quick geography warm-up.",
    createdAt: Date.now(),
    questions: [
      { id: uid(), type: "mcq", prompt: "Capital of France?", options: ["Berlin", "Paris", "Madrid", "Rome"], answer: "1" },
      { id: uid(), type: "one-word", prompt: "Capital of Japan?", answer: "Tokyo" },
      { id: uid(), type: "fill-blank", prompt: "The capital of Australia is ____.", answer: "Canberra" },
    ],
  };
  saveQuizzes([sample]);
}
