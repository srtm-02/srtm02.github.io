/* ==========================================
   ワートリ好き顔メーカー (精度向上・全登場優先＆勝率重視版)
   ========================================== */

// 回数を150回に設定
const TOTAL_ROUNDS = 150;

const ROUND_COUNTS = [
  { size: 4, count: 50 },
  { size: 3, count: 50 },
  { size: 2, count: 50 }
];

const $ = selector => document.querySelector(selector);

const startSection = $("#start-section");
const duelMode = $("#duel-mode");
const resultSection = $("#result-section");

const startButton = $("#start-button");
const duelCards = $("#duel-cards");
const duelProgressText = $("#duel-progress-text");
const duelProgressBar = $("#duel-progress-bar");
const duelMessage = $("#duel-message");

const resultGrid = $("#result-grid");
const resultSubtitle = $("#result-subtitle");
const resultMessage = $("#result-message");

const duelFinishButton = $("#duel-finish-button");
const restartFromResultButton = $("#restart-from-result-button");
const saveButton = $("#save-button");
const copyButton = $("#copy-button");

let currentMode = "start";
let selectedMembers = [];

let choiceCounts = new Map();
let appearanceCounts = new Map();

let roundPlan = [];
let duelIndex = 0;

// ==========================================
// 共通関数
// ==========================================

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createImage(member) {
  const img = document.createElement("img");
  img.src = member.image;
  img.alt = member.name;
  img.loading = "lazy";

  img.addEventListener("error", () => {
    img.removeAttribute("src");
    img.alt = `${member.name}（画像を読み込めません）`;
  }, { once: true });

  return img;
}

// ==========================================
// 画面切り替え
// ==========================================

function showMode(mode) {
  currentMode = mode;

  startSection.hidden = mode !== "start";
  duelMode.hidden = mode !== "duel";
  resultSection.hidden = mode !== "result";
}

// ==========================================
// 出題順を作成
// ==========================================

function buildRoundPlan() {
  const plan = [];

  ROUND_COUNTS.forEach(({ size, count }) => {
    for (let i = 0; i < count; i++) {
      plan.push(size);
    }
  });

  while (plan.length < TOTAL_ROUNDS) {
    plan.push(2);
  }

  return plan.slice(0, TOTAL_ROUNDS);
}

// ==========================================
// 診断開始・リセット
// ==========================================

function startDuel() {
  if (!Array.isArray(MEMBERS) || MEMBERS.length < 9) {
    alert("診断には9人以上の登録が必要です。js/members.jsを確認してください。");
    return;
  }

  choiceCounts = new Map(MEMBERS.map(member => [member.id, 0]));
  appearanceCounts = new Map(MEMBERS.map(member => [member.id, 0]));

  selectedMembers = [];
  duelIndex = 0;
  roundPlan = buildRoundPlan();

  duelFinishButton.disabled = true;
  resultMessage.textContent = "";

  showMode("duel");
  renderDuel();
}

startButton.addEventListener("click", startDuel);

// ==========================================
// 選択肢を抽選
// ★ 未登場者を最優先しつつ、選ばれた人の再登場率を底上げ
// ==========================================

function getRoundMembers(size) {
  const randomized = shuffle(MEMBERS);

  randomized.sort((a, b) => {
    const appA = appearanceCounts.get(a.id) || 0;
    const appB = appearanceCounts.get(b.id) || 0;

    // 1. 未登場（登場回数0）のメンバーを最優先して選出
    if (appA === 0 && appB !== 0) return -1;
    if (appA !== 0 && appB === 0) return 1;

    // 2. 全員が1回以上出た後は、選ばれた回数（勝ち数）が多いメンバーを優先しつつ
    //    登場回数が多すぎるメンバーは適度に調整
    const winA = choiceCounts.get(a.id) || 0;
    const winB = choiceCounts.get(b.id) || 0;

    const scoreA = winA * 3 - appA * 0.8;
    const scoreB = winB * 3 - appB * 0.8;

    return scoreB - scoreA;
  });

  return randomized.slice(0, Math.min(size, MEMBERS.length));
}

// ==========================================
// 診断画面を表示（進捗はパーセント表記）
// ==========================================

