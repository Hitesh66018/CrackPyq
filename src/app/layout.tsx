import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrackPYQ - Master Competitive Exams",
  description: "AI-powered PYQ platform for GATE, JEE, NEET, and SSC.",
};

import { ToastProvider } from "@/components/ToastProvider";
import { BugReporter } from "@/components/ui/BugReporter";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ToastProvider />
        <BugReporter />
      </body>
    </html>
  );
}
