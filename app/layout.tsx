import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mac Tidar Forms",
  description: "Create forms, collect responses in a spreadsheet, and see them on a dashboard.",
  icons: { icon: "/mark.webp" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
