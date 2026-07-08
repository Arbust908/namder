"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Landing from "./(marketing)/Landing";
import { ensureGuest } from "@/lib/guestAuth";
import { apiCreateRoom } from "@/lib/api-client";

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await ensureGuest();

      const room = await apiCreateRoom({ gender: "either" });
      if (room.code) {
        router.push(`/room/${room.code}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAbout = () => router.push("/about");

  return <Landing onStart={handleStart} onAbout={handleAbout} />;
}
