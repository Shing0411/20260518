let video;
let hands;

let handLandmarks = null;
let detectedGesture = "none";

// 固定設計稿比例：16:9
const DESIGN_W = 1280;
const DESIGN_H = 720;
let viewScale = 1;
let viewX = 0;
let viewY = 0;

// 相機狀態
let cameraStatus = "正在啟動攝影機...";
let cameraReady = false;
let cameraError = "";

// 遊戲狀態
let gameState = "playing";
// playing：遊戲中
// roundResult：回合結果視窗
// menu：三回合結束選單
// ended：遊戲結束

let playerMove = "等待手勢";
let computerMove = "等待中";
let resultText = "第 1 回合開始，請出拳";
let scoreText = "第 1 / 3 回合";

// 分數與回合
let playerScore = 0;
let computerScore = 0;
let round = 1;
const maxRound = 3;

// 回合結果視窗
let roundResultTitle = "";
let roundResultMessage = "";
let roundResultEmoji = "";
let roundResultStartTime = 0;
const ROUND_RESULT_TIME = 3000;

// 下一回合開始後，必須先放開手勢，避免連續誤判
let needReleaseHand = false;

// 出拳確認
let currentPlayGesture = "none";
let playGestureStartTime = null;
let playGestureProgress = 0;
const PLAY_CONFIRM_TIME = 900;

// 選單手勢確認
const MENU_CONFIRM_TIME = 2000;
let currentMenuGesture = "none";
let menuGestureStartTime = null;
let menuGestureProgress = 0;
let menuStatus = "請做出手勢選擇";
let menuGestureTriggered = false;

// 防止 MediaPipe 重複處理影像
let isSendingFrame = false;

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);

  const app = document.getElementById("app");
  if (app) {
    cnv.parent("app");
  }

  calculateViewTransform();

  video = createCapture(
    {
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    },
    function () {
      cameraReady = true;
      cameraStatus = "攝影機啟動成功";
      cameraError = "";
      console.log("p5 攝影機啟動成功");
    }
  );

  video.size(640, 480);
  video.hide();

  setupMediaPipeHands();
  requestAnimationFrame(sendFrameToMediaPipe);
}

function draw() {
  calculateViewTransform();

  drawFullScreenBackground();

  push();
  translate(viewX, viewY);
  scale(viewScale);

  drawMainPanel();
  drawCameraView();
  drawGameInfo();
  drawGestureGuide();

  if (gameState === "roundResult") {
    drawRoundResultModal();
    updateRoundResultModal();
  }

  if (gameState === "menu") {
    drawMenuPanel();
  }

  if (gameState === "ended") {
    drawEndedPanel();
  }

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateViewTransform();
}

function calculateViewTransform() {
  const scaleX = width / DESIGN_W;
  const scaleY = height / DESIGN_H;

  viewScale = min(scaleX, scaleY);
  viewX = (width - DESIGN_W * viewScale) / 2;
  viewY = (height - DESIGN_H * viewScale) / 2;
}

// =====================================================
// MediaPipe Hands 設定
// =====================================================

function setupMediaPipeHands() {
  hands = new Hands({
    locateFile: function (file) {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.65
  });

  hands.onResults(onHandsResults);
}

async function sendFrameToMediaPipe() {
  if (
    video &&
    video.elt &&
    video.elt.readyState >= 2 &&
    hands &&
    !isSendingFrame
  ) {
    try {
      isSendingFrame = true;
      await hands.send({ image: video.elt });
    } catch (error) {
      console.error("MediaPipe 影像送出失敗：", error);
      cameraError = "MediaPipe 影像處理失敗";
    } finally {
      isSendingFrame = false;
    }
  }

  requestAnimationFrame(sendFrameToMediaPipe);
}

function onHandsResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    handLandmarks = results.multiHandLandmarks[0];

    detectedGesture = detectGesture(handLandmarks);

    if (gameState === "playing") {
      handlePlayingGesture(detectedGesture);
    }

    if (gameState === "menu") {
      handleMenuGesture(handLandmarks);
    }
  } else {
    handLandmarks = null;
    detectedGesture = "none";
    resetPlayGestureOnly();

    if (needReleaseHand && gameState === "playing") {
      needReleaseHand = false;
      resultText = `第 ${round} 回合開始，請出拳`;
    }

    if (gameState === "menu") {
      resetMenuGestureOnly();
    }
  }
}

