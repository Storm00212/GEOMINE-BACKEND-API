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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthNav />
        {children}
      </body>
    </html>
  );
}
