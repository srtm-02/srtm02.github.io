/* ==========================================
   ワートリ好き顔メーカー (高度確率配分＆階層別マッチング版)
   ========================================== */

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

// 直近の選択履歴（ポイント差の無さを判定するため）
let recentChoiceHistory = [];

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

function getRandomFromList(list, count = 1, excludeIds = new Set()) {
  const filtered = list.filter(m => !excludeIds.has(m.id));
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, count);
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
  recentChoiceHistory = [];
  roundPlan = buildRoundPlan();

  duelFinishButton.disabled = true;
  resultMessage.textContent = "";

  showMode("duel");
  renderDuel();
}

startButton.addEventListener("click", startDuel);

// ==========================================
// 現在のランキングリストを取得
// ==========================================

function getSortedMembers() {
  return [...MEMBERS].sort((a, b) => {
    const winA = choiceCounts.get(a.id) || 0;
    const winB = choiceCounts.get(b.id) || 0;
    const appA = appearanceCounts.get(a.id) || 0;
    const appB = appearanceCounts.get(b.id) || 0;

    const rateA = appA > 0 ? winA / appA : 0;
    const rateB = appB > 0 ? winB / appB : 0;

    if (rateA !== rateB) return rateB - rateA;
    if (winA !== winB) return winB - winA;
    return appB - appA;
  });
}

// ==========================================
// ポイント差がついているか判定（膠着状態チェック）
// ==========================================

function isPointStagnant() {
  // 過去10回で上位陣の入れ替わりやポイント変動が乏しいか
  if (recentChoiceHistory.length < 10) return false;
  const recentWinners = recentChoiceHistory.slice(-8);
  const uniqueWinners = new Set(recentWinners);
  
  // 直近8回で選ばれた人が1〜2種類に偏っている場合（差がつかなくなっている）
  return uniqueWinners.size <= 2;
}

// ==========================================
// 高度マッチメイキング・選択肢抽選
// ==========================================

