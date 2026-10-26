import { defineConfig, devices } from "@playwright/test";

// 開発中の `npm run dev`(3000番)とぶつからないよう、テスト専用に3100番を使う
const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  // 失敗したときだけ1回やり直す(CIなど、環境のゆらぎ対策)
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  // 公開と同じ「本番ビルド」に対してテストする。
  // 開発サーバーでは出ない、ビルド時のエラー(Suspenseの付け忘れなど)も、ここで見つかる
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // PC幅
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // スマホ幅(Chromiumのまま、iPhone 13相当の画面サイズ・タッチ操作にする)
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
