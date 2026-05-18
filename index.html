<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <title>AI 手勢魔法猜拳遊戲</title>

  <!-- p5.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>

  <!-- MediaPipe Hands -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>

  <style>
    body {
      margin: 0;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: white;
      font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      text-align: center;
    }

    h1 {
      margin-top: 18px;
      margin-bottom: 6px;
      font-size: 32px;
      letter-spacing: 2px;
    }

    .subtitle {
      color: #cbd5e1;
      margin-bottom: 10px;
    }

    #canvasContainer {
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }

    .learning-box {
      width: 90%;
      max-width: 760px;
      margin: 14px auto 24px;
      padding: 14px 18px;
      border-radius: 16px;
      background: #fef3c7;
      color: #78350f;
      font-size: 15px;
      line-height: 1.7;
      text-align: left;
      box-shadow: 0 8px 18px rgba(0,0,0,0.25);
    }

    video {
      display: none;
    }
  </style>
</head>

<body>
  <h1>AI 手勢魔法猜拳遊戲</h1>
  <div class="subtitle">
    遊戲中：✊石頭　✌️剪刀　✋布｜遊戲結束：✋繼續　✊結束
  </div>

  <div id="canvasContainer"></div>

  <div class="learning-box">
    <strong>學習小知識：</strong>
    MediaPipe Hands 會偵測手上的 21 個關鍵點。
    本作品透過比較「指尖」與「指節」的位置，判斷手指是否伸直，
    進一步辨識石頭、剪刀、布，以及遊戲結束後的選單控制。
  </div>

  <video id="inputVideo"></video>

  <script>
    // =====================================================
    // AI 手勢魔法猜拳遊戲
    // p5.js + MediaPipe Hands 完整版
    // =====================================================

    let videoElement;
    let hands;
    let camera;

    let handLandmarks = null;
    let detectedGesture = "none";

    // 遊戲狀態
    let gameState = "playing"; 
    // playing：遊戲中
    // menu：遊戲結束選單
    // ended：遊戲完全結束

    let playerMove = "等待手勢";
    let computerMove = "等待中";
    let resultText = "請出拳：石頭、剪刀、布";
    let scoreText = "請先完成一局遊戲";

    let playerScore = 0;
    let computerScore = 0;
    let round = 1;
    const maxRound = 3;

    // 防止同一手勢連續觸發
    let lastGameGesture = "none";
    let lastGameGestureTime = 0;
    const gameGestureCooldown = 1800;

    // 選單手勢控制
    const GESTURE_CONFIRM_TIME = 2000;
    let currentMenuGesture = "none";
    let gestureStartTime = null;
    let gestureProgress = 0;
    let menuStatus = "請做出手勢選擇";
    let gestureTriggered = false;

    function setup() {
      const canvas = createCanvas(760, 560);
      canvas.parent("canvasContainer");

      videoElement = document.getElementById("inputVideo");

      setupMediaPipeHands();
    }

    function draw() {
      background(15, 23, 42);

      drawMainPanel();
      drawCameraView();
      drawGameInfo();
      drawGestureGuide();

      if (gameState === "menu") {
        drawMenuPanel();
      }

      if (gameState === "ended") {
        drawEndedPanel();
      }
    }

    // =====================================================
    // MediaPipe 設定
    // =====================================================

    function setupMediaPipeHands() {
      hands = new Hands({
        locateFile: function(file) {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      hands.onResults(onHandsResults);

      camera = new Camera(videoElement, {
        onFrame: async function() {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });

      camera.start();
    }

    function onHandsResults(results) {
      if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
      ) {
        handLandmarks = results.multiHandLandmarks[0];
        detectedGesture = detectGesture(handLandmarks);

        if (gameState === "playing") {
          handlePlayingGesture(detectedGesture);
        } else if (gameState === "menu") {
          handleMenuGesture(handLandmarks);
        }
      } else {
        handLandmarks = null;
        detectedGesture = "none";

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

    function detectGesture(landmarks) {
      if (!landmarks || landmarks.length < 21) {
        return "none";
      }

      const indexUp = isFingerExtended(landmarks, 8, 6);
      const middleUp = isFingerExtended(landmarks, 12, 10);
      const ringUp = isFingerExtended(landmarks, 16, 14);
      const pinkyUp = isFingerExtended(landmarks, 20, 18);

      const extendedCount = [
        indexUp,
        middleUp,
        ringUp,
        pinkyUp
      ].filter(Boolean).length;

      // 石頭：四根手指都沒有伸直
      if (extendedCount === 0) {
        return "rock";
      }

      // 剪刀：食指與中指伸直，無名指與小指彎曲
      if (indexUp && middleUp && !ringUp && !pinkyUp) {
        return "scissors";
      }

      // 布：四根手指都伸直
      if (extendedCount >= 4) {
        return "paper";
      }

      return "unknown";
    }

    function gestureToChinese(gesture) {
      if (gesture === "rock") return "石頭 ✊";
      if (gesture === "scissors") return "剪刀 ✌️";
      if (gesture === "paper") return "布 ✋";
      if (gesture === "unknown") return "手勢不明確";
      return "尚未偵測";
    }

    // =====================================================
    // 遊戲中手勢處理
    // =====================================================

    function handlePlayingGesture(gesture) {
      if (gesture !== "rock" && gesture !== "scissors" && gesture !== "paper") {
        return;
      }

      const now = millis();

      if (
        gesture === lastGameGesture &&
        now - lastGameGestureTime < gameGestureCooldown
      ) {
        return;
      }

      lastGameGesture = gesture;
      lastGameGestureTime = now;

      playRound(gesture);
    }

    function playRound(playerGesture) {
      const choices = ["rock", "scissors", "paper"];
      const computerGesture = random(choices);

      playerMove = gestureToChinese(playerGesture);
      computerMove = gestureToChinese(computerGesture);

      const winner = getWinner(playerGesture, computerGesture);

      if (winner === "player") {
        playerScore++;
        resultText = "你贏了這一回合！AI 被你打敗了 🎉";
      } else if (winner === "computer") {
        computerScore++;
        resultText = "電腦贏了這一回合，再試一次 💪";
      } else {
        resultText = "平手！你們太有默契了 🤝";
      }

      scoreText = `第 ${round} / ${maxRound} 回合｜你 ${playerScore}：${computerScore} 電腦`;

      if (round >= maxRound) {
        setTimeout(() => {
          enterMenuState();
        }, 600);
      } else {
        round++;
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

      menuStatus = "請選擇：張開手掌繼續，握拳結束";
      resetMenuGestureOnly();
    }

    // =====================================================
    // 遊戲結束選單手勢
    // =====================================================

    function handleMenuGesture(landmarks) {
      const gesture = detectGesture(landmarks);

      let menuGesture = "none";

      if (gesture === "paper") {
        menuGesture = "continue";
      } else if (gesture === "rock") {
        menuGesture = "exit";
      }

      const now = millis();

      if (menuGesture === "none") {
        resetMenuGestureOnly();
        menuStatus = "請做出明確手勢：✋繼續 或 ✊結束";
        return;
      }

      if (menuGesture !== currentMenuGesture) {
        currentMenuGesture = menuGesture;
        gestureStartTime = now;
        gestureProgress = 0;
        gestureTriggered = false;

        if (menuGesture === "continue") {
          menuStatus = "偵測到張開手掌，請保持 2 秒";
        } else if (menuGesture === "exit") {
          menuStatus = "偵測到握拳，請保持 2 秒";
        }

        return;
      }

      const elapsed = now - gestureStartTime;
      gestureProgress = constrain(
        elapsed / GESTURE_CONFIRM_TIME,
        0,
        1
      );

      if (elapsed >= GESTURE_CONFIRM_TIME && !gestureTriggered) {
        gestureTriggered = true;

        if (menuGesture === "continue") {
          menuStatus = "確認成功：繼續遊戲！";
          setTimeout(() => {
            restartGame();
          }, 500);
        } else if (menuGesture === "exit") {
          menuStatus = "確認成功：結束遊戲！";
          setTimeout(() => {
            endGame();
          }, 500);
        }
      }
    }

    function resetMenuGestureOnly() {
      currentMenuGesture = "none";
      gestureStartTime = null;
      gestureProgress = 0;
      gestureTriggered = false;
    }

    function restartGame() {
      gameState = "playing";
      playerMove = "等待手勢";
      computerMove = "等待中";
      resultText = "新的一局開始！請出拳：石頭、剪刀、布";
      scoreText = "請先完成一局遊戲";
      playerScore = 0;
      computerScore = 0;
      round = 1;
      lastGameGesture = "none";
      lastGameGestureTime = 0;
      resetMenuGestureOnly();
    }

    function endGame() {
      gameState = "ended";
      resultText = "遊戲已結束，感謝遊玩！";
      scoreText = "你已完成 AI 手勢互動體驗";
      resetMenuGestureOnly();
    }

    // =====================================================
    // 畫面繪製
    // =====================================================

    function drawMainPanel() {
      noStroke();
      fill(30, 41, 59);
      rect(20, 20, width - 40, height - 40, 24);

      fill(255);
      textAlign(CENTER, CENTER);
      textSize(28);
      textStyle(BOLD);
      text("AI 手勢魔法猜拳遊戲", width / 2, 52);

      textSize(15);
      textStyle(NORMAL);
      fill(203, 213, 225);
      text("使用手勢與 AI 互動，學習 MediaPipe 手部辨識原理", width / 2, 82);
    }

    function drawCameraView() {
      const camX = 50;
      const camY = 110;
      const camW = 360;
      const camH = 270;

      push();
      translate(camX + camW, camY);
      scale(-1, 1);

      if (videoElement && videoElement.readyState >= 2) {
        image(videoElement, 0, 0, camW, camH);
      } else {
        fill(15, 23, 42);
        rect(0, 0, camW, camH);
      }

      pop();

      noFill();
      stroke(148, 163, 184);
      strokeWeight(3);
      rect(camX, camY, camW, camH, 18);

      drawHandPoints(camX, camY, camW, camH);
    }

    function drawHandPoints(camX, camY, camW, camH) {
      if (!handLandmarks) return;

      push();

      for (let i = 0; i < handLandmarks.length; i++) {
        const lm = handLandmarks[i];

        // 因為鏡頭有左右翻轉，所以 x 也反轉
        const x = camX + (1 - lm.x) * camW;
        const y = camY + lm.y * camH;

        noStroke();
        fill(250, 204, 21);
        circle(x, y, 7);
      }

      pop();
    }

    function drawGameInfo() {
      const infoX = 440;
      const infoY = 110;
      const infoW = 270;
      const infoH = 270;

      noStroke();
      fill(15, 23, 42);
      rect(infoX, infoY, infoW, infoH, 18);

      fill(255);
      textAlign(LEFT, TOP);
      textSize(20);
      textStyle(BOLD);
      text("遊戲資訊", infoX + 22, infoY + 20);

      textStyle(NORMAL);
      textSize(16);
      fill(226, 232, 240);
      text(`目前狀態：${getGameStateText()}`, infoX + 22, infoY + 62);

      text(`你出：${playerMove}`, infoX + 22, infoY + 98);
      text(`電腦：${computerMove}`, infoX + 22, infoY + 134);

      fill(250, 204, 21);
      textSize(17);
      text(resultText, infoX + 22, infoY + 172, infoW - 44, 70);

      fill(125, 211, 252);
      textSize(15);
      text(scoreText, infoX + 22, infoY + 238);
    }

    function drawGestureGuide() {
      const x = 50;
      const y = 405;
      const w = 660;
      const h = 110;

      noStroke();
      fill(51, 65, 85);
      rect(x, y, w, h, 18);

      fill(255);
      textAlign(LEFT, TOP);
      textSize(18);
      textStyle(BOLD);
      text("手勢操作說明", x + 22, y + 16);

      textStyle(NORMAL);
      textSize(15);
      fill(226, 232, 240);

      if (gameState === "playing") {
        text("遊戲中請出拳：✊ 石頭　✌️ 剪刀　✋ 布", x + 22, y + 50);
        text(`目前 AI 偵測：${gestureToChinese(detectedGesture)}`, x + 22, y + 78);
      } else if (gameState === "menu") {
        text("遊戲結束選單：✋ 張開手掌保持 2 秒＝繼續　✊ 握拳保持 2 秒＝結束", x + 22, y + 50);
        text(`目前選單狀態：${menuStatus}`, x + 22, y + 78);
      } else {
        text("遊戲已結束，重新整理網頁可以再次開始。", x + 22, y + 55);
      }
    }

    function drawMenuPanel() {
      const x = 90;
      const y = 150;
      const w = 580;
      const h = 220;

      noStroke();
      fill(0, 0, 0, 170);
      rect(0, 0, width, height);

      fill(248, 250, 252);
      rect(x, y, w, h, 24);

      fill(15, 23, 42);
      textAlign(CENTER, TOP);
      textSize(26);
      textStyle(BOLD);
      text("遊戲結束選單", width / 2, y + 24);

      textStyle(NORMAL);
      textSize(18);
      fill(51, 65, 85);
      text("請使用 AI 手勢選擇下一步", width / 2, y + 68);

      textSize(20);
      fill(22, 101, 52);
      text("✋ 張開手掌 2 秒：繼續遊戲", width / 2, y + 105);

      fill(153, 27, 27);
      text("✊ 握拳 2 秒：結束遊戲", width / 2, y + 137);

      drawProgressBar(x + 80, y + 175, w - 160, 22);
    }

    function drawProgressBar(x, y, w, h) {
      noStroke();
      fill(226, 232, 240);
      rect(x, y, w, h, 999);

      let barColor;

      if (currentMenuGesture === "continue") {
        barColor = color(34, 197, 94);
      } else if (currentMenuGesture === "exit") {
        barColor = color(239, 68, 68);
      } else {
        barColor = color(148, 163, 184);
      }

      fill(barColor);
      rect(x, y, w * gestureProgress, h, 999);

      fill(15, 23, 42);
      textAlign(CENTER, CENTER);
      textSize(13);
      textStyle(BOLD);
      text(`${Math.floor(gestureProgress * 100)}%`, x + w / 2, y + h / 2);
    }

    function drawEndedPanel() {
      const x = 120;
      const y = 160;
      const w = 520;
      const h = 190;

      noStroke();
      fill(0, 0, 0, 180);
      rect(0, 0, width, height);

      fill(248, 250, 252);
      rect(x, y, w, h, 24);

      fill(15, 23, 42);
      textAlign(CENTER, CENTER);
      textSize(30);
      textStyle(BOLD);
      text("感謝遊玩！", width / 2, y + 55);

      textStyle(NORMAL);
      textSize(18);
      fill(71, 85, 105);
      text("你已完成 AI 手勢辨識互動體驗", width / 2, y + 105);

      textSize(15);
      fill(100, 116, 139);
      text("若要重新開始，請重新整理網頁", width / 2, y + 145);
    }

    function getGameStateText() {
      if (gameState === "playing") return "遊戲進行中";
      if (gameState === "menu") return "等待選單手勢";
      if (gameState === "ended") return "遊戲已結束";
      return "未知";
    }
  </script>
</body>
</html>