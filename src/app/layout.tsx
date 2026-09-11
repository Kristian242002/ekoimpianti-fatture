import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Documenti EKO",
  description: "Generatore preventivi e dichiarazioni di conformità",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={archivo.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}