// =====================================================
// 手勢辨識核心
// =====================================================

function isFingerExtended(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y;
}

function getFingerStates(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return {
      indexUp: false,
      middleUp: false,
      ringUp: false,
      pinkyUp: false
    };
  }

  return {
    indexUp: isFingerExtended(landmarks, 8, 6),
    middleUp: isFingerExtended(landmarks, 12, 10),
    ringUp: isFingerExtended(landmarks, 16, 14),
    pinkyUp: isFingerExtended(landmarks, 20, 18)
  };
}

// 遊戲中：石頭、剪刀、布
function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return "none";
  }

  const fingers = getFingerStates(landmarks);

  const indexUp = fingers.indexUp;
  const middleUp = fingers.middleUp;
  const ringUp = fingers.ringUp;
  const pinkyUp = fingers.pinkyUp;

  const extendedCount = [
    indexUp,
    middleUp,
    ringUp,
    pinkyUp
  ].filter(Boolean).length;

  if (extendedCount === 0) {
    return "rock";
  }

  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return "scissors";
  }

  if (extendedCount >= 4) {
    return "paper";
  }

  return "unknown";
}

// 三回合結束後選單：特別避開石頭、剪刀、布
function detectMenuGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return "none";
  }

  const fingers = getFingerStates(landmarks);

  const indexUp = fingers.indexUp;
  const middleUp = fingers.middleUp;
  const ringUp = fingers.ringUp;
  const pinkyUp = fingers.pinkyUp;

  // ☝️ 只伸食指：繼續遊戲
  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    return "continue";
  }

  // 🤙 只伸小指：結束遊戲
  if (!indexUp && !middleUp && !ringUp && pinkyUp) {
    return "exit";
  }

  return "none";
}

function gestureToChinese(gesture) {
  if (gesture === "rock") return "石頭 ✊";
  if (gesture === "scissors") return "剪刀 ✌️";
  if (gesture === "paper") return "布 ✋";
  if (gesture === "unknown") return "手勢不明確";
  return "尚未偵測";
}

// =====================================================
// 遊戲邏輯
// =====================================================

function handlePlayingGesture(gesture) {
  if (needReleaseHand) {
    resultText = "請先放開手勢，再開始下一回合";
    resetPlayGestureOnly();
    return;
  }

  if (gesture !== "rock" && gesture !== "scissors" && gesture !== "paper") {
    resetPlayGestureOnly();
    return;
  }

  const now = millis();

  if (gesture !== currentPlayGesture) {
    currentPlayGesture = gesture;
    playGestureStartTime = now;
    playGestureProgress = 0;
    return;
  }

  const elapsed = now - playGestureStartTime;
  playGestureProgress = constrain(elapsed / PLAY_CONFIRM_TIME, 0, 1);

  if (elapsed >= PLAY_CONFIRM_TIME) {
    playRound(gesture);
    resetPlayGestureOnly();
  }
}

function resetPlayGestureOnly() {
  currentPlayGesture = "none";
  playGestureStartTime = null;
  playGestureProgress = 0;
}

function playRound(playerGesture) {
  const choices = ["rock", "scissors", "paper"];
  const computerGesture = random(choices);

  playerMove = gestureToChinese(playerGesture);
  computerMove = gestureToChinese(computerGesture);

  const winner = getWinner(playerGesture, computerGesture);

  if (winner === "player") {
    playerScore++;
    roundResultTitle = "你贏了！";
    roundResultEmoji = "🎉";
    roundResultMessage = `你出 ${gestureToChinese(playerGesture)}，電腦出 ${gestureToChinese(computerGesture)}`;
    resultText = "你贏了這一回合！";
  } else if (winner === "computer") {
    computerScore++;
    roundResultTitle = "你輸了！";
    roundResultEmoji = "💪";
    roundResultMessage = `你出 ${gestureToChinese(playerGesture)}，電腦出 ${gestureToChinese(computerGesture)}`;
    resultText = "電腦贏了這一回合！";
  } else {
    roundResultTitle = "平手！";
    roundResultEmoji = "🤝";
    roundResultMessage = `你和電腦都出 ${gestureToChinese(playerGesture)}`;
    resultText = "這一回合平手！";
  }

  scoreText = `第 ${round} / ${maxRound} 回合｜你 ${playerScore}：${computerScore} 電腦`;

  gameState = "roundResult";
  roundResultStartTime = millis();
}

