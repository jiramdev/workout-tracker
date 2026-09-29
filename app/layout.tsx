// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Anton } from "next/font/google";
import "./globals.css";
import BottomBar from "@/components/BottomBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Track je gym sessies, sets en gewicht",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymTracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#baa3d0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="dark">
      <body
        className={`${inter.variable} ${anton.variable} font-sans antialiased min-h-screen selection:bg-[#141416] selection:text-[#baa3d0]`}
      >
        {children}
        <BottomBar />
      </body>
    </html>
  );
}