import { LOW_STOCK_THRESHOLD, type Product } from "@/lib/types";

type Props = {
  product: Product;
};

// 在庫数から、表示するラベルと色を決める
function getStockStatus(stock: number) {
  if (stock === 0) {
    return { label: "在庫切れ", badge: "bg-red-100 text-red-800", number: "text-red-700" };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { label: "残りわずか", badge: "bg-amber-100 text-amber-800", number: "text-amber-700" };
  }
  return { label: null, badge: "", number: "text-slate-900" };
}

export default function ProductCard({ product }: Props) {
  const status = getStockStatus(product.stock);

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      {/* 左側:カテゴリ → 商品名 → JANコード */}
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{product.category}</p>
        <p className="mt-0.5 text-base font-bold text-slate-900">{product.name}</p>
        <p className="mt-1 font-mono text-sm tracking-wide text-slate-500">
          JAN {product.jan}
        </p>
      </div>

      {/* 右側:在庫数(現場で一番見たい情報なので大きく表示) */}
      <div className="flex shrink-0 flex-col items-end">
        {status.label ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${status.badge}`}>
            {status.label}
          </span>
        ) : (
          <span className="text-xs text-slate-500">在庫</span>
        )}
        <span className={`text-3xl font-bold tabular-nums ${status.number}`}>
          {product.stock}
        </span>
      </div>
    </li>
  );
}