function renderDuel() {
  duelCards.replaceChildren();

  const total = roundPlan.length;
  const percent = total > 0 ? Math.floor((duelIndex / total) * 100) : 0;

  duelProgressText.textContent = `選択 ${percent}%`;
  duelProgressBar.style.width = `${percent}%`;

  if (duelIndex >= total) {
    duelCards.textContent = "すべての選択が完了しました！";
    duelMessage.textContent = "お疲れさま！「結果を見る」を押して、上位9人を確認しよう。";
    duelFinishButton.disabled = false;
    return;
  }

  duelFinishButton.disabled = true;

  const size = roundPlan[duelIndex];
  const label = size === 4 ? "四択" : size === 3 ? "三択" : "二択";

  duelMessage.textContent = `第${duelIndex + 1}回：${label} — 好きな人を1人選んでね。`;

  const roundMembers = getRoundMembers(size);

  roundMembers.forEach(member => {
    appearanceCounts.set(
      member.id,
      (appearanceCounts.get(member.id) || 0) + 1
    );

    const button = document.createElement("button");
    button.type = "button";
    button.className = "duel-card";

    button.appendChild(createImage(member));

    const name = document.createElement("strong");
    name.textContent = member.name;

    const group = document.createElement("small");
    group.textContent = member.group;

    button.append(name, group);

    button.addEventListener("click", () => {
      chooseDuelWinner(member);
    });

    duelCards.appendChild(button);
  });
}

// ==========================================
// 選択結果を記録
// ==========================================

function chooseDuelWinner(member) {
  if (duelIndex >= roundPlan.length) return;

  choiceCounts.set(
    member.id,
    (choiceCounts.get(member.id) || 0) + 1
  );

  duelIndex++;
  renderDuel();
}

// ==========================================
// 診断をやり直す
// ==========================================

$("#duel-restart-button").addEventListener("click", () => {
  if (
    duelIndex === 0 ||
    window.confirm("最初からやり直す？ 今までの選択結果はリセットされます。")
  ) {
    showMode("start");
  }
});

restartFromResultButton.addEventListener("click", () => {
  showMode("start");
});

// ==========================================
// 勝率と獲得ポイントを基準に正確なTOP9を選出
// ==========================================

function finishDuel() {
  if (
    !Array.isArray(MEMBERS) ||
    MEMBERS.length < 9 ||
    duelIndex < roundPlan.length
  ) {
    return;
  }

  const ranked = [...MEMBERS].sort((a, b) => {
    const winA = choiceCounts.get(a.id) || 0;
    const winB = choiceCounts.get(b.id) || 0;

    const appA = appearanceCounts.get(a.id) || 0;
    const appB = appearanceCounts.get(b.id) || 0;

    const winRateA = appA > 0 ? winA / appA : 0;
    const winRateB = appB > 0 ? winB / appB : 0;

    // 1. 勝率（選ばれた割合）が高い方を優先
    if (winRateA !== winRateB) {
      return winRateB - winRateA;
    }

    // 2. 勝率が同じなら直接選ばれた勝利数（獲得ポイント）が多い方を優先
    if (winA !== winB) {
      return winB - winA;
    }

    // 3. それでも同じなら登場回数が多い方を優先
    return appB - appA;
  });

  selectedMembers = ranked.slice(0, 9);
  showResult();
}

duelFinishButton.addEventListener("click", finishDuel);

// ==========================================
// 結果画面を表示
// ==========================================

function renderResult() {
  resultGrid.replaceChildren();

  selectedMembers.forEach((member, index) => {
    const card = document.createElement("article");
    card.className = "result-card";

    const photo = document.createElement("div");
    photo.className = "result-photo";
    photo.appendChild(createImage(member));

    const rank = document.createElement("span");
    rank.className = "result-rank";
    rank.textContent = `${index + 1}位`;
    photo.appendChild(rank);

    const name = document.createElement("div");
    name.className = "result-name";
    name.textContent = member.name;

    const group = document.createElement("div");
    group.className = "result-group";
    group.textContent = member.group;

    card.append(photo, name, group);
    resultGrid.appendChild(card);
  });
}

function showResult() {
  if (selectedMembers.length !== 9) return;

  renderResult();
  resultSubtitle.textContent = "ワートリ好き顔メーカー";

  showMode("result");
  scrollToCurrentSection();
}

function scrollToCurrentSection() {
  const target = currentMode === "result"
    ? resultSection
    : currentMode === "duel"
      ? duelMode
      : startSection;

  target.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// =
