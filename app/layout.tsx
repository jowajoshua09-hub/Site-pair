import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PEAK-MD PAIR - Link WhatsApp in 20s",
  description: "Fastest WhatsApp Pair Code Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  );
}
