// 商品データ1件分の型。public/data/products.json の各要素と同じ形。
export type Product = {
  id: number;
  jan: string; // JANコード(13桁)。先頭の0が消えないよう文字列で持つ
  category: string;
  name: string;
  stock: number;
};

// 在庫数がこの値以下(かつ1以上)なら「残りわずか」を表示する
export const LOW_STOCK_THRESHOLD = 5;
