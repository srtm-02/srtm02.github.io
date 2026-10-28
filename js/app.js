/* ==========================================
   ワートリ好き顔メーカー
   ========================================== */

const TOTAL_ROUNDS = 100;

const ROUND_COUNTS = [
  { size: 4, count: 34 },
  { size: 3, count: 33 },
  { size: 2, count: 33 }
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
// 選択肢を抽選（登場回数が少ないメンバーを優先）
// ==========================================

function getRoundMembers(size) {
  const randomized = shuffle(MEMBERS);

  randomized.sort((a, b) => {
    const countA = appearanceCounts.get(a.id) || 0;
    const countB = appearanceCounts.get(b.id) || 0;
    return countA - countB;
  });

  return randomized.slice(0, Math.min(size, MEMBERS.length));
}

// ==========================================
// 診断画面を表示
// ==========================================

function renderDuel() {
  duelCards.replaceChildren();

  const total = roundPlan.length;
  const percent = total > 0 ? (duelIndex / total) * 100 : 0;

  duelProgressText.textContent = `選択 ${duelIndex} / ${TOTAL_ROUNDS}`;
  duelProgressBar.style.width = `${percent}%`;

  if (duelIndex >= total) {
    duelCards.textContent = "100回の選択が完了しました！";
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
// ポイント上位9人を自動選出
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
    const countA = choiceCounts.get(a.id) || 0;
    const countB = choiceCounts.get(b.id) || 0;

    if (countA !== countB) {
      return countB - countA;
    }

    const appearancesA = appearanceCounts.get(a.id) || 0;
    const appearancesB = appearanceCounts.get(b.id) || 0;

    const rateA = countA / Math.max(1, appearancesA);
    const rateB = countB / Math.max(1, appearancesB);

    if (rateA !== rateB) {
      return rateB - rateA;
    }

    return appearancesB - appearancesA;
  });

  selectedMembers = ranked.slice(0, 9);
  showResult();
}

duelFinishButton.addEventListener("click", finishDuel);

// ==========================================
// 結果画面を表示（順位変更コントロールは削除）
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

// ==========================================
// 結果テキストをコピー
// ==========================================

function makeResultText() {
  const lines = [
    "ワートリ好き顔メーカー",
    "わたしの好き顔9選",
    ""
  ];

  selectedMembers.forEach((member, index) => {
    lines.push(`${index + 1}位：${member.name}（${member.group}）`);
  });

  return lines.join("\n");
}

copyButton.addEventListener("click", async () => {
  const text = makeResultText();

  try {
    await navigator.clipboard.writeText(text);
    resultMessage.textContent = "順位付きテキストをコピーしました！";
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand("copy");
    textarea.remove();

    resultMessage.textContent = success
      ? "順位付きテキストをコピーしました！"
      : "コピーできませんでした。ブラウザの権限を確認してね。";
  }
});

// ==========================================
// 結果画像を保存
// ==========================================

saveButton.addEventListener("click", async () => {
  const capture = $("#result-capture");

  if (typeof html2canvas !== "function") {
    resultMessage.textContent = "画像保存ライブラリを読み込めませんでした。";
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "作成中…";

  try {
    document.body.classList.add("is-capturing");

    const images = [...capture.querySelectorAll("img")];

    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })
    );

    const canvas = await html2canvas(capture, {
      backgroundColor: getComputedStyle(capture).backgroundColor || "#ffffff",
      scale: 2,
      useCORS: true
    });

    const link = document.createElement("a");
    link.download = "ワートリ好き顔メーカー.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    resultMessage.textContent = "画像を保存しました！";
  } catch (error) {
    console.error(error);
    resultMessage.textContent = "画像を保存できませんでした。画像の読み込みを確認してね。";
  } finally {
    document.body.classList.remove("is-capturing");
    saveButton.disabled = false;
    saveButton.textContent = "画像を保存";
  }
});

// 初期画面設定
showMode("start");
