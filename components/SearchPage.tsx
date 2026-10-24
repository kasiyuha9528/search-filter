"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/getProducts";
import type { Product } from "@/lib/types";
import ProductList from "./ProductList";

// 画面の状態:読み込み中 / 成功 / 失敗 のどれか1つ
type LoadState =
  | { status: "loading" }
  | { status: "success"; products: Product[] }
  | { status: "error"; message: string };

export default function SearchPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // 再読み込みボタンを押すたびに +1 して、useEffect を再実行させる
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // 画面を離れた後に結果が返ってきても、state を更新しないための目印
    let ignore = false;

    getProducts()
      .then((products) => {
        if (!ignore) setState({ status: "success", products });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          const message = error instanceof Error ? error.message : "不明なエラー";
          setState({ status: "error", message });
        }
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  function handleReload() {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900">在庫検索</h1>

      {state.status === "loading" && (
        <p className="py-10 text-center text-slate-500">読み込み中…</p>
      )}

      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-800">データを読み込めませんでした</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
          <button
            type="button"
            onClick={handleReload}
            className="mt-4 min-h-11 rounded-lg border border-red-300 bg-white px-5 font-bold text-red-800"
          >
            再読み込み
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          <p className="mb-3 text-sm text-slate-600">{state.products.length}件</p>
          <ProductList products={state.products} />
        </>
      )}
    </main>
  );
}
