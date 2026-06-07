import type { Metadata } from "next";
import "./globals.css";
import NavProgress from "@/components/NavProgress";

const TITLE = "Folio — Get the leads. Close the business.";
const DESC =
  "Folio is Nigeria's leads marketplace. Clients post free requests, vetted businesses unlock the contact and reach out. Real customers, no spam, fair pricing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  metadataBase: new URL("https://folio.cafe"),
  themeColor: "#7c3aed",
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "https://folio.cafe",
    siteName: "Folio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavProgress />
        {children}
      </body>
    </html>
  );
}
