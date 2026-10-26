"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterProducts, getCategories } from "@/lib/filterProducts";
import { getProducts } from "@/lib/getProducts";
import type { Product } from "@/lib/types";
import EmptyState from "./EmptyState";
import ProductList from "./ProductList";
import SearchForm from "./SearchForm";

// 画面の状態:読み込み中 / 成功 / 失敗 のどれか1つ
type LoadState =
  | { status: "loading" 
  | { status: "success"; products: Product[] }
  | { status: "error"; message: string };

// 読み込み前に使う空の配列。毎回新しい配列を作ると useMemo が毎回計算し直すので、1つを使い回す
const NO_PRODUCTS: Product[] = [];

// 入力が止まってからURLを書き換えるまでの待ち時間(ミリ秒)。結果の表示は待たせない
const URL_UPDATE_DELAY_MS = 300;

export default function SearchPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // 再読み込みボタンを押すたびに +1 して、useEffect を再実行させる
  const [reloadKey, setReloadKey] = useState(0);

  // 検索条件の初期値は、URLの ?q=xxx&category=yyy から読み込む。
  // リロードしたときや、共有されたURLを開いたときに、同じ条件が復元される。
  // 以降は、入力したらすぐ画面に反映したいので state で持ち、URLへは書き込むだけにする
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [category, setCategory] = useState<string | null>(
    () => searchParams.get("category") || null,
  );

  // 計測ログ(100ms以内に更新される、という達成基準の確認用)は、開発者のためのもの。
  // 公開したサイトでは出さず、URLに ?debug=1 が付いているときだけ出す。
  // 最初に1回だけ読む(URLの書き換えで debug が消えても、計測の途中で止まらないように)
  const [debug] = useState(() => searchParams.get("debug") === "1");

  // 入力した瞬間の時刻。debug のときだけ記録する
  const inputStartRef = useRef<number | null>(null);
  function markInputStart() {
    if (debug) inputStartRef.current = performance.now();
  }

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

  // URLに存在しないカテゴリ(例: ?category=存在しない値)が書かれていても壊れないよう、
  // 実在するカテゴリのときだけ使い、それ以外は「すべて」(null)として扱う
  const activeCategory = category !== null && categories.includes(category) ? category : null;

  // 絞り込み結果は、商品・検索語・カテゴリのどれかが変わったときだけ計算し直す
  const filtered = useMemo(
    () => filterProducts(products, query, activeCategory),
    [products, query, activeCategory],
  );

  // いまの検索条件を、URLに書き込む。履歴を増やさないよう push ではなく replaceState を使う
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    const trimmedQuery = query.trim();
    if (trimmedQuery !== "") params.set("q", trimmedQuery);
    if (activeCategory !== null) params.set("category", activeCategory);
    // 計測中にリロードしても、ログが出続けるよう debug=1 を残す
    if (debug) params.set("debug", "1");

    const search = params.toString();
    // URLがすでに同じなら何もしない
    if (search === window.location.search.slice(1)) return;

    const path = window.location.pathname;
    window.history.replaceState(null, "", search === "" ? path : `${path}?${search}`);
  }, [query, activeCategory, debug]);

  // 入力している間は、止まってから0.3秒後にURLを書き込む(1文字ごとに書き換えないため)。
  // データの読み込みが終わってから書く(読み込み前はカテゴリを確かめられず、URLを消してしまうため)
  const isLoaded = state.status === "success";
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(syncUrl, URL_UPDATE_DELAY_MS);

    // 入力が続いている間は、前の予約を取り消して待ち直す
    return () => clearTimeout(timer);
  }, [isLoaded, syncUrl]);

  // 画面の更新が終わったら、入力からの経過時間をコンソールに出す(?debug=1 のときだけ。Step 6の検証で使う)
  useEffect(() => {
    if (inputStartRef.current === null) return;
    const elapsed = performance.now() - inputStartRef.current;
    inputStartRef.current = null;
    console.log(`[検索] 入力→画面更新 ${elapsed.toFixed(1)}ms / ${filtered.length}件`);
  }, [filtered]);

  function handleQueryChange(value: string) {
    markInputStart();
    setQuery(value);
  }

  function handleCategoryChange(next: string | null) {
    markInputStart();
    setCategory(next);
  }

  // 0件のときの「条件をクリア」。検索語だけ・カテゴリだけ・両方、の3通り
  function handleClearQuery() {
    markInputStart();
    setQuery("");
  }

  function handleClearAll() {
    markInputStart();
    setQuery("");
    setCategory(null);
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
            onQueryBlur={syncUrl}
            categories={categories}
            selectedCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />

          <p className="mb-3 mt-3 text-sm text-slate-600">
            {products.length}件中 {filtered.length}件
          </p>

          {filtered.length > 0 ? (
            <ProductList products={filtered} />
          ) : (
            <EmptyState
              query={query.trim()}
              category={activeCategory}
              onClearQuery={handleClearQuery}
              onClearCategory={() => handleCategoryChange(null)}
              onClearAll={handleClearAll}
            />
          )}
        </>
      )}
    </main>
  );
}
