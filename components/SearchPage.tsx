"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { filterProducts, getCategories } from "@/lib/filterProducts";
import { getProducts } from "@/lib/getProducts";
import type { Product } from "@/lib/types";
import ProductList from "./ProductList";
import SearchForm from "./SearchForm";

// 画面の状態:読み込み中 / 成功 / 失敗 のどれか1つ
type LoadState =
  | { status: "loading" }
  | { status: "success"; products: Product[] }
  | { status: "error"; message: string };

// 読み込み前に使う空の配列。毎回新しい配列を作ると useMemo が毎回計算し直すので、1つを使い回す
const NO_PRODUCTS: Product[] = [];

export default function SearchPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // 再読み込みボタンを押すたびに +1 して、useEffect を再実行させる
  const [reloadKey, setReloadKey] = useState(0);

  // 検索条件。入力したらすぐ画面に反映したいので、まず state に持つ(URLへの保存は Step 4)
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  // 入力した瞬間の時刻。100ms以内に更新される、という達成基準の計測に使う
  const inputStartRef = useRef<number | null>(null);

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

  const products = state.status === "success" ? state.products : NO_PRODUCTS;

  // カテゴリの一覧は、商品データが変わったときだけ作り直す
  const categories = useMemo(() => getCategories(products), [products]);

  // 絞り込み結果は、商品・検索語・カテゴリのどれかが変わったときだけ計算し直す
  const filtered = useMemo(
    () => filterProducts(products, query, category),
    [products, query, category],
  );

  // 画面の更新が終わったら、入力からの経過時間をコンソールに出す(Step 6の検証で使う)
  useEffect(() => {
    if (inputStartRef.current === null) return;
    const elapsed = performance.now() - inputStartRef.current;
    inputStartRef.current = null;
    console.log(`[検索] 入力→画面更新 ${elapsed.toFixed(1)}ms / ${filtered.length}件`);
  }, [filtered]);

  function handleQueryChange(value: string) {
    inputStartRef.current = performance.now();
    setQuery(value);
  }

  function handleCategoryChange(next: string | null) {
    inputStartRef.current = performance.now();
    setCategory(next);
  }

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
          <SearchForm
            query={query}
            onQueryChange={handleQueryChange}
            categories={categories}
            selectedCategory={category}
            onCategoryChange={handleCategoryChange}
          />

          <p className="mb-3 mt-4 text-sm text-slate-600">
            {products.length}件中 {filtered.length}件
          </p>

          {filtered.length > 0 ? (
            <ProductList products={filtered} />
          ) : (
            // 仮の表示。Step 5 で「条件をクリア」ボタン付きの EmptyState に置き換える
            <p className="py-10 text-center text-slate-500">該当する商品がありません</p>
          )}
        </>
      )}
    </main>
  );
}
