import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BalkanBus | Bus travel across Albania",
  description: "Compare and book reliable bus journeys across Albania.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
