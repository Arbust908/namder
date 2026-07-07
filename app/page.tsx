"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Landing from "./(marketing)/Landing";
import { ensureGuest } from "@/lib/guestAuth";

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Ensure guest identity first so we can create a room
      await ensureGuest();

      // Create a room via the API
      const token = (await import("@/lib/pb")).getBrowserPb().authStore.token;
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender: "either", ownerToken: token }),
      });
      const { code } = await res.json();
      if (code) {
        router.push(`/room/${code}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAbout = () => router.push("/about");

  return <Landing onStart={handleStart} onAbout={handleAbout} />;
}
