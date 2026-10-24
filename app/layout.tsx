import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "在庫検索",
  description: "商品名・JANコード・カテゴリで在庫を検索できるアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-slate-50">{children}</body>
    </html>
  );
}
