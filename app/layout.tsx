import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ToastContainer } from "react-toastify";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Farm 2 Markets",
  description: "Meat inventory tracking for warehouse staff and managers",
  generator: "Visioad",
  icons: {
    icon: [
      {
        url: "/logo.png",
      },
    ],  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ToastContainer />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
