---
name: markdive-release
description: >
  markdive の npm パッケージリリース手順を実行するスキルです。
  「リリースしたい」「バージョンを上げたい」「npm に公開したい」「x.y.z をリリースしたい」
  などの発言があった場合に必ずこのスキルを使ってください。
  バージョン番号の決定、CHANGELOG 更新、lint/test/build 検証、コミット、タグ付け、
  git push、npm publish まで一貫した手順で進めます。
---

# markdive リリース手順スキル

## 概要

このスキルは markdive の npm パッケージリリースを安全・確実に進めるための手順です。
「前回リリース以降の変更を確認 → バージョン番号を決める → ファイル更新 → 検証 → コミット・タグ → push → npm publish」
という流れで実施します。

---

## ステップ 0 — 事前確認

```bash
# 現在のブランチと状態を確認
git status -sb
git branch --show-current

# 最新タグと現行バージョンを確認
git tag --list --sort=-creatordate | head -n 5
cat package.json | grep '"version"'

# 前回タグ以降のコミットと変更ファイルを確認
git log <前回タグ>..HEAD --oneline --decorate
git diff --name-status <前回タグ>..HEAD

# npm の認証状態を確認（失敗したら必ず npm login してから進む）
npm whoami
```

> **重要**: `npm whoami` が失敗した場合は `npm login` を実行して認証を完了させてから先に進む。
> 認証が取れていない状態で `npm publish` を実行してはいけない。

---

## ステップ 1 — バージョン番号の決定

Semantic Versioning（semver）に基づいてバージョンを決める。

| 変更内容 | バージョンアップ |
|---|---|
| 破壊的変更あり | major（例: 0.x.y → 1.0.0） |
| 新機能追加（後方互換あり） | minor（例: 0.3.1 → 0.4.0） |
| バグ修正・ドキュメント更新のみ | patch（例: 0.3.0 → 0.3.1） |

コミット内容の分類:
- `src/` に新しいファイルが追加された → minor 以上
- 既存の API が変わった or コマンド名が変わった → major
- テスト修正・ドキュメント追加・fixture 更新のみ → patch

**不明な場合はユーザーに確認する。**

---

## ステップ 2 — CHANGELOG.md の更新

`CHANGELOG.md` の先頭（最新バージョンセクションの直前）に新しいセクションを追加する。

```markdown
## [x.y.z] - YYYY-MM-DD

### Added
- （新機能があれば記載）

### Changed
- （変更があれば記載）

### Fixed
- （バグ修正があれば記載）

### Removed
- （削除があれば記載）
```

変更内容は `git log` と `git diff` の結果から、ユーザーが見て意味のある単位でまとめる。
コミットメッセージをそのままコピーせず、リリースノートとして読める文章にする。

最下部の比較リンクも更新する:

```markdown
[Unreleased]: https://github.com/Lambda-deep/markdive/compare/vX.Y.Z...HEAD
[X.Y.Z]: https://github.com/Lambda-deep/markdive/compare/v前バージョン...vX.Y.Z
```

---

## ステップ 3 — package.json / package-lock.json のバージョン更新

```bash
# --no-git-tag-version を付けてファイルだけ更新する（タグはあとで手動で付ける）
npm version <major|minor|patch> --no-git-tag-version
# または直接指定
npm version x.y.z --no-git-tag-version
```

---

## ステップ 4 — 検証（必ず全部通す）

```bash
npm run lint    # 型チェック + Biome lint
npm test        # Jest テスト
npm run build   # TypeScript ビルド
```

いずれかが失敗した場合はリリースを中断して修正する。

---

## ステップ 5 — コミット

`docs/20260328-qiita-draft/` など、リリース対象でないファイルが作業ツリーにある場合は
`git status` で確認し、コミット対象から除外する。

```bash
# コミット対象のファイルを明示的に指定する
git commit -m "chore(release): bump to x.y.z" -- CHANGELOG.md package.json package-lock.json
# AGENTS.md など追加で含める場合もファイルを指定
git commit -m "chore(release): bump to x.y.z" -- AGENTS.md CHANGELOG.md package.json package-lock.json
```

コミットメッセージの形式: `chore(release): bump to x.y.z`

---

## ステップ 6 — タグ付けと push

```bash
# ローカルタグを作成
git tag vx.y.z

# main ブランチと タグを push
git push origin main
git push origin vx.y.z
```

---

## ステップ 7 — npm publish

```bash
npm publish
```

スコープ付きパッケージや初回公開の場合は `--access public` を付ける。

```bash
npm publish --access public
```

### npm publish 後の確認

```bash
# レジストリに反映されているか確認（直後は旧バージョンが返ることがあるので registry を明示）
npm view markdive@x.y.z version --registry=https://registry.npmjs.org/
npm view markdive dist-tags --registry=https://registry.npmjs.org/
```

`latest` が新バージョンになっていれば完了。

---

## チェックリスト

- [ ] `npm whoami` で認証確認済み
- [ ] 前回タグ以降の変更を確認済み
- [ ] バージョン番号（major/minor/patch）を判断済み
- [ ] CHANGELOG.md に新バージョンセクションを追加済み
- [ ] `npm version` でバージョン更新済み
- [ ] lint / test / build が全部グリーン
- [ ] リリース対象外ファイルを除外してコミット済み
- [ ] `git tag vx.y.z` でタグ作成済み
- [ ] `git push origin main && git push origin vx.y.z` 済み
- [ ] `npm publish` 成功
- [ ] npm レジストリで `latest` が新バージョンになっているのを確認済み

---

## よくある問題と対処

### `npm whoami` が失敗する
→ `npm login` を実行してブラウザ認証を完了させる。その後再度 `npm whoami` で確認してから publish に進む。

### push 後に npm publish したが旧バージョンが返る
→ レジストリへの反映に数秒〜数分かかることがある。`--registry=https://registry.npmjs.org/` を付けて直接照会する。

### 作業ツリーに含めたくないファイルがある
→ `git commit -- file1 file2 ...` のようにファイルを明示して、不要なファイルをコミットに含めない。
