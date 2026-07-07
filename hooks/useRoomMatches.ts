// hooks/useRoomMatches.ts
// Subscribe to a room's match rows. Returns the live list, re-rendering
// whenever any vote anywhere flips a star. This is the realtime core.
import { useEffect, useState, useCallback } from "react";
import { getBrowserPb } from "@/lib/pb";

export type MatchRow = {
  id: string;
  room: string;
  name: string;          // relation id; expand to get the name record
  like_count: number;
  is_star: boolean;
  expand?: { name?: { name: string; meaning: string; gender: string } };
};

export function useRoomMatches(roomId: string | null) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const pb = getBrowserPb();

  const load = useCallback(async () => {
    if (!roomId) return;
    const rows = await pb.collection("matches").getFullList<MatchRow>({
      filter: `room = "${roomId}"`,
      sort: "-is_star,-like_count",
      expand: "name",
    });
    setMatches(rows);
  }, [roomId, pb]);

  useEffect(() => {
    if (!roomId) return;
    load();

    // Realtime: PB pushes create/update/delete for matching records.
    const unsub = pb.collection("matches").subscribe<MatchRow>(
      "*",
      (e) => {
        setMatches((prev) => {
          const next = prev.filter((m) => m.id !== e.record.id);
          if (e.action !== "delete") next.push(e.record);
          // keep stars first, then by like_count
          next.sort(
            (a, b) =>
              Number(b.is_star) - Number(a.is_star) ||
              b.like_count - a.like_count
          );
          return next;
        });
      },
      { filter: `room = "${roomId}"`, expand: "name" }
    );

    return () => {
      unsub.then((fn) => fn());
    };
  }, [roomId, load, pb]);

  const stars = matches.filter((m) => m.is_star);
  return { matches, stars, reload: load };
}
