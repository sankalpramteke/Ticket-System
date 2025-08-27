import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Campus Ticket System",
  description: "Report and manage campus issues",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-[17px] leading-relaxed`}
      >
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
