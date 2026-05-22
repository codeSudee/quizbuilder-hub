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
  timePerQuestion?: number; // seconds, default 20
}

const KEY = "quizly.quizzes.v1";
const ROOMS_KEY = "quizly.rooms.v1";
const SCORES_KEY = "quizly.scores.v1";

export interface ScoreEntry {
  id: string;
  quizId: string;
  quizTitle: string;
  player: string;
  score: number;
  total: number;
  pct: number;
  at: number;
}

export function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SCORES_KEY) || "[]"); } catch { return []; }
}
export function saveScore(entry: Omit<ScoreEntry, "id" | "at">) {
  const all = loadScores();
  all.unshift({ ...entry, id: Math.random().toString(36).slice(2, 10), at: Date.now() });
  localStorage.setItem(SCORES_KEY, JSON.stringify(all.slice(0, 500)));
}
export function clearScores() {
  localStorage.removeItem(SCORES_KEY);
}

export interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  answeredIdx: number; // last question index answered
  finished: boolean;
}

export interface Room {
  code: string;
  quizId: string;
  hostId: string;
  players: RoomPlayer[];
  started: boolean;
  startedAt?: number;
  createdAt: number;
}

export function loadRooms(): Record<string, Room> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ROOMS_KEY) || "{}"); } catch { return {}; }
}
export function saveRoom(room: Room) {
  const all = loadRooms();
  all[room.code] = room;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(all));
  try { new BroadcastChannel("quizly-rooms").postMessage({ code: room.code }); } catch {}
}
export function getRoom(code: string): Room | undefined {
  return loadRooms()[code.toUpperCase()];
}
export function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
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
