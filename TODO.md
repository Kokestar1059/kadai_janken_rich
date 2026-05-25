# 実装TODO

> 実装ヒント・コードスニペットは **[HINTS.md](./HINTS.md)** を参照。

---

## ✅ 完了済み（旧仕様）

### Phase 1: HTMLの骨格作成
- [x] `<head>` にタイトル・文字コード・viewport 設定
- [x] MediaPipe `@mediapipe/tasks-vision` を CDN から読み込む `<script>` タグ追加
- [x] カメラ映像表示用 `<video>` タグ配置
- [x] ジェスチャー認識用 `<canvas>` タグ配置（非表示でOK）
- [x] ユーザーの手・AIの手・結果を表示するUI要素（div/p）配置

### Phase 2: スタイリング
- [x] 全体レイアウト（中央寄せ、背景色）
- [x] カメラ映像エリアのスタイル
- [x] ユーザー/AI の手表示エリアのスタイル（横並び）
- [x] 結果表示エリアのスタイル（目立つフォントサイズ）
- [x] ローディング表示のスタイル

### Phase 3: カメラ初期化
- [x] `navigator.mediaDevices.getUserMedia` でカメラストリーム取得
- [x] 取得したストリームを `<video>` に割り当てて再生
- [x] カメラアクセス失敗時のエラーメッセージ表示

### Phase 4: MediaPipe Gesture Recognizer セットアップ
- [x] `FilesetResolver` で MediaPipe wasm をロード
- [x] `GestureRecognizer.createFromOptions` でモデル初期化
- [x] モデルロード中はローディング表示、完了後に非表示

### Phase 5〜8: 認識ループ・判定・UI・デバッグ（あいこ仕様）
- [x] `requestAnimationFrame` によるリアルタイム認識ループ
- [x] ジェスチャー名 → じゃんけんの手 マッピング
- [x] AI = ユーザーと同じ手（あいこ固定）← **新仕様で変更**
- [x] 動作確認

---

## 🔲 新仕様 実装予定

### Phase 9: 既存コードのリファクタリング・UI追加
- [x] `requestAnimationFrame` ループを「プレビュー専用」に変更（認識結果をUIに出さない）
- [x] 「じゃんけんをする」ボタンを `index.html` に追加
- [x] カウントダウン表示エリアを `index.html` に追加（`id="countdown"`）
- [x] 嫌味コメント表示エリアを `index.html` に追加（`id="taunt"`）
- [x] ボタン・カウントダウン・結果エリアの Tailwind スタイルを設定

### Phase 10: カウントダウン実装
- [x] ボタンクリックで `startGame()` 関数を呼び出す
- [x] `startGame()` 内でボタンを `disabled` にする
- [x] 3 → 2 → 1 → ぽん！ を1秒ごとに `countdown` エリアに表示する
- [x] 「ぽん！」表示後にジェスチャーキャプチャを呼び出す（Phase 11 で実装）

### Phase 11: スナップショット認識
- [x] カウントダウン終了時点のカメラフレームを `canvas` に描画
- [x] `recognizer.recognizeForVideo(canvas, performance.now())` で1回だけ認識
- [ ] 認識失敗（GESTURE_MAP にないジェスチャー）の場合、エラーメッセージ表示して終了

### Phase 12: AIが必ず勝つロジック
- [x] `getWinningHand(userGesture)` 関数を実装
- [x] ユーザーの手・AIの手・結果（「AIの勝ち！」）をUIに反映
- [x] ボタンを再度 `enabled` に戻す

### Phase 13: 嫌味コメント表示
- [x] 嫌味コメント配列を `script.js` に定義
- [x] AIが勝ったとき、ランダムに1件選んで `taunt` エリアに表示
- [x] 次のラウンド開始時にコメントをクリアする

### Phase 14: BGM実装
- [x] `audio/` ディレクトリを作成し BGM ファイルを配置
- [x] `index.html` に `<audio id="bgm" ...>` を追加
- [x] ボタン初回押下後に `bgm.play()` で再生開始
- [x] `bgmStarted` フラグで二重再生を防止

### Phase 15: 動作確認・デバッグ
- [x] ボタン → カウントダウン → 認識 → AI手 → 嫌味コメント の一連フローを確認
- [x] 認識失敗時のエラーハンドリングを確認
- [x] BGMがループ再生されるか確認
- [x] ボタンの二重押し防止が効いているか確認
- [x] 不要な `updateUI` 関数を削除
