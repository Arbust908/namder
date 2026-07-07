import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namder — Find a name you all love",
  description:
    "Swipe through baby names with your partner. Stars appear when everyone agrees.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
