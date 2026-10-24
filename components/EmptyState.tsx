type Props = {
  query: string; // 検索語(空なら条件なし)
  category: string | null; // 選択中のカテゴリ(null は「すべて」)
  onClearQuery: () => void;
  onClearCategory: () => void;
  onClearAll: () => void;
};

// 条件1つ分のボタン。押すと、その条件だけを外す(タップ領域は高さ44px)
function ConditionButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}「${value}」を解除`}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 text-sm font-bold text-slate-800"
    >
      <span className="truncate">
        {label}: {value}
      </span>
      {/* ×アイコン(装飾なので、読み上げからは外す) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  );
}

// 絞り込みの結果が0件のときに表示する。
// 0件になる原因は条件の組み合わせであることが多いので、条件を1つずつ外せるようにする
export default function EmptyState({
  query,
  category,
  onClearQuery,
  onClearCategory,
  onClearAll,
}: Props) {
  const conditionCount = (query !== "" ? 1 : 0) + (category !== null ? 1 : 0);

  // 条件がないのに0件 = 商品データそのものが空。この場合は解除するものがない
  if (conditionCount === 0) {
    return (
      <div role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-bold text-slate-900">商品データがありません</p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center"
    >
      <p className="text-base font-bold text-slate-900">該当する商品がありません</p>
      <p className="text-sm text-slate-600">
        {conditionCount >= 2 ? "次の条件の組み合わせでは0件です" : "次の条件では0件です"}
      </p>

      <div className="flex w-full flex-col items-center gap-2">
        {query !== "" && <ConditionButton label="検索語" value={query} onClick={onClearQuery} />}
        {category !== null && (
          <ConditionButton label="カテゴリ" value={category} onClick={onClearCategory} />
        )}
      </div>

      <button
        type="button"
        onClick={onClearAll}
        className="mt-1 min-h-11 rounded-lg border border-slate-400 bg-white px-5 font-bold text-slate-900"
      >
        {conditionCount >= 2 ? "すべての条件をクリア" : "条件をクリア"}
      </button>
    </div>
  );
}
