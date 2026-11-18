import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAVR-Dyna Console — Change-Aware Model-Based RL",
  description:
    "Research console for CAVR-Dyna: a Dyna-style tabular agent with Dirichlet transition models, calibrated CUSUM change detection, and counterfactual prioritized repair, evaluated on dynamic 9×9 mazes. Browse checkpoints, results, figures and held-out verification.",
  keywords: [
    "CAVR-Dyna",
    "reinforcement learning",
    "Dyna",
    "CUSUM",
    "non-stationary MDP",
    "D* Lite",
  ],
  authors: [{ name: "CAVR-Dyna Project" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
