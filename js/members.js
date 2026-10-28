// ==========================================
// メンバー登録データ
// ★ 人物を追加・変更するときは、このファイルだけ編集
// ==========================================

const MEMBERS = [
  {
    id: "person-001",
    name: "城戸 正宗",
    group: "本部上層部",
    image: "images/person-001.jpg"
  },
  {
    id: "person-002",
    name: "鬼怒田 本吉",
    group: "本部上層部",
    image: "images/person-002.jpg"
  },
  {
    id: "person-003",
    name: "唐沢 克己",
    group: "本部上層部",
    image: "images/person-003.jpg"
  },
  {
    id: "person-004",
    name: "根付 栄蔵",
    group: "本部上層部",
    image: "images/person-004.jpg"
  },
  {
    id: "person-005",
    name: "忍田 真史",
    group: "本部上層部",
    image: "images/person-005.jpg"
  },
  {
    id: "person-006",
    name: "沢村 響子",
    group: "本部上層部",
    image: "images/person-006.jpg"
  },
  {
    id: "person-007",
    name: "林藤 匠",
    group: "本部上層部",
    image: "images/person-007.jpg"
  },
  {
    id: "person-008",
    name: "寺島 雷蔵",
    group: "エンジニア",
    image: "images/person-008.jpg"
  },
  {
    id: "person-009",
    name: "ミカエル・クローニン",
    group: "エンジニア",
    image: "images/person-009.jpg"
  },
  {
    id: "person-010",
    name: "桐山 諒治",
    group: "エンジニア",
    image: "images/person-010.jpg"
  },
  {
    id: "person-011",
    name: "迅 悠一",
    group: "玉狛支部",
    image: "images/person-011.jpg"
  },
  {
    id: "person-012",
    name: "木崎 レイジ",
    group: "玉狛第1",
    image: "images/person-012.jpg"
  },
  {
    id: "person-013",
    name: "小南 桐絵",
    group: "玉狛第1",
    image: "images/person-013.jpg"
  },
  {
    id: "person-014",
    name: "烏丸 京介",
    group: "玉狛第1",
    image: "images/person-014.jpg"
  },
  {
    id: "person-015",
    name: "林藤 ゆり",
    group: "玉狛第1",
    image: "images/person-015.jpg"
  },
  {
    id: "person-016",
    name: "三雲 修",
    group: "玉狛第2（三雲隊）",
    image: "images/person-016.jpg"
  },
  {
    id: "person-017",
    name: "空閑 遊真",
    group: "玉狛第2（三雲隊）",
    image: "images/person-017.jpg"
  },
  {
    id: "person-018",
    name: "雨取 千佳",
    group: "玉狛第2（三雲隊）",
    image: "images/person-018.jpg"
  },
  {
    id: "person-019",
    name: "ヒュース・クローニン",
    group: "玉狛第2（三雲隊）",
    image: "images/person-019.jpg"
  },
  {
    id: "person-020",
    name: "宇佐美 栞",
    group: "玉狛第2（三雲隊）",
    image: "images/person-020.jpg"
  },
  {
    id: "person-021",
    name: "天羽 月彦",
    group: "本部",
    image: "images/person-021.jpg"
  },
  {
    id: "person-022",
    name: "太刀川 慶",
    group: "太刀川隊",
    image: "images/person-022.jpg"
  },
  {
    id: "person-023",
    name: "出水 公平",
    group: "太刀川隊",
    image: "images/person-023.jpg"
  },
  {
    id: "person-024",
    name: "唯我 尊",
    group: "太刀川隊",
    image: "images/person-024.jpg"
  },
  {
    id: "person-025",
    name: "国近柚宇",
    group: "太刀川隊",
    image: "images/person-025.jpg"
  },
  {
    id: "person-026",
    name: "冬島 慎次",
    group: "冬島隊",
    image: "images/person-026.jpg"
  },
  {
    id: "person-027",
    name: "当真 勇",
    group: "冬島隊",
    image: "images/person-027.jpg"
  },
  {
    id: "person-028",
    name: "真木 理佐",
    group: "冬島隊",
    image: "images/person-028.jpg"
  },
  {
    id: "person-029",
    name: "風間 蒼也",
    group: "風間隊",
    image: "images/person-029.jpg"
  },
  {
    id: "person-030",
    name: "歌川 遼",
    group: "風間隊",
    image: "images/person-030.jpg"
  },
  {
    id: "person-031",
    name: "菊地原 士郎",
    group: "風間隊",
    image: "images/person-031.jpg"
  },
  {
    id: "person-032",
    name: "三上 歌歩",
    group: "風間隊",
    image: "images/person-032.jpg"
  },
  {
    id: "person-033",
    name: "草壁 早紀",
    group: "草壁隊",
    image: "images/person-033.jpg"
  },
  {
    id: "person-034",
    name: "佐伯 竜司",
    group: "草壁隊",
    image: "images/person-034.jpg"
  },
  {
    id: "person-035",
    name: "里見 一馬",
    group: "草壁隊",
    image: "images/person-035.jpg"
  },
  {
    id: "person-036",
    name: "宇野 隼人",
    group: "草壁隊",
    image: "images/person-036.jpg"
  },
  {
    id: "person-037",
    name: "緑川 駿",
    group: "草壁隊",
    image: "images/person-037.jpg"
  },
  {
    id: "person-038",
    name: "嵐山 准",
    group: "嵐山隊",
    image: "images/person-038.jpg"
  },
  {
    id: "person-039",
    name: "木虎 藍",
    group: "嵐山隊",
    image: "images/person-039.jpg"
  },
  {
    id: "person-040",
    name: "時枝 充",
    group: "嵐山隊",
    image: "images/person-040.jpg"
  },
  {
    id: "person-041",
    name: "佐鳥 賢",
    group: "嵐山隊",
    image: "images/person-041.jpg"
  },
  {
    id: "person-042",
    name: "綾辻 遥",
    group: "嵐山隊",
    image: "images/person-042.jpg"
  }
];