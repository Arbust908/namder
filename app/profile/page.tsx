"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Profile from "./Profile";
import { useAuthGate } from "@/hooks/useAuthGate";
import { apiCreateRoom, apiListMyRooms, type MyRoomData } from "@/lib/api-client";
import { GENDERS } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  // Genuinely anonymous visitors (cold hit to /profile) bounce home.
  const state = useAuthGate((s) => s.kind === "anonymous", "/");
  const [startingGroup, setStartingGroup] = useState(false);
  const [rooms, setRooms] = useState<MyRoomData[]>([]);

  // Fetch the user's groups.
  useEffect(() => {
    if (state.kind === "anonymous") return;
    apiListMyRooms().then(setRooms).catch(() => {});
  }, [state.kind]);

  if (state.kind === "anonymous") return null;

  const startGroup = async () => {
    if (startingGroup) return;
    setStartingGroup(true);
    try {
      const room = await apiCreateRoom({ gender: GENDERS.either });
      if (room.code) {
        router.push(`/room/${room.code}`);
      }
    } finally {
      setStartingGroup(false);
    }
  };

  return (
    <Profile
      onLoggedOut={() => router.push("/")}
      onStartGroup={startGroup}
      startingGroup={startingGroup}
      rooms={rooms}
    />
  );
}
