// hooks/useRoomBoot.ts
// Boot sequence for the room page: ensure identity → join room → load deck.

import { useEffect, useState } from "react";
import { ensureGuest } from "@/lib/guestAuth";
import { joinGroup, findRoomByCode } from "@/lib/groups";
import { loadDeck } from "@/lib/vote";
import { getProfile, apiListMyVotes, type NameData } from "@/lib/api-client";

interface BootState {
  roomId: string | null;
  memberId: string | null;
  roomCode: string;
  deck: NameData[];
  displayName: string;
  error: string | null;
  loading: boolean;
  hasVotes: boolean;
}

export function useRoomBoot(code: string): BootState {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState(code);
  const [deck, setDeck] = useState<NameData[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVotes, setHasVotes] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        await ensureGuest();
        if (cancelled) return;

        const room = await findRoomByCode(code);
        if (!room) {
          setError("Sala no encontrada.");
          setLoading(false);
          return;
        }
        if (cancelled) return;

        const { memberId: mid } = await joinGroup(code);
        if (cancelled) return;

        setRoomId(room.id);
        setRoomCode(room.code);
        setMemberId(mid);

        const profile = getProfile();
        setDisplayName(profile?.display || "Guest");

        const [names, myVotes] = await Promise.all([
          loadDeck(room.id, room.gender),
          apiListMyVotes(room.id).catch(() => []),
        ]);
        if (cancelled) return;

        setHasVotes(myVotes.length > 0);
        setDeck(
          names.map((n) => ({
            id: n.id,
            name: n.name,
            gender: n.gender,
            origin: n.origin,
            meaning: n.meaning,
          }))
        );
        setLoading(false);
      } catch {
        if (!cancelled)
          setError("No pudimos cargar la sala. Probá de nuevo.");
        setLoading(false);
      }
    }
    if (code) boot();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return { roomId, memberId, roomCode, deck, displayName, error, loading, hasVotes };
}
