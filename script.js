import {
  GestureRecognizer,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const loadingEl = document.getElementById("loading");
const userHandEl = document.getElementById("user-hand");
const aiHandEl = document.getElementById("ai-hand");
const resultEl = document.getElementById("result");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const GESTURE_MAP = {
  Closed_Fist: { label: "グー", emoji: "✊" },
  Open_Palm: { label: "パー", emoji: "✋" },
  Victory: { label: "チョキ", emoji: "✌️" }
};

const WINNING_HAND = {
  Closed_Fist: "Open_Palm",   // グーにはパーで勝つ
  Open_Palm: "Victory",     // パーにはチョキで勝つ
  Victory: "Closed_Fist"  // チョキにはグーで勝つ
};

  // 嫌味コメントの配列
  const TAUNT_MESSAGES = [
    "弱すぎる、泣ける。",
    "また負けか。練習してる？",
    "君は会社でも負け組だ！",
    "君は単細胞だ！",
    "さすがに諦めたら？",
    "弱いね。本当に。",
    "勝てる気がしてたの？",
    "次も負けるよ、断言できる。"
  ];

  // BGMの要素
  let bgmStarted = false;


async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });
    video.srcObject = stream;
    await new Promise(resolve => video.addEventListener("loadeddata", resolve, { once: true }));
  } catch (err) {
    loadingEl.textContent = "カメラへのアクセスに失敗しました: " + err.message;
    throw err;
  }
}

async function initRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  const recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "CPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
  return recognizer;
}

function recognizeLoop(recognizer) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  const results = recognizer.recognizeForVideo(canvas, performance.now());
  const gestureName = results.gestures?.[0]?.[0]?.categoryName ?? null;

  requestAnimationFrame(() => recognizeLoop(recognizer));
}

async function main() {
  await startCamera();
  const recognizer = await initRecognizer();
  loadingEl.classList.add("hidden");
  recognizeLoop(recognizer);
  document.getElementById("start-btn").addEventListener("click", () => startGame(recognizer));
}


function captureGesture(recognizer) {
  // canvas には recognizeLoop が描画し続けているので、現フレームがすでに入っている
  const results = recognizer.recognizeForVideo(canvas, performance.now());
  return results.gestures?.[0]?.[0]?.categoryName ?? null;
}

async function startGame(recognizer) {
  const startBtn = document.getElementById("start-btn");
  const countdownEl = document.getElementById("countdown");
  const tauntEl = document.getElementById("taunt");
  if (!bgmStarted) {
    document.getElementById("bgm").play().catch(() => {});
    bgmStarted = true;
  }  
  startBtn.disabled = true;
  countdownEl.classList.remove("hidden");
  countdownEl.textContent = "じゃん";
  tauntEl.textContent = "";
  tauntEl.classList.add("hidden");
  await sleep(1000);
  countdownEl.textContent = "け〜ん";
  await sleep(1000);
  countdownEl.textContent = "ぽんっ！";
  await sleep(800);
  const gestureName = captureGesture(recognizer);

  // 手が認識できなかったとき → メッセージを出して終了
  if (!GESTURE_MAP[gestureName]) {
    countdownEl.textContent = "認識できませんでした。もう一度！";
    startBtn.disabled = false;
    return;
  }

  // ユーザーの手を表示
  userHandEl.textContent = GESTURE_MAP[gestureName].emoji;

  // AIの勝ち手を計算して表示
  const aiGesture = WINNING_HAND[gestureName];
  aiHandEl.textContent = GESTURE_MAP[aiGesture].emoji;

  // 結果を表示
  resultEl.textContent = "PCの勝ち！";
  countdownEl.classList.add("hidden");

  // ランダムに1件選ぶ
  const taunt = TAUNT_MESSAGES[Math.floor(Math.random() * TAUNT_MESSAGES.length)];

  // taunt 要素に表示して、hidden を外す
  tauntEl.textContent = taunt;
  tauntEl.classList.remove("hidden");


  startBtn.disabled = false;

}

main();