function updateRoundResultModal() {
  const elapsed = millis() - roundResultStartTime;

  if (elapsed < ROUND_RESULT_TIME) return;

  if (round >= maxRound) {
    enterMenuState();
  } else {
    round++;
    playerMove = "等待手勢";
    computerMove = "等待中";
    resultText = `第 ${round} 回合準備開始，請先放開手勢`;
    scoreText = `第 ${round} / ${maxRound} 回合｜你 ${playerScore}：${computerScore} 電腦`;
    gameState = "playing";
    needReleaseHand = true;
  }
}

function getWinner(player, computer) {
  if (player === computer) return "draw";

  if (
    (player === "rock" && computer === "scissors") ||
    (player === "scissors" && computer === "paper") ||
    (player === "paper" && computer === "rock")
  ) {
    return "player";
  }

  return "computer";
}

function enterMenuState() {
  gameState = "menu";

  if (playerScore > computerScore) {
    resultText = "三回合結束：你獲得勝利！太強了 👑";
  } else if (playerScore < computerScore) {
    resultText = "三回合結束：電腦獲勝！下次一定可以贏 🔥";
  } else {
    resultText = "三回合結束：平手！勢均力敵 ⚖️";
  }

  menuStatus = "請選擇：☝️ 只伸食指繼續，🤙 只伸小指結束";
  resetPlayGestureOnly();
  resetMenuGestureOnly();
}

// =====================================================
// 三回合結束選單手勢
// =====================================================

function handleMenuGesture(landmarks) {
  const menuGesture = detectMenuGesture(landmarks);
  const now = millis();

  if (menuGesture === "none") {
    resetMenuGestureOnly();
    menuStatus = "請做出明確手勢：☝️ 食指繼續 或 🤙 小指結束";
    return;
  }

  if (menuGesture !== currentMenuGesture) {
    currentMenuGesture = menuGesture;
    menuGestureStartTime = now;
    menuGestureProgress = 0;
    menuGestureTriggered = false;

    if (menuGesture === "continue") {
      menuStatus = "偵測到 ☝️ 只伸食指，請保持 2 秒";
    }

    if (menuGesture === "exit") {
      menuStatus = "偵測到 🤙 只伸小指，請保持 2 秒";
    }

    return;
  }

  const elapsed = now - menuGestureStartTime;
  menuGestureProgress = constrain(elapsed / MENU_CONFIRM_TIME, 0, 1);

  if (elapsed >= MENU_CONFIRM_TIME && !menuGestureTriggered) {
    menuGestureTriggered = true;

    if (menuGesture === "continue") {
      menuStatus = "確認成功：繼續遊戲！";
      setTimeout(function () {
        restartGame();
      }, 500);
    }

    if (menuGesture === "exit") {
      menuStatus = "確認成功：結束遊戲！";
      setTimeout(function () {
        endGame();
      }, 500);
    }
  }
}

function resetMenuGestureOnly() {
  currentMenuGesture = "none";
  menuGestureStartTime = null;
  menuGestureProgress = 0;
  menuGestureTriggered = false;
}

function restartGame() {
  gameState = "playing";
  playerMove = "等待手勢";
  computerMove = "等待中";
  resultText = "新的一局開始！第 1 回合請出拳";
  scoreText = "第 1 / 3 回合";
  playerScore = 0;
  computerScore = 0;
  round = 1;
  needReleaseHand = true;
  resetPlayGestureOnly();
  resetMenuGestureOnly();
}

function endGame() {
  gameState = "ended";
  resultText = "遊戲已結束，感謝遊玩！";
  scoreText = "你已完成 AI 手勢辨識互動體驗";
  resetPlayGestureOnly();
  resetMenuGestureOnly();
}

// =====================================================
// 畫面繪製
// =====================================================

function drawFullScreenBackground() {
  background(2, 6, 23);

  noStroke();

  fill(56, 189, 248, 24);
  circle(width * 0.12, height * 0.16, min(width, height) * 0.5);

  fill(168, 85, 247, 22);
  circle(width * 0.88, height * 0.82, min(width, height) * 0.55);

  fill(34, 197, 94, 12);
  circle(width * 0.5, height * 1.05, min(width, height) * 0.7);
}

