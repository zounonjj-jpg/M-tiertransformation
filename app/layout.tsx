import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXBIZ AI — From Skills to Business",
  description: "Transformez votre métier, vos compétences et vos talents en une activité professionnelle numérique grâce à l’intelligence artificielle.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
