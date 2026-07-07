"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Profile from "./Profile";
import { getAuthState, AuthState } from "@/lib/authState";

export default function ProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ kind: "anonymous" });

  useEffect(() => {
    setState(getAuthState());
  }, []);

  if (state.kind === "anonymous") {
    router.push("/");
    return null;
  }

  return <Profile onLoggedOut={() => router.push("/")} />;
}
