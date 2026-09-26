import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "NewsLingo — Hebrew, one story at a time",
  description: "Build your Hebrew through thoughtfully guided reading. Read, explore words, and learn through original demo stories.",
  applicationName: "NewsLingo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
