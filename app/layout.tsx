import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SupportChatWidget } from "@/components/support/chat-widget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adyn - Marketing Intelligence Platform",
  description: "AI-powered marketing campaign generation across Facebook, Instagram, TikTok, and Google",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <SupportChatWidget />
        </Providers>
      </body>
    </html>
  );
}
