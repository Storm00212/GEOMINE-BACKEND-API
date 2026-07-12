import type { Metadata } from "next";
import "./globals.css";
import AuthNav from "./components/auth-nav";

export const metadata: Metadata = {
  title: "Geomine PMS",
  description: "Predictive maintenance logging for Geomine generators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B0D12] text-slate-100">
        <AuthNav />
        {children}
      </body>
    </html>
  );
}
