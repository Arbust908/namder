"use client";

import { useRouter } from "next/navigation";
import About from "../(marketing)/About";

export default function AboutPage() {
  const router = useRouter();
  return <About onBack={() => router.push("/")} />;
}
