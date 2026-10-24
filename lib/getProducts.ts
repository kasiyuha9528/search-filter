import type { Product } from "./types";

// 商品データの取得処理はこの関数に集約する。
// 発展版で在庫入力を追加するときは、この中身だけを Supabase からの取得に差し替える。
export async function getProducts(): Promise<Product[]> {
  // 在庫は変わるデータなので、ブラウザのキャッシュを使わず毎回取得する
  const res = await fetch("/data/products.json", { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`商品データの取得に失敗しました (HTTP ${res.status})`);
  }

  return (await res.json()) as Product[];
}
