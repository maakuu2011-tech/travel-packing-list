# 旅じたくリスト

旅行条件を選ぶと、必要な持ち物を整理できる日本語のチェックリストサイトです。

## 開発

```powershell
npm install
npm run dev
```

## ビルド

```powershell
npm run build
```

本番URLは `PUBLIC_SITE_URL` で指定します。未指定時は `https://tabijitakulist.com` を使用します。

## 運営

- 本番: https://tabijitakulist.com/
- 日次実行の入口: `automation/daily-site-operation.prompt.md`
- 共通ルール: `AGENTS.md`
- KPI、旅行情報の鮮度、公開手順: `docs/site-operations.md`
- 分析・戦略・実装・レビューの担当: `docs/roles/`
- 継続する判断: `docs/DECISIONS.md`

Search Console、Cloudflare Web Analytics、収益イベントはリポジトリから自動取得していません。日次実行時に取得できた値だけを根拠にし、欠測は明記します。GitHub の CI 設定も現在はありません。公開前には `npm.cmd run check` と `npm.cmd run build` を実行します。

