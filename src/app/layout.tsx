import type { Metadata } from "next";
import { Heebo, Frank_Ruhl_Libre, DM_Sans } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./styles.css";

export const metadata: Metadata = {
  title: "NewsLingo — Hebrew, one story at a time",
  description: "Build your Hebrew through thoughtfully guided reading. Read, explore words, and learn through real publisher news and original demo stories.",
  applicationName: "NewsLingo",
};

const heebo = Heebo({ subsets: ["hebrew", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-heebo", display: "swap" });
const frankRuhl = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-frank-ruhl", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans", display: "swap" });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${heebo.variable} ${frankRuhl.variable} ${dmSans.variable}`}>
    <body><AppShell>{children}</AppShell></body>
  </html>;
}