function getRoundMembers(requestedSize) {
  const totalCount = MEMBERS.length;
  const unappeared = MEMBERS.filter(m => (appearanceCounts.get(m.id) || 0) === 0);

  // 1. 未登場が存在する場合の処理
  if (unappeared.length > 0) {
    if (unappeared.length >= requestedSize) {
      return getRandomFromList(unappeared, requestedSize);
    }
    // 未登場をすべて含めつつ、残りを1出場のメンバーで補う
    const selected = [...unappeared];
    const excludeSet = new Set(selected.map(m => m.id));
    const restNeeded = requestedSize - selected.length;
    const others = getRandomFromList(MEMBERS, restNeeded, excludeSet);
    return [...selected, ...others];
  }

  // 2. 一巡達成直後（ポイント差がまだ浅い初期段階）
  const totalAppearances = Array.from(appearanceCounts.values()).reduce((a, b) => a + b, 0);
  if (totalAppearances < totalCount * 2) {
    const chosenMembers = MEMBERS.filter(m => (choiceCounts.get(m.id) || 0) > 0);
    const unchosenMembers = MEMBERS.filter(m => (choiceCounts.get(m.id) || 0) === 0);

    const pickChosen = getRandomFromList(chosenMembers, 2);
    const excludeSet = new Set(pickChosen.map(m => m.id));
    const pickUnchosen = getRandomFromList(unchosenMembers, 2, excludeSet);

    const pool = [...pickChosen, ...pickUnchosen];
    if (pool.length < requestedSize) {
      const rest = getRandomFromList(MEMBERS, requestedSize - pool.length, new Set(pool.map(m => m.id)));
      return [...pool, ...rest];
    }
    return pool.slice(0, requestedSize);
  }

  // 3. ポイント差がついた後の動的マッチメイキング
  let size = requestedSize;

  // 差がつかなくなっている（膠着状態）なら上位選出のために4択・3択へ切り替え
  if (isPointStagnant()) {
    if (size === 2) size = 3;
    else if (size === 3) size = 4;
  }

  const sorted = getSortedMembers();

  // 各階層の定義
  const top9 = sorted.slice(0, 9);
  const highTier = sorted.slice(9, Math.min(49, totalCount));
  
  const midIndex = Math.floor(totalCount / 2);
  const midStart = Math.max(9, midIndex - 25);
  const midEnd = Math.min(totalCount - 1, midIndex + 25);
  const midTier = sorted.slice(midStart, midEnd);

  const lowStart = Math.max(9, totalCount - 40);
  const lowTier = sorted.slice(lowStart, totalCount);

  const excludeSet = new Set();
  const selected = [];

  // ① 上位9位までのキャラ1枠（ランダム）
  const p1 = getRandomFromList(top9, 1, excludeSet);
  if (p1.length > 0) { selected.push(p1[0]); excludeSet.add(p1[0].id); }

  if (size === 4) {
    // ② 高確率枠 (1枠)
    const p2 = getRandomFromList(highTier, 1, excludeSet);
    if (p2.length > 0) { selected.push(p2[0]); excludeSet.add(p2[0].id); }

    // ③ 中確率枠 (1枠)
    const p3 = getRandomFromList(midTier, 1, excludeSet);
    if (p3.length > 0) { selected.push(p3[0]); excludeSet.add(p3[0].id); }

    // ④ 低確率枠 (1枠)
    const p4 = getRandomFromList(lowTier, 1, excludeSet);
    if (p4.length > 0) { selected.push(p4[0]); excludeSet.add(p4[0].id); }

  } else if (size === 3) {
    // ② 高確率枠 (1枠)
    const p2 = getRandomFromList(highTier, 1, excludeSet);
    if (p2.length > 0) { selected.push(p2[0]); excludeSet.add(p2[0].id); }

    // ③ 中確率(3/5) : 低確率(2/5) 確率選出枠 (1枠)
    const rand = Math.random();
    const targetPool = rand < 0.6 ? midTier : lowTier;
    const p3 = getRandomFromList(targetPool, 1, excludeSet);
    if (p3.length > 0) { selected.push(p3[0]); excludeSet.add(p3[0].id); }

  } else if (size === 2) {
    // ② 高確率(5/10) : 中確率(3/10) : 低確率(2/10) 確率選出枠 (1枠)
    const rand = Math.random();
    let targetPool = highTier;
    if (rand >= 0.5 && rand < 0.8) targetPool = midTier;
    else if (rand >= 0.8) targetPool = lowTier;

    const p2 = getRandomFromList(targetPool, 1, excludeSet);
    if (p2.length > 0) { selected.push(p2[0]); excludeSet.add(p2[0].id); }
  }

  // 万が一足りない場合のフォールバック補填
  if (selected.length < size) {
    const fill = getRandomFromList(MEMBERS, size - selected.length, excludeSet);
    selected.push(...fill);
  }

  return selected.slice(0, size);
}

// ==========================================
// 診断画面を表示
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

  const baseSize = roundPlan[duelIndex];
  const roundMembers = getRoundMembers(baseSize);

  const actualSize = roundMembers.length;
  const label = actualSize === 4 ? "四択" : actualSize === 3 ? "三択" : "二択";

  duelMessage.textContent = `第${duelIndex + 1}回：${label} — 好きな人を1人選んでね。`;

  // 選択カード表示グリッドの調整
  if (actualSize > 2) {
    duelCards.style.gridTemplateColumns = "repeat(2, 1fr)";
  } else {
    duelCards.style.gridTemplateColumns = "1fr 1fr";
  }

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

  recentChoiceHistory.push(member.id);
  if (recentChoiceHistory.length > 20) recentChoiceHistory.shift();

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
// 勝利数・勝率を基準に上位9人を選出
// ==========================================

function finishDuel() {
  if (
    !Array.isArray(MEMBERS) ||
    MEMBERS.length < 9 ||
    duelIndex < roundPlan.length
  ) {
    return;
  }

  const sorted = getSortedMembers();
  selectedMembers = sorted.slice(0, 9);
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