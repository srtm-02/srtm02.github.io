
/* ==========================================
   好き顔9選メーカー：メイン処理
   四択 → 三択 → 二択を合計100回
   ========================================== */

// ★ ここを変更すると出題回数を調整できる
const TOTAL_ROUNDS = 100;
const ROUND_COUNTS = [
  { size: 4, count: 34 },
  { size: 3, count: 33 },
  { size: 2, count: 33 }
];

// ★ 最終候補人数（9人を選ぶため最低9人必要）
const CANDIDATE_LIMIT = 9;

const $ = selector => document.querySelector(selector);

const listMode = $("#list-mode");
const duelMode = $("#duel-mode");
const candidateMode = $("#candidate-mode");
const resultSection = $("#result-section");

const memberList = $("#member-list");
const candidateList = $("#candidate-list");
const groupFilter = $("#group-filter");
const memberSearch = $("#member-search");

const selectionCount = $("#selection-count");
const listMessage = $("#list-message");
const candidateCount = $("#candidate-count");
const duelMessage = $("#duel-message");
const resultMessage = $("#result-message");

const duelCards = $("#duel-cards");
const duelProgressText = $("#duel-progress-text");
const duelProgressBar = $("#duel-progress-bar");

const resultGrid = $("#result-grid");
const resultSubtitle = $("#result-subtitle");
const listResultButton = $("#list-result-button");
const candidateResultButton = $("#candidate-result-button");
const duelFinishButton = $("#duel-finish-button");
const saveButton = $("#save-button");
const copyButton = $("#copy-button");

let currentMode = "list";
let resultSourceMode = "list";
let selectedMembers = [];

let candidateMembers = [];
let choiceCounts = new Map();
let appearanceCounts = new Map();
let roundPlan = [];
let duelQueue = [];
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

function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

// ==========================================
// モード切替
// ==========================================

function showMode(mode) {
  currentMode = mode;

  listMode.hidden = mode !== "list";
  duelMode.hidden = mode !== "duel";
  candidateMode.hidden = mode !== "candidate";
  resultSection.hidden = mode !== "result";

  document.querySelectorAll(".mode-button").forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

document.querySelectorAll(".mode-button").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.mode === "list") {
      showMode("list");
      renderMembers();
    } else {
      showMode("duel");
      if (duelQueue.length === 0) startDuel();
      else renderDuel();
    }
  });
});

// ==========================================
// グループ・名前検索
// ==========================================

function setupGroupFilter() {
  const groups = [
    ...new Set(MEMBERS.map(member => member.group))
  ].sort((a, b) => a.localeCompare(b, "ja"));

  groups.forEach(group => {
    if ([...groupFilter.options].some(option => option.value === group)) {
      return;
    }

    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    groupFilter.appendChild(option);
  });
}

function getVisibleMembers() {
  const group = groupFilter.value;
  const query = memberSearch.value.trim().toLowerCase();

  return MEMBERS.filter(member => {
    const matchesGroup =
      group === "all" || group === "" || member.group === group;

    const matchesName =
      member.name.toLowerCase().includes(query) ||
      member.group.toLowerCase().includes(query);

    return matchesGroup && matchesName;
  });
}

// ==========================================
// 一覧から9人を選ぶモード
// ==========================================

function createMemberCard(member, selectedList, onToggle) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "member-card";
  button.dataset.memberId = member.id;

  const index = selectedList.findIndex(item => item.id === member.id);
  const isSelected = index !== -1;

  button.classList.toggle("is-selected", isSelected);
  button.setAttribute("aria-pressed", String(isSelected));
  button.appendChild(createImage(member));

  const info = document.createElement("div");
  info.className = "member-info";

  const name = document.createElement("span");
  name.className = "member-name";
  name.textContent = member.name;

  const group = document.createElement("span");
  group.className = "member-group";
  group.textContent = member.group;

  info.append(name, group);
  button.appendChild(info);

  const rank = document.createElement("span");
  rank.className = "member-rank";
  rank.hidden = !isSelected;
  if (isSelected) rank.textContent = index + 1;
  button.appendChild(rank);

  button.addEventListener("click", () => onToggle(member));
  return button;
}

