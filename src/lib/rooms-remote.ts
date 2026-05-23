import { supabase } from "@/integrations/supabase/client";
import type { Quiz } from "./quiz-store";

export interface RemotePlayer {
  id: string;
  name: string;
  score: number;
  answered_idx: number;
  finished: boolean;
}

export interface RemoteRoom {
  code: string;
  quiz_id: string;
  quiz_data: Quiz;
  host_id: string;
  started: boolean;
  started_at: string | null;
  created_at: string;
}

function gen4(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function createRoomRemote(quiz: Quiz, hostId: string): Promise<RemoteRoom> {
  // Try a few codes in case of collision
  for (let i = 0; i < 8; i++) {
    const code = gen4();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        quiz_id: quiz.id,
        quiz_data: quiz as never,
        host_id: hostId,
      })
      .select()
      .single();
    if (!error && data) return data as unknown as RemoteRoom;
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
      throw error;
    }
  }
  throw new Error("Could not allocate a room code, please try again.");
}

export async function fetchRoom(code: string): Promise<RemoteRoom | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as RemoteRoom) ?? null;
}

export async function fetchPlayers(code: string): Promise<RemotePlayer[]> {
  const { data, error } = await supabase
    .from("room_players")
    .select("id, name, score, answered_idx, finished")
    .eq("room_code", code)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as RemotePlayer[]) ?? [];
}

export async function joinRoomRemote(code: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from("room_players")
    .insert({ room_code: code, name })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function startRoomRemote(code: string): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .update({ started: true, started_at: new Date().toISOString() })
    .eq("code", code);
  if (error) throw error;
}

export async function updatePlayerRemote(
  playerId: string,
  patch: { score?: number; answered_idx?: number; finished?: boolean },
): Promise<void> {
  const { error } = await supabase.from("room_players").update(patch).eq("id", playerId);
  if (error) throw error;
}

export function subscribeRoom(
  code: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`room-${code}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_players", filter: `room_code=eq.${code}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
