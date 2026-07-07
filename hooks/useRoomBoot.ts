// hooks/useRoomBoot.ts
// Boot sequence for the room page: ensure identity → join room → load deck.
// Extracted from room/[code]/page.tsx to keep the page component lean.

import { useEffect, useState } from "react";
import { ensureGuest } from "@/lib/guestAuth";
import { joinGroup, findRoomByCode } from "@/lib/groups";
import { loadDeck } from "@/lib/vote";
import { getBrowserPb } from "@/lib/pb";
import type { DeckName } from "@/lib/types";

interface BootState {
  roomId: string | null;
  memberId: string | null;
  roomCode: string;
  deck: DeckName[];
  displayName: string;
  error: string | null;
  loading: boolean;
}

export function useRoomBoot(code: string): BootState {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState(code);
  const [deck, setDeck] = useState<DeckName[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        await ensureGuest();
        if (cancelled) return;

        const room = await findRoomByCode(code);
        if (!room) { setError("Sala no encontrada."); setLoading(false); return; }
        if (cancelled) return;

        const { memberId: mid } = await joinGroup(code);
        if (cancelled) return;

        setRoomId(room.id);
        setRoomCode(room.code);
        setMemberId(mid);

        const pb = getBrowserPb();
        setDisplayName(pb.authStore.record?.display || "Guest");

        const names = await loadDeck(room.id, room.gender);
        if (cancelled) return;
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
        if (!cancelled) setError("No pudimos cargar la sala. Probá de nuevo.");
        setLoading(false);
      }
    }
    if (code) boot();
    return () => { cancelled = true; };
  }, [code]);

  return { roomId, memberId, roomCode, deck, displayName, error, loading };
}