function renderMembers() {
  memberList.replaceChildren();

  getVisibleMembers().forEach(member => {
    memberList.appendChild(
      createMemberCard(member, selectedMembers, toggleListMember)
    );
  });

  selectionCount.textContent = `${selectedMembers.length} / 9人`;
  listResultButton.disabled = selectedMembers.length !== 9;
}

function toggleListMember(member) {
  const index = selectedMembers.findIndex(item => item.id === member.id);

  if (index >= 0) {
    selectedMembers.splice(index, 1);
    listMessage.textContent = `${member.name}を選択解除しました。`;
  } else {
    if (selectedMembers.length >= 9) {
      listMessage.textContent = "9人選択済みです。解除してから選んでね。";
      return;
    }

    selectedMembers.push(member);
    listMessage.textContent =
      `${selectedMembers.length}人目に${member.name}を選びました。`;
  }

  renderMembers();
}

$("#clear-button").addEventListener("click", () => {
  selectedMembers = [];
  renderMembers();
  listMessage.textContent = "選択をリセットしました。";
});

groupFilter.addEventListener("change", renderMembers);
memberSearch.addEventListener("input", renderMembers);

// ==========================================
// 四択 → 三択 → 二択の100回診断
// ==========================================

function buildRoundPlan() {
  const plan = [];

  ROUND_COUNTS.forEach(({ size, count }) => {
    for (let i = 0; i < count; i++) {
      plan.push(size);
    }
  });

  // 回数設定を変更しても、合計をTOTAL_ROUNDSに合わせる
  while (plan.length < TOTAL_ROUNDS) plan.push(2);

  return shuffle(plan.slice(0, TOTAL_ROUNDS));
}

function startDuel() {
  if (!Array.isArray(MEMBERS) || MEMBERS.length < 9) {
    duelMessage.textContent =
      "診断には最低9人の登録が必要です。members.jsを確認してね。";
    duelFinishButton.disabled = true;
    return;
  }

  choiceCounts = new Map(MEMBERS.map(member => [member.id, 0]));
  appearanceCounts = new Map(MEMBERS.map(member => [member.id, 0]));

  duelIndex = 0;
  roundPlan = buildRoundPlan();
  duelQueue = [...roundPlan];

  duelFinishButton.disabled = true;
  duelMessage.textContent =
    "表示された中から、いちばん好きな人を1人選んでね。";

  renderDuel();
}

function renderDuel() {
  duelCards.replaceChildren();

  const total = duelQueue.length;
  const percent = total ? (duelIndex / total) * 100 : 0;

  duelProgressText.textContent = `選択 ${duelIndex} / ${total}`;
  duelProgressBar.style.width = `${percent}%`;

  if (duelIndex >= total) {
    duelCards.textContent = "100回の選択が完了しました！";
    duelMessage.textContent =
      "「候補を確定」を押して、好き顔9選を作成しよう。";
    duelFinishButton.disabled = false;
    return;
  }

  duelFinishButton.disabled = true;

  const size = duelQueue[duelIndex];
  const label = size === 4 ? "四択" : size === 3 ? "三択" : "二択";

  duelMessage.textContent =
    `第${duelIndex + 1}回：${label} — 好きな人を1人選んでね。`;

  // 同じ回の中では同じ人を重複表示しない
  const roundMembers = shuffle(MEMBERS).slice(
    0,
    Math.min(size, MEMBERS.length)
  );

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
    button.addEventListener("click", () => chooseDuelWinner(member));

    duelCards.appendChild(button);
  });
}

function chooseDuelWinner(member) {
  choiceCounts.set(
    member.id,
    (choiceCounts.get(member.id) || 0) + 1
  );

  duelIndex++;
  renderDuel();
}

$("#duel-restart-button").addEventListener("click", () => {
  if (
    duelIndex === 0 ||
    duelIndex >= duelQueue.length ||
    window.confirm("最初からやり直す？ 今までの選択結果はリセットされます。")
  ) {
    startDuel();
  }
});

// ==========================================
// 診断結果から9人を候補にする
// ==========================================

