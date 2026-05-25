# 実装ヒント集

> このファイルは自分で実装するための手順書・ヒント集です。  
> 仕様の全体像は **[CLAUDE.md](./CLAUDE.md)**、作業チェックリストは **[TODO.md](./TODO.md)** を参照。

---

## 全体のゲームフロー（新仕様）

```
ページ読み込み
  └─ カメラ起動 & MediaPipe モデル読み込み
       └─ 「じゃんけんをする」ボタンが有効化される
            │
            ▼ ボタンクリック
       ボタン無効化
            │
            ▼
       カウントダウン: 3 → 2 → 1 → ぽん！（各1秒）
            │
            ▼ 「ぽん！」のタイミング
       カメラフレームをキャプチャして1回だけジェスチャー認識
            │
            ├─ 認識失敗 → エラーメッセージ表示 → ボタン再有効化
            │
            └─ 認識成功
                  │
                  ▼
            AIが必ず勝つ手を計算
                  │
                  ▼
            UI更新（ユーザーの手 / AIの手 / 「AIの勝ち！」 / 嫌味コメント）
                  │
                  ▼
            ボタン再有効化 → 次のラウンドへ
```

---

## Phase 9: プレビューループの変更とUI追加

### 既存コードの変更対象（新セッション開始時の確認用）

| ファイル | 対象 | 変更内容 |
|---|---|---|
| `script.js` | `recognizeLoop()` 関数 | `updateUI()` 呼び出しを削除してプレビュー専用にする |
| `script.js` | `updateUI()` 関数 | 削除またはそのまま残してキャプチャ時に流用 |
| `script.js` | `main()` 関数 | ボタンのイベントリスナー登録を追加 |
| `index.html` | `<body>` 内 | ボタン・カウントダウン・嫌味コメントのHTML要素を追加 |

### ポイント
現在の `recognizeLoop()` は毎フレーム認識してUIを更新している。  
新仕様では**カウントダウン終了時に1回だけ認識**するため、ループ内での UI 更新をやめる。

```js
// 変更前: ループ内で updateUI を呼んでいた
function recognizeLoop(recognizer) {
  // ...
  updateUI(gestureName);  // ← これを削除
  requestAnimationFrame(() => recognizeLoop(recognizer));
}
```

ループは「カメラ映像を canvas に描画し続ける」だけにする（MediaPipe の VIDEO モードは連続フレームが必要なため、描画自体は継続する）。

### index.html に追加するHTML要素

```html
<!-- ゲーム開始ボタン -->
<button id="start-btn" class="...">じゃんけんをする</button>

<!-- カウントダウン表示 -->
<p id="countdown" class="text-6xl font-bold text-yellow-300 h-20"></p>

<!-- 嫌味コメント表示 -->
<p id="taunt" class="text-lg text-pink-400 h-8 text-center"></p>
```

---

## Phase 10: カウントダウン実装

### sleep 関数を用意する

`setTimeout` を `Promise` でラップすると `async/await` で使える。

```js
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

### startGame 関数の骨格

```js
async function startGame() {
  const startBtn     = document.getElementById("start-btn");
  const countdownEl  = document.getElementById("countdown");

  // ボタン無効化
  startBtn.disabled = true;
  countdownEl.textContent = "";

  // カウントダウン
  for (const count of ["3", "2", "1", "ぽん！"]) {
    countdownEl.textContent = count;
    await sleep(1000);
  }

  // ← ここでジェスチャー認識を呼び出す（Phase 11）
  const gestureName = captureGesture();

  // ... 以降の処理
}
```

### ボタンにイベントリスナーを登録する場所

`main()` の中、モデル読み込み完了後に登録する。

```js
async function main() {
  await startCamera();
  const recognizer = await initRecognizer();
  loadingEl.classList.add("hidden");

  recognizeLoop(recognizer);  // プレビュー用ループ（UIは更新しない）

  document.getElementById("start-btn").addEventListener("click", () => startGame(recognizer));
}
```

---

## Phase 11: スナップショット認識

### captureGesture 関数

ループとは別に、その瞬間のフレームだけを認識する。

```js
function captureGesture(recognizer) {
  // canvas には recognizeLoop が描画し続けているので、現フレームがすでに入っている
  const results = recognizer.recognizeForVideo(canvas, performance.now());
  return results.gestures?.[0]?.[0]?.categoryName ?? null;
}
```

**注意:** `recognizeForVideo` は同じ `recognizer` インスタンスで呼ぶ必要がある。  
ループとキャプチャで別の recognizer を作らないこと。

### 認識失敗時の処理

```js
const gestureName = captureGesture(recognizer);
if (!GESTURE_MAP[gestureName]) {
  countdownEl.textContent = "認識できませんでした。もう一度！";
  startBtn.disabled = false;
  return;
}
```

---

## Phase 12: AIが必ず勝つロジック

### 勝ち手のマッピング

```js
const WINNING_HAND = {
  Closed_Fist: "Open_Palm",   // グー に勝つのは パー
  Open_Palm:   "Victory",     // パー に勝つのは チョキ
  Victory:     "Closed_Fist"  // チョキ に勝つのは グー
};

