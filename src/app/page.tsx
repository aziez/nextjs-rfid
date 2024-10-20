// app/page.tsx
"use client";

import { RFIDReader } from "@/components/RFIDReader";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <RFIDReader />
    </main>
  );
}