function finishDuel() {
  if (MEMBERS.length < 9 || duelIndex < duelQueue.length) return;

  const ranked = [...MEMBERS].sort((a, b) => {
    const countA = choiceCounts.get(a.id) || 0;
    const countB = choiceCounts.get(b.id) || 0;

    if (countA !== countB) return countB - countA;

    // 同点の場合は、表示回数に対する選択率を比較
    const rateA = countA / Math.max(1, appearanceCounts.get(a.id) || 0);
    const rateB = countB / Math.max(1, appearanceCounts.get(b.id) || 0);

    if (rateA !== rateB) return rateB - rateA;

    return (appearanceCounts.get(b.id) || 0) -
      (appearanceCounts.get(a.id) || 0);
  });

  const limit = Math.min(
    MEMBERS.length,
    Math.max(9, CANDIDATE_LIMIT)
  );

  candidateMembers = ranked.slice(0, limit);
  selectedMembers = candidateMembers.slice(0, 9);

  renderCandidates();
  showMode("candidate");
}

duelFinishButton.addEventListener("click", finishDuel);

function renderCandidates() {
  candidateList.replaceChildren();

  candidateMembers.forEach(member => {
    candidateList.appendChild(
      createMemberCard(member, selectedMembers, toggleCandidate)
    );
  });

  candidateCount.textContent =
    `${selectedMembers.length} / 9人を選択中`;

  candidateResultButton.disabled = selectedMembers.length !== 9;
}

function toggleCandidate(member) {
  const index = selectedMembers.findIndex(item => item.id === member.id);

  if (index >= 0) {
    selectedMembers.splice(index, 1);
  } else {
    if (selectedMembers.length >= 9) {
      candidateCount.textContent =
        "9人選択済みです。別の人と入れ替えてね。";
      return;
    }

    selectedMembers.push(member);
  }

  renderCandidates();
}

$("#candidate-back-button").addEventListener("click", () => {
  showMode("duel");
  renderDuel();
});

// ==========================================
// 結果画面・順位調整
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

    const controls = document.createElement("div");
    controls.className = "rank-controls";

    const upButton = makeButton("↑", "rank-button", () => moveRank(index, -1));
    const downButton = makeButton("↓", "rank-button", () => moveRank(index, 1));

    upButton.disabled = index === 0;
    downButton.disabled = index === selectedMembers.length - 1;

    upButton.setAttribute("aria-label", `${member.name}を1つ上へ`);
    downButton.setAttribute("aria-label", `${member.name}を1つ下へ`);

    controls.append(upButton, downButton);
    card.append(photo, name, group, controls);
    resultGrid.appendChild(card);
  });
}

function moveRank(index, direction) {
  const target = index + direction;

  if (target < 0 || target >= selectedMembers.length) return;

  [selectedMembers[index], selectedMembers[target]] =
    [selectedMembers[target], selectedMembers[index]];

  renderResult();
}

function showResult() {
  if (selectedMembers.length !== 9) return;

  if (currentMode !== "result") resultSourceMode = currentMode;

  renderResult();
  resultSubtitle.textContent = "My favorite faces";
  showMode("result");

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

listResultButton.addEventListener("click", showResult);
candidateResultButton.addEventListener("click", showResult);

$("#edit-result-button").addEventListener("click", () => {
  if (resultSourceMode === "candidate" && candidateMembers.length > 0) {
    renderCandidates();
    showMode("candidate");
  } else {
    showMode("list");
    renderMembers();
  }
});

// ==========================================
// 順位付きテキストをコピー
// ==========================================

function makeResultText() {
  const lines = ["わたしの好き顔9選", ""];

  selectedMembers.forEach((member, index) => {
    lines.push(`${index + 1}位：${member.name}（${member.group}）`);
  });

  return lines.join("\n");
}

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(makeResultText());
    resultMessage.textContent = "順位付きテキストをコピーしました！";
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = makeResultText();
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
    resultMessage.textContent =
      "画像保存ライブラリを読み込めませんでした。";
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "作成中…";

  try {
    document.body.classList.add("is-capturing");

    const canvas = await html2canvas(capture, {
      backgroundColor: getComputedStyle(capture).backgroundColor,
      scale: 2,
      useCORS: true
    });

    const link = document.createElement("a");
    link.download = "my-favorite-faces-9.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    resultMessage.textContent = "画像を保存しました！";
  } catch (error) {
    console.error(error);
    resultMessage.textContent =
      "画像を保存できませんでした。画像の読み込みを確認してね。";
  } finally {
    document.body.classList.remove("is-capturing");
    saveButton.disabled = false;
    saveButton.textContent = "画像を保存";
  }
});

// ==========================================
// 初期化
// ==========================================

setupGroupFilter();
renderMembers();
showMode("list");
