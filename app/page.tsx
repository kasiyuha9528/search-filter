import { Suspense } from "react";
import SearchPage from "@/components/SearchPage";

export default function Home() {
  return (
    // SearchPage は useSearchParams(URLのクエリを読むフック)を使うため、Suspense で囲む必要がある。
    // URLを読めるようになるまでの間、fallback の表示が先に出る
    <Suspense
      fallback={<p className="py-10 text-center text-slate-500">読み込み中…</p>}
    >
      <SearchPage />
    </Suspense>
  );
}
