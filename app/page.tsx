"use client";

import { useRouter } from "next/navigation";
import Landing from "./(marketing)/Landing";

// Landing is the cold-visitor front door. "Empezar gratis" no longer creates
// a guest+room inline — it sends the visitor to the Welcome gate first
// (collect a name / register), then on to Profile, where the room is created.
export default function Home() {
  const router = useRouter();
  return (
    <Landing
      onStart={() => router.push("/welcome")}
      onAbout={() => router.push("/about")}
    />
  );
}
