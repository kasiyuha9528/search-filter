import type { Product } from "./types";

// 比較用に文字をそろえる。
// NFKC正規化で「全角英数→半角」「半角カナ→全角カナ」に統一し、さらに小文字にする。
// 例:「ＵＳＢ」→「usb」、「ﾍﾟｰﾊﾟｰ」→「ペーパー」
export function normalizeText(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

// 商品を「検索語」と「カテゴリ」の両方で絞り込む(AND条件)。
// - query: 商品名またはJANコードに部分一致(空なら検索語では絞らない)
// - category: 完全一致(null なら「すべて」)
export function filterProducts(
  products: Product[],
  query: string,
  category: string | null,
): Product[] {
  const normalizedQuery = normalizeText(query.trim());

  return products.filter((product) => {
    if (category !== null && product.category !== category) {
      return false;
    }
    if (normalizedQuery === "") {
      return true;
    }
    return (
      normalizeText(product.name).includes(normalizedQuery) ||
      normalizeText(product.jan).includes(normalizedQuery)
    );
  });
}

// 商品データに含まれるカテゴリを、最初に登場した順で重複なしに取り出す
export function getCategories(products: Product[]): string[] {
  return [...new Set(products.map((product) => product.category))];
}
