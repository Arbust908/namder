"use client";

import { useRouter } from "next/navigation";
import Welcome from "@/app/(auth)/Welcome";
import { useAuthGate } from "@/hooks/useAuthGate";

// Route for the gate. Welcome handles guest/register; once a session exists
// it calls onReady, and we send the user to Profile to start a group.
// If a session already exists (guest or registered in localStorage), skip
// the gate entirely and redirect to /profile.
export default function WelcomePage() {
  const router = useRouter();
  const state = useAuthGate((s) => s.kind !== "anonymous", "/profile");

  if (state.kind !== "anonymous") return null;

  return <Welcome onReady={() => router.push("/profile")} />;
}