function drawMainPanel() {
  noStroke();

  fill(15, 23, 42, 245);
  rect(0, 0, DESIGN_W, DESIGN_H, 34);

  fill(30, 41, 59, 220);
  rect(26, 26, DESIGN_W - 52, DESIGN_H - 52, 30);

  fill(56, 189, 248, 36);
  circle(DESIGN_W - 120, 110, 230);

  fill(168, 85, 247, 30);
  circle(120, DESIGN_H - 90, 220);

  fill(34, 197, 94, 16);
  circle(DESIGN_W * 0.5, DESIGN_H + 20, 300);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(42);
  textStyle(BOLD);
  text("AI 手勢魔法猜拳遊戲", DESIGN_W / 2, 62);

  textStyle(NORMAL);
  textSize(18);
  fill(203, 213, 225);
  text("每回合結果視窗｜防連續誤判｜選單手勢獨立設計", DESIGN_W / 2, 96);
}

function drawCameraView() {
  const camX = 56;
  const camY = 135;
  const camW = 570;
  const camH = 360;

  noStroke();
  fill(2, 6, 23, 150);
  rect(camX - 10, camY - 10, camW + 20, camH + 52, 32);

  push();
  translate(camX + camW, camY);
  scale(-1, 1);

  if (video && video.elt && video.elt.readyState >= 2) {
    image(video, 0, 0, camW, camH);
  } else {
    fill(15, 23, 42);
    rect(0, 0, camW, camH, 26);

    push();
    scale(-1, 1);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text(cameraStatus, -camW / 2, camH / 2 - 10);

    if (cameraError) {
      fill(250, 204, 21);
      textSize(14);
      text(cameraError, -camW / 2, camH / 2 + 22);
    }
    pop();
  }

  pop();

  noFill();
  stroke(cameraReady ? color(34, 211, 238, 220) : color(250, 204, 21, 220));
  strokeWeight(4);
  rect(camX, camY, camW, camH, 28);

  noStroke();
  fill(cameraReady ? color(14, 165, 233) : color(234, 179, 8));
  rect(camX + 22, camY + 20, 128, 34, 999);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  textStyle(BOLD);
  text(cameraReady ? "LIVE CAMERA" : "CAMERA", camX + 86, camY + 37);

  drawHandPoints(camX, camY, camW, camH);

  noStroke();
  fill(cameraReady ? color(34, 197, 94) : color(250, 204, 21));
  textAlign(LEFT, CENTER);
  textSize(15);
  textStyle(NORMAL);
  text(cameraStatus, camX + 12, camY + camH + 28);
}

function drawHandPoints(camX, camY, camW, camH) {
  if (!handLandmarks) return;

  push();

  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
  ];

  stroke(34, 211, 238, 190);
  strokeWeight(3);

  for (let i = 0; i < connections.length; i++) {
    const a = handLandmarks[connections[i][0]];
    const b = handLandmarks[connections[i][1]];

    const ax = camX + (1 - a.x) * camW;
    const ay = camY + a.y * camH;
    const bx = camX + (1 - b.x) * camW;
    const by = camY + b.y * camH;

    line(ax, ay, bx, by);
  }

  for (let i = 0; i < handLandmarks.length; i++) {
    const lm = handLandmarks[i];

    const x = camX + (1 - lm.x) * camW;
    const y = camY + lm.y * camH;

    noStroke();

    if ([4, 8, 12, 16, 20].includes(i)) {
      fill(250, 204, 21);
      circle(x, y, 13);
    } else {
      fill(255);
      circle(x, y, 7);
    }
  }

  pop();
}

