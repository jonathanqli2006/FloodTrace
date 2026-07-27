import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FloodTrace — SAR Flood Monitoring",
  description: "Interactive Sentinel-1 SAR flood detection and monitoring platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="h-screen overflow-hidden bg-[#f7f5f2] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
