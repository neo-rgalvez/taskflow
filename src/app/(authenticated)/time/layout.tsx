import type { Metadata } from "next";

export const metadata: Metadata = { title: "Time Tracking" };

export default function TimeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
