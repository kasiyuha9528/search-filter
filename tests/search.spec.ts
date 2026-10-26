import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// 期待値は数字を直接書かず、商品データから数える。データを増やしてもテストが壊れにくい
type Product = { name: string; category: string; jan: string; stock: number };
const products: Product[] = JSON.parse(readFileSync("public/data/products.json", "utf-8"));
const TOTAL = products.length;
const LOW_STOCK_THRESHOLD = 5; // lib/types.ts と同じ値

// 一覧のカード(<li>)と、件数表示
const cards = (page: Page) => page.getByRole("listitem");
const countText = (page: Page, shown: number) => page.getByText(`${TOTAL}件中 ${shown}件`);
const searchInput = (page: Page) => page.getByRole("searchbox");
const chip = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

// URLの書き換えは入力が止まってから300ms後なので、反映されるまで待って確かめる
const currentSearch = (page: Page) => () => new URL(page.url()).search;

test.describe("初期表示", () => {
  test("全件が表示され、件数が「30件中 30件」になる", async ({ page }) => {
    await page.goto("/");
    await expect(cards(page)).toHaveCount(TOTAL);
    await expect(countText(page, TOTAL)).toBeVisible();
  });

  test("在庫切れ・残りわずかのラベルが、データ通りの件数だけ出る", async ({ page }) => {
    await page.goto("/");
    const zero = products.filter((p) => p.stock === 0).length;
    const low = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;

    await expect(page.getByText("在庫切れ", { exact: true })).toHaveCount(zero);
    await expect(page.getByText("残りわずか", { exact: true })).toHaveCount(low);
  });

  test("横スクロールが出ない(スマホ幅でも画面からはみ出さない)", async ({ page }) => {
    await page.goto("/");
    await expect(cards(page)).toHaveCount(TOTAL);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("URLから条件を復元する", () => {
  test("?q=usb&category=家電 を開くと1件だけ表示される", async ({ page }) => {
    await page.goto("/?q=usb&category=家電");

    await expect(countText(page, 1)).toBeVisible();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("ＵＳＢ卓上扇風機");
    // 検索欄・タグにも条件が反映されている
    await expect(searchInput(page)).toHaveValue("usb");
    await expect(chip(page, "家電")).toHaveAttribute("aria-pressed", "true");
  });

  test("?category=存在しない値 は「すべて」として扱い、URLも直る", async ({ page }) => {
    await page.goto("/?category=存在しない値");

    await expect(countText(page, TOTAL)).toBeVisible();
    await expect(chip(page, "すべて")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(currentSearch(page)).toBe("");
  });
});

test.describe("検索", () => {
  test("入力すると絞り込まれ、止まるとURLに ?q= が反映される", async ({ page }) => {
    await page.goto("/");
    await searchInput(page).fill("usb");

    // 「usb」は USB-Cハブ(半角)と ＵＳＢ卓上扇風機(全角)の2件
    await expect(countText(page, 2)).toBeVisible();
    await expect.poll(currentSearch(page)).toBe("?q=usb");
  });

  // 入力が止まって0.3秒後にURLを書き換える仕組みだと、入力直後にURLをコピーすると古いURLになる。
  // 入力欄から離れたとき(Enterも含む)は、待たずにURLを更新することを確かめる
  for (const how of ["blur", "Enter"] as const) {
    test(`入力して ${how} すると、0.3秒待たずにURLが更新される`, async ({ page }) => {
      await page.goto("/");
      await expect(cards(page)).toHaveCount(TOTAL); // データの読み込みが終わるのを待つ

      // 「入力 → 離れる → URLを読む」を、ページの中で1回の処理として実行する。
      // 途中で時間が進まないので、0.3秒の待ち時間が過ぎて「たまたま更新された」ことはない
      const search = await page.evaluate(async (how) => {
        const input = document.querySelector<HTMLInputElement>('input[type="search"]')!;
        input.focus();

        // Reactは入力欄の値の変更を、この方法で通知しないと気づかない
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        setValue.call(input, "usb");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve(); // Reactが画面を更新し終えるのを待つ(時間は進まない)

        if (how === "blur") {
          input.blur();
        } else {
          input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        }
        return window.location.search;
      }, how);

      expect(search).toBe("?q=usb");
    });
  }

  test("全角と半角を区別しない(ＵＳＢ でも usb と同じ結果)", async ({ page }) => {
    await page.goto("/");
    await searchInput(page).fill("ＵＳＢ");
    await expect(countText(page, 2)).toBeVisible();
  });

  test("半角カナでも検索できる(ペーパー → ﾍﾟｰﾊﾟｰﾀｵﾙ・ティッシュペーパー)", async ({ page }) => {
    await page.goto("/");
    await searchInput(page).fill("ペーパー");
    await expect(countText(page, 2)).toBeVisible();
    await expect(page.getByText("ﾍﾟｰﾊﾟｰﾀｵﾙ 4ﾛｰﾙ")).toBeVisible();
  });

  test("JANコードの一部(末尾)でも検索できる", async ({ page }) => {
    await page.goto("/");
    const target = products.find((p) => p.name === "ＵＳＢ卓上扇風機")!;
    await searchInput(page).fill(target.jan.slice(-6));
    await expect(countText(page, 1)).toBeVisible();
    await expect(cards(page).first()).toContainText(target.name);
  });
});

test.describe("カテゴリのタグ", () => {
  test("タップで絞り込み、もう一度タップすると「すべて」に戻る", async ({ page }) => {
    await page.goto("/");
    const stationery = products.filter((p) => p.category === "文具").length;

    await chip(page, "文具").click();
    await expect(countText(page, stationery)).toBeVisible();
    await expect(chip(page, "文具")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(currentSearch(page)).toBe(`?category=${encodeURIComponent("文具")}`);

    await chip(page, "文具").click();
    await expect(countText(page, TOTAL)).toBeVisible();
    await expect(chip(page, "すべて")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(currentSearch(page)).toBe("");
  });

  test("検索語とカテゴリは AND で効く", async ({ page }) => {
    await page.goto("/");
    await searchInput(page).fill("usb");
    await chip(page, "家電").click();
    await expect(countText(page, 1)).toBeVisible();
  });
});

test.describe("空状態", () => {
  test("zzz で「該当する商品がありません」が出て、クリアすると全件に戻る", async ({ page }) => {
    await page.goto("/");
    await searchInput(page).fill("zzz");

    await expect(page.getByText("該当する商品がありません")).toBeVisible();
    await expect(countText(page, 0)).toBeVisible();
    await expect(cards(page)).toHaveCount(0);

    await page.getByRole("button", { name: "条件をクリア" }).click();
    await expect(countText(page, TOTAL)).toBeVisible();
    await expect(searchInput(page)).toHaveValue("");
  });

  test("条件が2つあるときは、片方ずつ解除できる", async ({ page }) => {
    // 「usb」は家電にもあるが、文具にはない → 0件
    await page.goto("/?q=usb&category=文具");
    await expect(page.getByText("次の条件の組み合わせでは0件です")).toBeVisible();

    await page.getByRole("button", { name: "カテゴリ「文具」を解除" }).click();
    await expect(countText(page, 2)).toBeVisible(); // 検索語 usb だけが残る
    await expect(searchInput(page)).toHaveValue("usb");
  });
});