function getWinningHand(userGesture) {
  return WINNING_HAND[userGesture];
}
```

### UI更新の例

```js
const userHand = GESTURE_MAP[gestureName];
const aiGesture = getWinningHand(gestureName);
const aiHand = GESTURE_MAP[aiGesture];

document.getElementById("user-hand").textContent = userHand.emoji;
document.getElementById("ai-hand").textContent   = aiHand.emoji;
document.getElementById("result").textContent    = "AIの勝ち！";
```

---

## Phase 13: 嫌味コメント

### コメント一覧（10種類）

```js
const TAUNT_MESSAGES = [
  "弱すぎる、泣ける。",
  "また負けか。練習してる？",
  "初歩的なミスだね。",
  "君は単細胞だ！",
  "さすがに諦めたら？",
  "弱いね。本当に。",
  "勝てる気がしてたの？",
  "次も負けるよ、断言できる。"
];
```

### ランダム表示

```js
function getRandomTaunt() {
  return TAUNT_MESSAGES[Math.floor(Math.random() * TAUNT_MESSAGES.length)];
}

document.getElementById("taunt").textContent = getRandomTaunt();
```

---

## Phase 14: BGM

### HTMLへの追加

```html
<audio id="bgm" src="audio/bgm.mp3" loop></audio>
```

### ブラウザの自動再生ポリシーに注意

ブラウザはユーザー操作なしの自動再生を**ブロックする**ことがある。  
最も安全な方法は「ボタン初回クリック時に再生を開始する」こと。

```js
let bgmStarted = false;

async function startGame(recognizer) {
  // BGM を初回クリック時に再生
  if (!bgmStarted) {
    document.getElementById("bgm").play().catch(() => {});
    bgmStarted = true;
  }
  // ... 以降の処理
}
```

### BGMファイルの調達方法

- **フリーBGMサイトの例**: DOVA-SYNDROME（https://dova-s.jp/）、魔王魂（https://maou.audio/）
- ダウンロードした `.mp3` を `audio/bgm.mp3` に配置する
- 著作権・利用規約を必ず確認すること

### （任意）ミュートボタン

```js
const bgm = document.getElementById("bgm");
document.getElementById("mute-btn").addEventListener("click", () => {
  bgm.muted = !bgm.muted;
});
```

---

## よくあるハマりポイント

| 問題 | 原因 | 対処 |
|---|---|---|
| カウントダウンが一瞬で終わる | `sleep` を await していない | `await sleep(1000)` になっているか確認 |
| 認識が常に失敗する | ループとキャプチャで canvas の状態が合っていない | `recognizeLoop` が最新フレームを描画しているか確認 |
| BGMが再生されない | 自動再生ポリシー | ユーザー操作（ボタンクリック）のイベント内で `.play()` を呼ぶ |
| ボタンが連打できる | `disabled` の設定漏れ | `startGame` の先頭で `startBtn.disabled = true` を確認 |
| `recognizeForVideo` でエラー | タイムスタンプが前回より小さい | `performance.now()` を使う（単調増加が保証される） |