function drawGameInfo() {
  const infoX = 675;
  const infoY = 135;
  const infoW = 545;
  const infoH = 360;

  noStroke();
  fill(2, 6, 23, 165);
  rect(infoX - 10, infoY - 10, infoW + 20, infoH + 20, 32);

  fill(15, 23, 42, 226);
  rect(infoX, infoY, infoW, infoH, 28);

  fill(99, 102, 241);
  rect(infoX + 28, infoY + 24, 110, 34, 999);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  textStyle(BOLD);
  text("GAME INFO", infoX + 83, infoY + 41);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(28);
  textStyle(BOLD);
  text("遊戲資訊", infoX + 30, infoY + 74);

  textStyle(NORMAL);
  textSize(19);
  fill(226, 232, 240);

  text(`目前狀態：${getGameStateText()}`, infoX + 30, infoY + 125);
  text(`目前回合：第 ${round} / ${maxRound} 回合`, infoX + 30, infoY + 165);
  text(`你出：${playerMove}`, infoX + 30, infoY + 205);
  text(`電腦：${computerMove}`, infoX + 30, infoY + 245);

  fill(250, 204, 21);
  textSize(20);
  text(resultText, infoX + 30, infoY + 292, infoW - 60, 55);

  const scoreY = infoY + infoH - 50;

  fill(8, 47, 73, 225);
  rect(infoX + 28, scoreY, infoW - 56, 36, 999);

  fill(125, 211, 252);
  textAlign(CENTER, CENTER);
  textSize(17);
  textStyle(BOLD);
  text(scoreText, infoX + infoW / 2, scoreY + 18);
}

function drawGestureGuide() {
  const x = 56;
  const y = 535;
  const w = DESIGN_W - 112;
  const h = 120;

  noStroke();
  fill(2, 6, 23, 145);
  rect(x - 8, y - 8, w + 16, h + 16, 32);

  fill(51, 65, 85, 225);
  rect(x, y, w, h, 28);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(22);
  textStyle(BOLD);
  text("手勢操作說明", x + 30, y + 22);

  textStyle(NORMAL);
  textSize(18);
  fill(226, 232, 240);

  if (gameState === "playing") {
    text("遊戲中請出拳：✊ 石頭　✌️ 剪刀　✋ 布", x + 30, y + 62);

    let progressText = "";
    if (needReleaseHand) {
      progressText = "｜請先放開手勢";
    } else if (currentPlayGesture !== "none") {
      progressText = `｜確認中 ${Math.floor(playGestureProgress * 100)}%`;
    }

    text(`目前 AI 偵測：${gestureToChinese(detectedGesture)} ${progressText}`, x + 30, y + 92);
  } else if (gameState === "roundResult") {
    text("回合結果顯示中，暫停偵測，避免連續誤判。", x + 30, y + 72);
  } else if (gameState === "menu") {
    text("遊戲結束選單：☝️ 只伸食指保持 2 秒＝繼續　｜　🤙 只伸小指保持 2 秒＝結束", x + 30, y + 62);
    text(`目前選單狀態：${menuStatus}`, x + 30, y + 92);
  } else {
    text("遊戲已結束，重新整理網頁可以再次開始。", x + 30, y + 75);
  }
}

function drawRoundResultModal() {
  const elapsed = millis() - roundResultStartTime;
  const remain = max(0, ROUND_RESULT_TIME - elapsed);
  const progress = constrain(elapsed / ROUND_RESULT_TIME, 0, 1);
  const countdown = ceil(remain / 1000);

  const x = 335;
  const y = 190;
  const w = 610;
  const h = 340;

  noStroke();
  fill(0, 0, 0, 175);
  rect(0, 0, DESIGN_W, DESIGN_H, 34);

  fill(248, 250, 252);
  rect(x, y, w, h, 36);

  textAlign(CENTER, CENTER);

  textSize(70);
  text(roundResultEmoji, x + w / 2, y + 70);

  fill(15, 23, 42);
  textSize(42);
  textStyle(BOLD);
  text(roundResultTitle, x + w / 2, y + 135);

  textStyle(NORMAL);
  textSize(22);
  fill(51, 65, 85);
  text(roundResultMessage, x + w / 2, y + 185);

  fill(100, 116, 139);
  textSize(20);

  if (round >= maxRound) {
    text(`即將進入結束選單：${countdown}`, x + w / 2, y + 230);
  } else {
    text(`即將進入第 ${round + 1} 回合：${countdown}`, x + w / 2, y + 230);
  }

  const barX = x + 90;
  const barY = y + 270;
  const barW = w - 180;
  const barH = 24;

  fill(226, 232, 240);
  rect(barX, barY, barW, barH, 999);

  fill(34, 197, 94);
  rect(barX, barY, barW * progress, barH, 999);

  fill(15, 23, 42);
  textSize(14);
  textStyle(BOLD);
  text(`${Math.floor(progress * 100)}%`, barX + barW / 2, barY + barH / 2);
}

