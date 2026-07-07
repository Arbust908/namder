"use client";

import { useRouter } from "next/navigation";
import Profile from "./Profile";
import { getAuthState } from "@/lib/authState";

export default function ProfilePage() {
  const router = useRouter();
  const state = getAuthState();

  if (state.kind === "anonymous") {
    router.push("/");
    return null;
  }

  return <Profile onLoggedOut={() => router.push("/")} />;
}
