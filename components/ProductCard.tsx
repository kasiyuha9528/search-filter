import { LOW_STOCK_THRESHOLD, type Product } from "@/lib/types";

type Props = {
  product: Product;
};

// 在庫数から、カードの背景色・文字色・ラベル・数字の色を決める
function getStockStatus(stock: number) {
  if (stock === 0) {
    return {
      label: "在庫切れ",
      card: "border-red-400 bg-red-300",
      subText: "text-red-900", // カテゴリとJANコードの文字色
      badge: "bg-red-700 text-white",
      number: "text-red-950",
    };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: "残りわずか",
      card: "border-amber-400 bg-amber-300",
      subText: "text-amber-900",
      badge: "bg-amber-700 text-white",
      number: "text-amber-950",
    };
  }
  return {
    label: null,
    card: "border-slate-200 bg-white",
    subText: "text-slate-500",
    badge: "",
    number: "text-slate-900",
  };
}

export default function ProductCard({ product }: Props) {
  const status = getStockStatus(product.stock);

  return (
    <li className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${status.card}`}>
      {/* 左側:カテゴリ → 商品名 → JANコード */}
      <div className="min-w-0">
        <p className={`text-xs ${status.subText}`}>{product.category}</p>
        <p className="mt-0.5 text-base font-bold text-slate-900">{product.name}</p>
        <p className={`mt-1 font-mono text-sm tracking-wide ${status.subText}`}>
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
          <span className={`text-xs ${status.subText}`}>在庫</span>
        )}
        <span className={`text-3xl font-bold tabular-nums ${status.number}`}>
          {product.stock}
        </span>
      </div>
    </li>
  );
}
