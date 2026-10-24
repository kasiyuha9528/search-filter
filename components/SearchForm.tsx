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
    // 画面の上部に固定(sticky)する範囲を、画面の幅で変える。
    // - スマホ(768px未満): 検索欄だけ固定する。タグまで固定すると画面の約30%を占めて、一覧が狭くなるため
    // - PC・タブレット(768px以上): 検索欄とタグの全体を固定する
    //
    // sticky は「親要素の中」でしか固定されない。スマホでは検索欄の親をこの外側の <main> にしたいので、
    // この要素を contents(自分自身の箱を作らず、子を親の中に直接並べる指定)にしている
    <div className="contents md:sticky md:top-0 md:z-10 md:block md:bg-slate-50 md:pb-3">
      <div className="sticky top-0 z-10 bg-slate-50 py-2 md:static md:py-0 md:pb-3">
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
      </div>

      {/* カテゴリのタグ:単一選択。選択中のタグをもう一度押すと「すべて」に戻る */}
      <div className="mt-1 flex flex-wrap gap-2 md:mt-0" role="group" aria-label="カテゴリで絞り込み">
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