function drawMenuPanel() {
  const x = 280;
  const y = 210;
  const w = 720;
  const h = 290;

  noStroke();
  fill(0, 0, 0, 180);
  rect(0, 0, DESIGN_W, DESIGN_H, 34);

  fill(248, 250, 252);
  rect(x, y, w, h, 34);

  fill(15, 23, 42);
  textAlign(CENTER, TOP);
  textSize(36);
  textStyle(BOLD);
  text("遊戲結束選單", DESIGN_W / 2, y + 36);

  textStyle(NORMAL);
  textSize(22);
  fill(51, 65, 85);
  text("請使用與猜拳不同的手勢選擇下一步", DESIGN_W / 2, y + 92);

  textSize(24);
  fill(22, 101, 52);
  text("☝️ 只伸食指 2 秒：繼續遊戲", DESIGN_W / 2, y + 145);

  fill(153, 27, 27);
  text("🤙 只伸小指 2 秒：結束遊戲", DESIGN_W / 2, y + 185);

  drawProgressBar(x + 110, y + 230, w - 220, 26);
}

function drawProgressBar(x, y, w, h) {
  noStroke();
  fill(226, 232, 240);
  rect(x, y, w, h, 999);

  if (currentMenuGesture === "continue") {
    fill(34, 197, 94);
  } else if (currentMenuGesture === "exit") {
    fill(239, 68, 68);
  } else {
    fill(148, 163, 184);
  }

  rect(x, y, w * menuGestureProgress, h, 999);

  fill(15, 23, 42);
  textAlign(CENTER, CENTER);
  textSize(14);
  textStyle(BOLD);
  text(`${Math.floor(menuGestureProgress * 100)}%`, x + w / 2, y + h / 2);
}

function drawEndedPanel() {
  const x = 320;
  const y = 235;
  const w = 640;
  const h = 250;

  noStroke();
  fill(0, 0, 0, 185);
  rect(0, 0, DESIGN_W, DESIGN_H, 34);

  fill(248, 250, 252);
  rect(x, y, w, h, 34);

  fill(15, 23, 42);
  textAlign(CENTER, CENTER);
  textSize(40);
  textStyle(BOLD);
  text("感謝遊玩！", DESIGN_W / 2, y + 75);

  textStyle(NORMAL);
  textSize(24);
  fill(71, 85, 105);
  text("你已完成 AI 手勢辨識互動體驗", DESIGN_W / 2, y + 140);

  textSize(18);
  fill(100, 116, 139);
  text("若要重新開始，請重新整理網頁", DESIGN_W / 2, y + 190);
}

function getGameStateText() {
  if (gameState === "playing" && needReleaseHand) return "等待放開手勢";
  if (gameState === "playing") return "遊戲進行中";
  if (gameState === "roundResult") return "回合結果顯示中";
  if (gameState === "menu") return "等待選單手勢";
  if (gameState === "ended") return "遊戲已結束";
  return "未知";
}
function drawCreatorBadge() {
  const badgeX = DESIGN_W - 360;
  const badgeY = 42;
  const badgeW = 285;
  const badgeH = 54;

  push();

  // 外層光暈
  noStroke();
  fill(56, 189, 248, 35);
  rect(badgeX - 6, badgeY - 6, badgeW + 12, badgeH + 12, 22);

  // 主體膠囊
  fill(2, 6, 23, 210);
  rect(badgeX, badgeY, badgeW, badgeH, 18);

  // 左側小亮點
  fill(34, 211, 238);
  circle(badgeX + 26, badgeY + badgeH / 2, 12);

  fill(250, 204, 21);
  circle(badgeX + 26, badgeY + badgeH / 2, 5);

  // 文字
  textAlign(LEFT, CENTER);

  textStyle(BOLD);
  textSize(15);
  fill(255);
  text("CREATOR", badgeX + 46, badgeY + 18);

  textStyle(NORMAL);
  textSize(16);
  fill(203, 213, 225);
  text("414736529  王家興創作", badgeX + 46, badgeY + 38);

  pop();
}