type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  categories: string[];
  selectedCategory: string | null; // null は「すべて」
  onCategoryChange: (category: string | null) => void;
};

// タグ(チップ)1つ分のスタイル。選択中は濃い色にして、状態がひと目でわかるようにする
function chipClass(selected: boolean) {
  const base = "min-h-11 rounded-full border px-4 text-sm font-bold";
  return selected
    ? `${base} border-slate-900 bg-slate-900 text-white`
    : `${base} border-slate-300 bg-white text-slate-700`;
}

export default function SearchForm({
  query,
  onQueryChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: Props) {
  return (
    <div className="space-y-3">
      {/* 検索欄:文字サイズ16px(text-base)にして、iPhoneで入力時に画面が拡大されないようにする */}
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          // Enterでキーボードを閉じて、結果が隠れないようにする
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        enterKeyHint="search"
        autoComplete="off"
        placeholder="商品名・JANコードで検索"
        aria-label="商品名またはJANコードで検索"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400"
      />

      {/* カテゴリのタグ:単一選択。選択中のタグをもう一度押すと「すべて」に戻る */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="カテゴリで絞り込み">
        <button
          type="button"
          aria-pressed={selectedCategory === null}
          onClick={() => onCategoryChange(null)}
          className={chipClass(selectedCategory === null)}
        >
          すべて
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={selectedCategory === category}
            onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
            className={chipClass(selectedCategory === category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
