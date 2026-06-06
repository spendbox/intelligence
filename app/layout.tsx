import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folio — The unfair advantage your business needs",
  description:
    "Monthly business intelligence for small businesses. Stay ahead of the competition.",
  metadataBase: new URL("https://folio.cafe"),
  openGraph: {
    title: "Folio — The unfair advantage your business needs",
    description:
      "Monthly business intelligence for small businesses. Stay ahead of the competition.",
    url: "https://folio.cafe",
    siteName: "Folio",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
