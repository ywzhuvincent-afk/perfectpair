import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { LangProvider } from "@/components/lang-provider";
import { getLang } from "@/lib/i18n-server";
import "./globals.css";
import "./profile-responsive.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export async function generateMetadata(): Promise<Metadata> {
  return (await getLang()) === "zh"
    ? { title: "PerfectPair — 独立的内衣与丝袜合身研究", description: "独立的产品资料、结构化试穿点评和只属于你的私人匹配，帮你挑到更合身的内衣和丝袜。" }
    : { title: "PerfectPair — Independent bra & tights intelligence", description: "Independent product data, structured wear reviews and private matching for bras and tights." };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang === "zh" ? "zh-CN" : "en"}
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><LangProvider lang={lang}>{children}</LangProvider></body>
    </html>
  );
}
