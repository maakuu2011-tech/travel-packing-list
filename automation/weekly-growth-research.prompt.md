# 旅じたくリスト 週次 Growth Research

対象は `C:\Users\maaku\Documents\Codex\travel-packing-list`、本番は `https://tabijitakulist.com/`。原則として毎週月曜日に実施する。日次の分析→戦略→実装→レビューの4役を変更しない。週次では分析の前に Growth Research を追加し、依存する段階を同時並行にしない。

## 開始条件

1. `AGENTS.md`、`docs/site-operations.md`、`docs/growth-status.md`、`docs/roles/`、既存ガイドとチェックリスト機能を読む。
2. `git status`、ブランチ、`origin/main` との差を確認する。未コミット変更があれば混ぜずに公開作業を止め、状態を報告する。きれいなら `git pull --ff-only` する。
3. 同じ週の Growth Research が済んでいれば重複実行しない。本番と直近の変更を確認する。

## 順序

1. **日次の Analyst の情報を引き継ぐ**: Search Console の確定済み直近28日と前28日、Cloudflare の比較可能な期間、利用データを確認する。前年同時期があれば季節性を確認する。取得元・期間・欠測を記す。
2. **Growth Research** (`site_growth_researcher`, `docs/roles/growth-researcher.md`): 公開検索結果、必要に応じて Trends、公式情報、既存ガイドと機能を調べ、New Growth 候補を最大3件渡す。ページやコードは変更しない。
3. **Strategist** (`site_strategist`): Analyst の Existing Growth 候補と Growth Research の New Growth 候補を同列で比較し、根拠、期待効果、実装・保守コスト、重複、季節のタイミング、品質リスクから採否を決める。見送り理由と完了条件を残す。新規ガイド・新機能は原則週1件まで。既存改善または変更なしを選んでもよい。
4. **Developer**: 採用された施策だけを最小変更で実装する。今回の運用基盤整備だけを行う実行では新規ガイドを作らない。
5. **Reviewer** (`site_reviewer`): 差分、根拠、旅行情報、SEO、利用導線、`npm.cmd run check`、`npm.cmd run build`、`git diff --check` を確認する。重大な指摘が残れば公開しない。
6. **公開**: レビュー可の変更だけ commit・`main` へ push し、本番を確認する。

## 判断と記録

Existing Growth は既存ページの高表示、順位11～30位、低CTR、上昇中の順位、実閲覧、チェックリスト遷移、近い季節需要、情報の鮮度を指す。New Growth はサイトにない目的地・日数・季節・同行者・旅行目的・移動手段の需要や、旅行前チェック・荷物量計算・忘れ物防止などの機能需要を指す。既存ページの改善と新規需要の探索は70%対30%を運用の目安とし、件数や比率をKPIにしない。

需要根拠が弱い、既存ページと重複する、公式情報を確認できない、公開時期が不適切、検索意図が曖昧、または既存改善の期待値が高い場合は「新規追加なし」とする。地名だけの差し替えや日付だけの更新はしない。少数標本のCTRや季節の違う28日間だけで成果を断定しない。

確定値と比較条件、伸びた／伸びないテーマ、新たに確認した需要、次の仮説を `docs/growth-status.md` に週次または月次で残す。日次詳細ログは Git 管理外のままにし、日々の数値だけの commit を作らない。週次の確定データを取得できたら、サイト変更がない週も記録を週1回まで commit してよい。方針変更のみ `docs/DECISIONS.md` に記す。ログイン、本人確認、契約、課金が必要な場合はユーザーへ必要事項だけ報告する。

## 報告

検索・閲覧の期間と実測または取得不可の理由、Existing Growth と New Growth の上位候補、採用・見送り理由、変更と検証、独立レビューの有無、公開状態、次に見る KPI を日本語で簡潔に報告する。
