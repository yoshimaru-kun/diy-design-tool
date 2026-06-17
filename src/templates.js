// テンプレートごとのパーツ自動生成ロジック
// 全寸法はmm単位

let partIdCounter = 1;
const newId = () => `part_${partIdCounter++}`;

// 本棚テンプレート
export function generateBookshelf({ width = 600, height = 1800, depth = 300, shelfCount = 3 }) {
  const t = 18;
  const innerWidth = width - t * 2;
  return [
    { id: newId(), name: '側板', partType: '板材', width: depth, height, depth: t, thickness: t, count: 2 },
    { id: newId(), name: '天板', partType: '板材', width: innerWidth, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '底板', partType: '板材', width: innerWidth, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '棚板', partType: '板材', width: innerWidth, height: depth, depth: t, thickness: t, count: shelfCount },
    { id: newId(), name: '背板', partType: '板材', width, height: height, depth: 4, thickness: 4, count: 1 },
  ];
}

// 収納ラックテンプレート
export function generateStorageRack({ width = 600, height = 1200, depth = 400, shelfCount = 2 }) {
  const t = 18;
  const innerWidth = width - t * 2;
  return [
    { id: newId(), name: '側板', partType: '板材', width: depth, height, depth: t, thickness: t, count: 2 },
    { id: newId(), name: '天板', partType: '板材', width: innerWidth, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '底板', partType: '板材', width: innerWidth, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '棚板', partType: '板材', width: innerWidth, height: depth, depth: t, thickness: t, count: shelfCount },
  ];
}

export function generateTable({ width = 1200, height = 720, depth = 600, legSize = 40, apronHeight = 80 }) {
  const t = 30;
  const lt = legSize;
  const innerWidth = width - lt * 2;
  const innerDepth = depth - lt * 2;
  return [
    { id: newId(), name: '天板', partType: '板材', width, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '脚', partType: '角材', width: lt, height: height - t, depth: lt, thickness: lt, count: 4 },
    { id: newId(), name: '幕板(長辺)', partType: '板材', width: innerWidth, height: apronHeight, depth: t, thickness: t, count: 2 },
    // 短辺幕板：脚の内面間いっぱい（端を脚に突き付ける）
    { id: newId(), name: '幕板(短辺)', partType: '板材', width: innerDepth, height: apronHeight, depth: t, thickness: t, count: 2 },
  ];
}

export function generateChair({ width = 400, height = 800, depth = 380, legSize = 35, seatThickness = 25, backHeight = 350 }) {
  const lt = legSize;
  const seatH = height - backHeight;        // 座面高さ
  const frontLegH = seatH - seatThickness;  // 前脚（座面下端まで）
  const apronH = 60, apronT = 20;           // 座面下の幕板（剛性確保）
  const seatDepth = depth - lt;             // 座面奥行（後端を背柱前面に合わせる）
  const backrestH = backHeight - 80;        // 背もたれ板の高さ
  return [
    // 前脚：座面を支える
    { id: newId(), name: '前脚', partType: '角材', width: lt, height: frontLegH, depth: lt, thickness: lt, count: 2 },
    // 背柱：床から背もたれ上端まで通し、背もたれを支持（強度の要）
    { id: newId(), name: '背柱', partType: '角材', width: lt, height, depth: lt, thickness: lt, count: 2 },
    // 座面
    { id: newId(), name: '座面', partType: '板材', width, height: seatDepth, depth: seatThickness, thickness: seatThickness, count: 1 },
    // 背もたれ：2本の背柱の間に固定
    { id: newId(), name: '背もたれ', partType: '板材', width: width - lt * 2, height: backrestH, depth: seatThickness, thickness: seatThickness, count: 1 },
    // 幕板（前後）：左右の脚をつなぐ。脚の内面間いっぱい（端を脚に突き付ける）
    { id: newId(), name: '幕板(前後)', partType: '板材', width: width - lt * 2, height: apronH, depth: apronT, thickness: apronT, count: 2 },
    // 幕板（横）：前脚と背柱をつなぐ
    { id: newId(), name: '幕板(横)', partType: '板材', width: depth - lt * 2, height: apronH, depth: apronT, thickness: apronT, count: 2 },
  ];
}

export function generateShelf({ width = 900, height = 250, depth = 200 }) {
  const t = 18;
  return [
    { id: newId(), name: '棚板', partType: '板材', width, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '側板', partType: '板材', width: depth, height, depth: t, thickness: t, count: 2 },
  ];
}

// ベンチテンプレート（屋外対応・耐久重視）
export function generateBench({ width = 1500, height = 420, depth = 380, legSize = 70 }) {
  const seatT = 38;   // 座面板厚（2×4/2×6材相当）
  const seatW = 120;  // 座面板幅
  const railT = 38;   // 幕板・貫の厚み
  const railH = 90;   // 幕板高さ（座面直下）
  const lowerRailH = 60; // 下貫高さ（床上100mm想定）
  const lt = legSize;
  const legH = height - seatT;
  const innerW = width - lt * 2;
  const innerD = depth - lt * 2;
  const seatCount = Math.max(2, Math.round(depth / seatW)); // 3枚程度

  return [
    // 座面：2×6材相当を複数枚並べて強度確保
    { id: newId(), name: '座面板', partType: '板材', width, height: seatW, depth: seatT, thickness: seatT, count: seatCount },
    // 脚：太角材で安定性確保
    { id: newId(), name: '脚', partType: '角材', width: lt, height: legH, depth: lt, thickness: lt, count: 4 },
    // 長手幕板：座面直下、ネジ留めで座面を支持
    { id: newId(), name: '長手幕板', partType: '板材', width: innerW, height: railH, depth: railT, thickness: railT, count: 2 },
    // 短手貫（上）：前後脚の内面間いっぱい（端を脚に突き付ける）
    { id: newId(), name: '短手貫(上)', partType: '板材', width: innerD, height: railH, depth: railT, thickness: railT, count: 2 },
    // 短手貫（下）：床上付近、転倒防止（脚間を直接つなぐ）
    { id: newId(), name: '短手貫(下)', partType: '板材', width: innerD, height: lowerRailH, depth: railT, thickness: railT, count: 2 },
    // 中間補強桟：左右の短手貫(下)の間をつなぐ（長手方向の中央通し貫）
    { id: newId(), name: '中間補強桟', partType: '板材', width: width - railT * 2, height: lowerRailH, depth: railT, thickness: railT, count: 1 },
  ];
}

// ウッドデッキテンプレート（耐久重視・根太＋大引き＋束柱構造）
// 構造材（根太・大引き・束柱）は幕板の内側に控え、床板が外周をオーバーハングする
export function generateWoodDeck({ width = 2400, depth = 1800, height = 300 }) {
  const boardT = 25;   // 床板厚
  const boardW = 90;   // 床板幅
  const boardGap = 5;  // 床板間隔（排水・乾燥用）
  const joistW = 45;   // 根太幅
  const joistH = 90;   // 根太高さ
  const beamSz = 90;   // 大引き断面
  const postSz = 90;   // 束柱断面
  const fasciaT = 25;  // 幕板厚
  const overhang = 50; // 床板が幕板より外へ出る量

  // 構造材の外形（幕板の内側に控える）
  const structW = width - (overhang + fasciaT) * 2;
  const structD = depth - (overhang + fasciaT) * 2;

  const boardCount = Math.floor(depth / (boardW + boardGap));
  const joistCount = Math.floor(structW / 400) + 1;   // 400mm間隔（たわみ防止）
  const beamCount = Math.floor(structD / 900) + 1;    // 900mm間隔（根太を支える）
  const postPerBeam = Math.floor(structW / 900) + 1;  // 大引き1本あたりの束柱数
  const postCount = beamCount * postPerBeam;
  // 束柱高さ＝仕上り高 −(床板＋根太＋大引き)
  const bundleH = Math.max(50, height - boardT - joistH - beamSz);

  return [
    // 床板：90mm幅・5mm隙間で排水性確保（X方向に伸び、外周までオーバーハング）
    { id: newId(), name: '床板', partType: '板材', width, height: boardW, depth: boardT, thickness: boardT, count: boardCount },
    // 根太：400mm間隔、床板のたわみを防止（Z方向に伸びる）
    { id: newId(), name: '根太', partType: '角材', width: joistW, height: structD, depth: joistH, thickness: joistW, count: joistCount },
    // 大引き：900mm間隔、根太全体を支える主桁（X方向に伸びる）
    { id: newId(), name: '大引き', partType: '角材', width: structW, height: beamSz, depth: beamSz, thickness: beamSz, count: beamCount },
    // 束柱：大引きを地面から支える垂直材（構造材の格子点に立つ）
    { id: newId(), name: '束柱', partType: '角材', width: postSz, height: bundleH, depth: postSz, thickness: postSz, count: postCount },
    // 幕板（長辺）：側面の見切り材（束柱の外側を覆う）
    { id: newId(), name: '幕板(長辺)', partType: '板材', width: width - overhang * 2, height: height - boardT, depth: fasciaT, thickness: fasciaT, count: 2 },
    // 幕板（短辺）：端面の見切り材（長辺幕板の間に納まる）
    { id: newId(), name: '幕板(短辺)', partType: '板材', width: depth - overhang * 2 - fasciaT * 2, height: height - boardT, depth: fasciaT, thickness: fasciaT, count: 2 },
  ];
}

export const TEMPLATES = [
  {
    id: 'bookshelf',
    label: '本棚',
    icon: '📚',
    description: '側板・天底板・棚板・背板で構成。棚板の枚数も調整できます。',
    defaultSize: { width: 600, height: 1800, depth: 300 },
    generate: generateBookshelf,
    layout: layoutBookshelf,
  },
  {
    id: 'storage',
    label: '収納ラック',
    icon: '🗄️',
    description: '間隔広めの棚板を持つ収納ラック。',
    defaultSize: { width: 600, height: 1200, depth: 400 },
    generate: generateStorageRack,
    layout: layoutStorageRack,
  },
  {
    id: 'table',
    label: 'テーブル',
    icon: '🍽️',
    description: '天板・4本脚・幕板で構成。',
    defaultSize: { width: 1200, height: 720, depth: 600 },
    generate: generateTable,
    layout: layoutTable,
  },
  {
    id: 'chair',
    label: '椅子',
    icon: '🪑',
    description: '前脚2本・背柱2本（床まで通して背もたれを支持）・座面・背もたれ・座面下の幕板で構成。剛性の高い設計。',
    defaultSize: { width: 400, height: 800, depth: 380 },
    generate: generateChair,
    layout: layoutChair,
  },
  {
    id: 'shelf',
    label: '棚(壁掛け)',
    icon: '🪵',
    description: 'シンプルな1段の壁掛け棚。',
    defaultSize: { width: 900, height: 250, depth: 200 },
    generate: generateShelf,
    layout: layoutShelf,
  },
  {
    id: 'bench',
    label: 'ベンチ',
    icon: '🪑',
    description: '座面板・太脚・上下2段の貫・中間補強桟で耐久性を確保したベンチ。',
    defaultSize: { width: 1500, height: 420, depth: 380 },
    generate: generateBench,
    layout: layoutBench,
  },
  {
    id: 'wooddeck',
    label: 'ウッドデッキ',
    icon: '🏡',
    description: '床板・根太・大引き・束柱の本格4層構造。耐久性の高いデッキ設計。',
    defaultSize: { width: 2400, depth: 1800, height: 300 },
    generate: generateWoodDeck,
    layout: layoutWoodDeck,
  },
  {
    id: 'tv-stand',
    label: 'テレビ台',
    icon: '📺',
    description: '天板・側板・底板・中段棚・背板・前幕板で構成。AVラック仕様。',
    defaultSize: { width: 1200, height: 450, depth: 400 },
    generate: generateTVStand,
    layout: layoutTVStand,
  },
  {
    id: 'hanger-rack',
    label: 'ハンガーラック',
    icon: '👔',
    description: '4本支柱の自立フレーム。天板の下に掛けしろを設けたハンガーパイプで衣類を掛け、上下に棚板。',
    defaultSize: { width: 900, height: 1600, depth: 500 },
    generate: generateHangerRack,
    layout: layoutHangerRack,
  },
  {
    id: 'sunoko-bed',
    label: 'すのこベッド',
    icon: '🛏️',
    description: 'ヘッドボード・フットボード・サイドレール・中央支持桟・中央脚・受け桟・すのこ板で構成。中央脚と受け桟で荷重を支える耐久設計。',
    defaultSize: { width: 1000, length: 2000, height: 300 },
    generate: generateSunokoBed,
    layout: layoutSunokoBed,
  },
  {
    id: 'workbench',
    label: '作業台（ワークベンチ）',
    icon: '🔧',
    description: '40mm厚天板・80mm角脚4本・幕板・下棚板で構成。頑丈な木工作業台。',
    defaultSize: { width: 1800, height: 900, depth: 700 },
    generate: generateWorkbench,
    layout: layoutWorkbench,
  },
];

// テレビ台
export function generateTVStand({ width = 1200, height = 450, depth = 400 }) {
  const t = 18, bw = 4;
  const iw = width - t * 2;
  return [
    { id: newId(), name: '天板',   partType: '板材', width, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '側板',   partType: '板材', width: depth, height, depth: t, thickness: t, count: 2 },
    { id: newId(), name: '底板',   partType: '板材', width: iw, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '中段棚', partType: '板材', width: iw, height: depth, depth: t, thickness: t, count: 1 },
    { id: newId(), name: '背板',   partType: '板材', width, height, depth: bw, thickness: bw, count: 1 },
    { id: newId(), name: '前幕板', partType: '板材', width: iw, height: 60, depth: t, thickness: t, count: 1 },
  ];
}

// ハンガーラック（自立する4本支柱のワードローブ型）
export function generateHangerRack({ width = 900, height = 1600, depth = 500 }) {
  const lt = 40, cs = 38, shelfT = 18;
  const innerW = width - lt * 2;  // 左右支柱の内面間
  const innerD = depth - lt * 2;  // 前後支柱の内面間
  return [
    // 支柱：四隅に立てて自立フレームを構成
    { id: newId(), name: '支柱',         partType: '角材', width: lt, height, depth: lt, thickness: lt, count: 4 },
    // 上長桟（前後）：左右の支柱をつなぐ（X方向）。天板を支持＋左右剛性
    { id: newId(), name: '上長桟(前後)', partType: '角材', width: innerW, height: cs, depth: cs, thickness: cs, count: 2 },
    // ハンガー受け桟（左右）：前後の支柱をつなぐ（Z方向）。天板より下げてパイプを受ける
    { id: newId(), name: 'ハンガー受け桟', partType: '角材', width: innerD, height: cs, depth: cs, thickness: cs, count: 2 },
    // ハンガーパイプ：受け桟の上に載せる（支圧接合）。ラック幅いっぱいで両端が受け桟を跨いでしっかり乗る
    { id: newId(), name: 'ハンガーパイプ', partType: '角材', width, height: cs, depth: cs, thickness: cs, count: 1 },
    // 下長桟（前後）：足元で左右支柱をつなぐ。下棚を支持＋転倒防止
    { id: newId(), name: '下長桟(前後)', partType: '角材', width: innerW, height: cs, depth: cs, thickness: cs, count: 2 },
    // 天板：上長桟の上に載せる（前後辺で支持）
    { id: newId(), name: '棚板(上)',      partType: '板材', width, height: depth, depth: shelfT, thickness: shelfT, count: 1 },
    // 下棚：下長桟の上に載せる。奥行きをラック奥行きいっぱいにして桟をしっかり跨ぐ
    { id: newId(), name: '棚板(下)',      partType: '板材', width: innerW, height: depth, depth: shelfT, thickness: shelfT, count: 1 },
  ];
}


// すのこベッド（耐久重視・中央脚＋受け桟で荷重を支える）
export function generateSunokoBed({ width = 1000, length = 2000, height = 300 }) {
  const t = 18;                  // ヘッド/フットボード板厚
  const railT = 38, railH = 140; // サイドレール 38×140（2×6材相当）
  const legSize = 60;            // 脚 60角
  const ledgerS = 30;            // すのこ受け桟 30角
  const slatT = 18, slatW = 90;  // すのこ板 18厚×90幅（12→18へ強化）
  const legH = height - railH;          // 脚の高さ（フレーム下端を床から持ち上げる）
  const centerBeamH = railH - slatT;    // 中央支持桟（上端をすのこ底に合わせる）
  const innerW = width - railT * 2;     // すのこ板の長さ
  const slatCount = Math.floor(length / (slatW + 25));
  const headH = height + 300;           // ヘッドボードは装飾を兼ねて高め
  return [
    { id: newId(), name: 'ヘッドボード',  partType: '板材', width, height: headH, depth: t, thickness: t, count: 1 },
    { id: newId(), name: 'フットボード',  partType: '板材', width, height, depth: t, thickness: t, count: 1 },
    { id: newId(), name: 'サイドレール',  partType: '板材', width: length, height: railH, depth: railT, thickness: railT, count: 2 },
    { id: newId(), name: '中央支持桟',    partType: '板材', width: length, height: centerBeamH, depth: railT, thickness: railT, count: 1 },
    { id: newId(), name: '脚',            partType: '角材', width: legSize, height: legH, depth: legSize, thickness: legSize, count: 3 },
    { id: newId(), name: 'すのこ受け桟',  partType: '角材', width: length, height: ledgerS, depth: ledgerS, thickness: ledgerS, count: 2 },
    { id: newId(), name: 'すのこ板',      partType: '板材', width: innerW, height: slatW, depth: slatT, thickness: slatT, count: slatCount },
  ];
}

// 作業台（ワークベンチ）
export function generateWorkbench({ width = 1800, height = 900, depth = 700 }) {
  const topT = 40, lt = 80, apronH = 120, apronT = 38, shelfT = 18;
  const legH = height - topT;
  const innerW = width - lt * 2;
  const innerD = depth - lt * 2;
  return [
    { id: newId(), name: '天板',         partType: '板材', width, height: depth, depth: topT, thickness: topT, count: 1 },
    { id: newId(), name: '脚',           partType: '角材', width: lt, height: legH, depth: lt, thickness: lt, count: 4 },
    { id: newId(), name: '幕板(長辺)',   partType: '板材', width: innerW, height: apronH, depth: apronT, thickness: apronT, count: 2 },
    // 短辺幕板：脚の内面間いっぱい（端を脚に突き付ける）
    { id: newId(), name: '幕板(短辺)',   partType: '板材', width: innerD, height: apronH, depth: apronT, thickness: apronT, count: 2 },
    // 下棚板：幅いっぱいで下棚横桟を跨いでしっかり乗る（前後は脚間に納まる）
    { id: newId(), name: '下棚板',       partType: '板材', width, height: innerD, depth: shelfT, thickness: shelfT, count: 1 },
    { id: newId(), name: '下棚横桟',     partType: '板材', width: innerD, height: apronH, depth: apronT, thickness: apronT, count: 2 },
    { id: newId(), name: '下棚中桟',     partType: '板材', width: width - apronT * 2, height: apronH, depth: apronT, thickness: apronT, count: 1 },
  ];
}

// ─── 完成図レイアウト ──────────────────────────────────────────
// 各テンプレートの3D配置を事前計算して返す
// 戻り値: { placed: [...], rotations: {...} }

let _lid = 10000;
const _pid = () => `placed_tmpl_${_lid++}`;
const SC = 0.01;
const R90 = Math.PI / 2;

function _lay(parts, items) {
  const placed = [];
  const rotations = {};
  items.forEach(({ pi, pos, rot }) => {
    const part = parts[pi];
    if (!part) return;
    const id = _pid();
    placed.push({ id, partId: part.id, name: part.name,
      size: [part.width * SC, part.height * SC, part.depth * SC], position: pos });
    if (rot) rotations[id] = rot;
  });
  return { placed, rotations };
}

export function layoutBookshelf(parts, { width = 600, height = 1800, depth = 300, shelfCount = 3 }) {
  const t = 18, iw = width - t * 2;
  const sp = (height - t * 2) / (shelfCount + 1);
  const items = [
    // 側板 ×2
    { pi: 0, pos: [-(width / 2 - t / 2) * SC, (height / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 0, pos: [ (width / 2 - t / 2) * SC, (height / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // 天板
    { pi: 1, pos: [0, (height - t / 2) * SC, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    // 底板
    { pi: 2, pos: [0, (t / 2) * SC, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    // 棚板
    ...Array.from({ length: shelfCount }, (_, i) => ({
      pi: 3, rot: { rx: R90, ry: 0, rz: 0 },
      pos: [0, (t + sp * (i + 1)) * SC, 0],
    })),
    // 背板
    { pi: 4, pos: [0, (height / 2) * SC, -(depth / 2 - 2) * SC] },
  ];
  return _lay(parts, items);
}

export function layoutStorageRack(parts, { width = 600, height = 1200, depth = 400, shelfCount = 2 }) {
  const t = 18;
  const sp = (height - t * 2) / (shelfCount + 1);
  return _lay(parts, [
    { pi: 0, pos: [-(width / 2 - t / 2) * SC, (height / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 0, pos: [ (width / 2 - t / 2) * SC, (height / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 1, pos: [0, (height - t / 2) * SC, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    { pi: 2, pos: [0, (t / 2) * SC, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    ...Array.from({ length: shelfCount }, (_, i) => ({
      pi: 3, rot: { rx: R90, ry: 0, rz: 0 },
      pos: [0, (t + sp * (i + 1)) * SC, 0],
    })),
  ]);
}

export function layoutTable(parts, { width = 1200, height = 720, depth = 600, legSize = 40, apronHeight = 80 }) {
  const t = 30, lt = legSize;
  const legH = height - t;
  const lx = (width / 2 - lt / 2) * SC;
  const lz = (depth / 2 - lt / 2) * SC;
  const topY = (legH + t / 2) * SC;
  const legCY = (legH / 2) * SC;
  const apY = (legH - apronHeight / 2) * SC;
  // 幕板は脚の外面に合わせる（端が脚の側面に突き付く）
  const apZ = (depth / 2 - t / 2) * SC;
  const apX = (width / 2 - t / 2) * SC;
  return _lay(parts, [
    { pi: 0, pos: [0, topY, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    { pi: 1, pos: [ lx, legCY,  lz] },
    { pi: 1, pos: [-lx, legCY,  lz] },
    { pi: 1, pos: [ lx, legCY, -lz] },
    { pi: 1, pos: [-lx, legCY, -lz] },
    { pi: 2, pos: [0, apY,  apZ] },
    { pi: 2, pos: [0, apY, -apZ] },
    { pi: 3, pos: [ apX, apY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 3, pos: [-apX, apY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
  ]);
}

export function layoutChair(parts, { width = 400, height = 800, depth = 380, legSize = 35, seatThickness = 25, backHeight = 350 }) {
  const lt = legSize;
  const seatH = height - backHeight;
  const frontLegH = seatH - seatThickness;
  const apronH = 60, apronT = 20;
  const backrestH = backHeight - 80;

  const legX = (width / 2 - lt / 2) * SC;
  const frontZ = (depth / 2 - lt / 2) * SC;     // 前脚
  const backZ = -(depth / 2 - lt / 2) * SC;     // 背柱
  const seatY = (seatH - seatThickness / 2) * SC;
  const seatZ = (lt / 2) * SC;                   // 座面中心（後端=背柱前面）
  const apronY = (seatH - seatThickness - apronH / 2) * SC;
  // 幕板は脚の外面に合わせる（端が脚の側面に突き付く）
  const frontApronZ = (depth / 2 - apronT / 2) * SC;
  const sideApronX = (width / 2 - apronT / 2) * SC;
  const backrestY = (seatH + backHeight / 2) * SC;

  return _lay(parts, [
    // 前脚 ×2
    { pi: 0, pos: [ legX, (frontLegH / 2) * SC, frontZ] },
    { pi: 0, pos: [-legX, (frontLegH / 2) * SC, frontZ] },
    // 背柱 ×2（床から背もたれ上端まで）
    { pi: 1, pos: [ legX, (height / 2) * SC, backZ] },
    { pi: 1, pos: [-legX, (height / 2) * SC, backZ] },
    // 座面
    { pi: 2, pos: [0, seatY, seatZ], rot: { rx: R90, ry: 0, rz: 0 } },
    // 背もたれ（背柱の間）
    { pi: 3, pos: [0, backrestY, backZ] },
    // 幕板（前後）
    { pi: 4, pos: [0, apronY,  frontApronZ] },
    { pi: 4, pos: [0, apronY, -frontApronZ] },
    // 幕板（横）
    { pi: 5, pos: [ sideApronX, apronY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 5, pos: [-sideApronX, apronY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
  ]);
}

export function layoutShelf(parts, { width = 900, height = 250, depth = 200 }) {
  const t = 18;
  return _lay(parts, [
    { pi: 0, pos: [0, (height - t / 2) * SC, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    { pi: 1, pos: [-(width / 2 - t / 2) * SC, (height / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 1, pos: [ (width / 2 - t / 2) * SC, (height / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
  ]);
}

export function layoutBench(parts, { width = 1500, height = 420, depth = 380, legSize = 70 }) {
  const seatT = 38, seatW = 120, railT = 38, railH = 90, lowerH = 60, lt = legSize;
  const legH = height - seatT;
  const seatCount = Math.max(2, Math.round(depth / seatW));
  const innerD = depth - lt * 2;
  const lx = (width / 2 - lt / 2) * SC;
  const lz = (depth / 2 - lt / 2) * SC;
  const seatY = (legH + seatT / 2) * SC;
  const apY = (legH - railH / 2) * SC;
  // 幕板・貫は脚の外面に合わせる（端が脚の側面に突き付く）
  const apZ = (depth / 2 - railT / 2) * SC;
  const railX = (width / 2 - railT / 2) * SC;
  const lowerY = (80 + lowerH / 2) * SC;
  const seatZs = Array.from({ length: seatCount }, (_, i) =>
    (-(seatCount - 1) / 2 * seatW + i * seatW) * SC
  );
  return _lay(parts, [
    // 座面板
    ...seatZs.map(z => ({ pi: 0, pos: [0, seatY, z], rot: { rx: R90, ry: 0, rz: 0 } })),
    // 脚
    { pi: 1, pos: [ lx, (legH / 2) * SC,  lz] },
    { pi: 1, pos: [-lx, (legH / 2) * SC,  lz] },
    { pi: 1, pos: [ lx, (legH / 2) * SC, -lz] },
    { pi: 1, pos: [-lx, (legH / 2) * SC, -lz] },
    // 長手幕板
    { pi: 2, pos: [0, apY,  apZ] },
    { pi: 2, pos: [0, apY, -apZ] },
    // 短手貫（上）
    { pi: 3, pos: [ railX, apY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 3, pos: [-railX, apY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // 短手貫（下）
    { pi: 4, pos: [ railX, lowerY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 4, pos: [-railX, lowerY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // 中間補強桟
    { pi: 5, pos: [0, lowerY, 0] },
  ]);
}

export function layoutTVStand(parts, { width = 1200, height = 450, depth = 400 }) {
  const t = 18, bw = 4;
  const sideX = (width / 2 - t / 2) * SC;
  const midY = (height / 2) * SC;
  const backZ = -(depth / 2 - bw / 2) * SC;
  return _lay(parts, [
    { pi: 0, pos: [0, (height - t / 2) * SC, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    { pi: 1, pos: [ sideX, midY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 1, pos: [-sideX, midY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 2, pos: [0, (t / 2) * SC, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    { pi: 3, pos: [0, midY, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    { pi: 4, pos: [0, midY, backZ] },
    { pi: 5, pos: [0, (t + 30) * SC, (depth / 2 - t / 2) * SC] },
  ]);
}

export function layoutHangerRack(parts, { width = 900, height = 1600, depth = 500 }) {
  const lt = 40, cs = 38, shelfT = 18;
  const postX = (width / 2 - lt / 2) * SC;
  const postZ = (depth / 2 - lt / 2) * SC;
  const topRailY = (height - cs / 2) * SC;        // 天枠（支柱天端に合わせる）
  const hangY = (height - 180) * SC;              // ハンガーパイプ（天板の下に掛けしろを確保）
  const botRailH = 150;                           // 下長桟の中心高さ
  const botRailY = botRailH * SC;
  const topShelfY = (height + shelfT / 2) * SC;    // 天板（上長桟の上）
  const botShelfY = (botRailH + cs / 2 + shelfT / 2) * SC; // 下棚（下長桟の上）
  return _lay(parts, [
    // 支柱 ×4（四隅）
    { pi: 0, pos: [ postX, (height / 2) * SC,  postZ] },
    { pi: 0, pos: [-postX, (height / 2) * SC,  postZ] },
    { pi: 0, pos: [ postX, (height / 2) * SC, -postZ] },
    { pi: 0, pos: [-postX, (height / 2) * SC, -postZ] },
    // 上長桟（前後）×2：X方向、左右支柱をつなぐ
    { pi: 1, pos: [0, topRailY,  postZ] },
    { pi: 1, pos: [0, topRailY, -postZ] },
    // ハンガー受け桟（左右）×2：Z方向、天板より下げて前後支柱をつなぐ
    { pi: 2, pos: [ postX, hangY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 2, pos: [-postX, hangY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // ハンガーパイプ：X方向、受け桟の上に載せる（荷重を支圧で受ける）
    { pi: 3, pos: [0, hangY + cs * SC, 0] },
    // 下長桟（前後）×2：X方向、足元
    { pi: 4, pos: [0, botRailY,  postZ] },
    { pi: 4, pos: [0, botRailY, -postZ] },
    // 棚板（上）
    { pi: 5, pos: [0, topShelfY, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    // 棚板（下）
    { pi: 6, pos: [0, botShelfY, 0], rot: { rx: R90, ry: 0, rz: 0 } },
  ]);
}


export function layoutSunokoBed(parts, { width = 1000, length = 2000, height = 300 }) {
  const t = 18, railT = 38, railH = 140, legSize = 60, ledgerS = 30, slatT = 18, slatW = 90;
  const legH = height - railH;
  const centerBeamH = railH - slatT;
  const slatCount = Math.floor(length / (slatW + 25));

  const railCenterY = (legH + railH / 2) * SC;        // サイドレール中心
  const beamCenterY = (legH + centerBeamH / 2) * SC;  // 中央支持桟中心（上端=すのこ底）
  const ledgerCenterY = (height - slatT - ledgerS / 2) * SC; // 受け桟中心（上端=すのこ底）
  const slatY = (height - slatT / 2) * SC;            // すのこ板中心
  const legCenterY = (legH / 2) * SC;

  const sideX = (width / 2 - railT / 2) * SC;          // サイドレールX
  const ledgerX = (width / 2 - railT - ledgerS / 2) * SC; // 受け桟X（レール内側）
  const headZ = -(length / 2 + t / 2) * SC;
  const footZ = (length / 2 + t / 2) * SC;

  // すのこ板を端から余白を取って均等配置
  const span = length - 120;
  const slatZs = slatCount <= 1
    ? [0]
    : Array.from({ length: slatCount }, (_, i) => (-span / 2 + span * (i / (slatCount - 1))) * SC);

  return _lay(parts, [
    // ヘッドボード（頭側・床まで届く端支持＋装飾）
    { pi: 0, pos: [0, ((height + 300) / 2) * SC, headZ] },
    // フットボード（足側・床まで届く端支持）
    { pi: 1, pos: [0, (height / 2) * SC, footZ] },
    // サイドレール ×2（長手・上端をフレーム天端に）
    { pi: 2, pos: [ sideX, railCenterY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 2, pos: [-sideX, railCenterY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // 中央支持桟（長手・中央でたわみ防止）
    { pi: 3, pos: [0, beamCenterY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // 脚 ×3（中央列・3本のレールを床へ）
    { pi: 4, pos: [ sideX, legCenterY, 0] },
    { pi: 4, pos: [0,      legCenterY, 0] },
    { pi: 4, pos: [-sideX, legCenterY, 0] },
    // すのこ受け桟 ×2（サイドレール内側、すのこを面で受ける）
    { pi: 5, pos: [ ledgerX, ledgerCenterY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 5, pos: [-ledgerX, ledgerCenterY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // すのこ板 ×N（受け桟＋中央支持桟の3点で支持）
    ...slatZs.map(z => ({ pi: 6, pos: [0, slatY, z], rot: { rx: R90, ry: 0, rz: 0 } })),
  ]);
}

export function layoutWorkbench(parts, { width = 1800, height = 900, depth = 700 }) {
  const topT = 40, lt = 80, apronH = 120, apronT = 38, shelfT = 18;
  const legH = height - topT;
  const lx = (width / 2 - lt / 2) * SC;
  const lz = (depth / 2 - lt / 2) * SC;
  const topY = (legH + topT / 2) * SC;
  const apronY = (legH - apronH / 2) * SC;
  // 幕板・下棚横桟は脚の外面に合わせる（端が脚の側面に突き付く）
  const apronZ = (depth / 2 - apronT / 2) * SC;
  const apronX = (width / 2 - apronT / 2) * SC;
  const shelfY = Math.round(height / 3) * SC;
  return _lay(parts, [
    { pi: 0, pos: [0, topY, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    { pi: 1, pos: [ lx, (legH / 2) * SC,  lz] },
    { pi: 1, pos: [-lx, (legH / 2) * SC,  lz] },
    { pi: 1, pos: [ lx, (legH / 2) * SC, -lz] },
    { pi: 1, pos: [-lx, (legH / 2) * SC, -lz] },
    { pi: 2, pos: [0, apronY,  apronZ] },
    { pi: 2, pos: [0, apronY, -apronZ] },
    { pi: 3, pos: [ apronX, apronY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 3, pos: [-apronX, apronY, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 4, pos: [0, shelfY, 0], rot: { rx: R90, ry: 0, rz: 0 } },
    // 下棚横桟は棚板の真下に納める（上端＝棚板の底面）
    { pi: 5, pos: [ apronX, shelfY - (shelfT / 2 + apronH / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    { pi: 5, pos: [-apronX, shelfY - (shelfT / 2 + apronH / 2) * SC, 0], rot: { rx: 0, ry: R90, rz: 0 } },
    // 下棚中桟：左右の下棚横桟をX方向で繋ぐ補強（Z=0中央）
    { pi: 6, pos: [0, shelfY - (shelfT / 2 + apronH / 2) * SC, 0] },
  ]);
}

export function layoutWoodDeck(parts, { width = 2400, depth = 1800, height = 300 }) {
  const boardT = 25, boardW = 90, boardGap = 5;
  const joistW = 45, joistH = 90, beamSz = 90, postSz = 90, fasciaT = 25;
  const overhang = 50;
  const structW = width - (overhang + fasciaT) * 2;
  const structD = depth - (overhang + fasciaT) * 2;
  const bundleH = Math.max(50, height - boardT - joistH - beamSz);
  const boardCount = Math.floor(depth / (boardW + boardGap));
  const joistCount = Math.floor(structW / 400) + 1;
  const beamCount = Math.floor(structD / 900) + 1;
  const postPerBeam = Math.floor(structW / 900) + 1;

  // Y層（下から：束柱→大引き→根太→床板）
  const postCY = (bundleH / 2) * SC;
  const beamCY = (bundleH + beamSz / 2) * SC;
  const joistCY = (bundleH + beamSz + joistH / 2) * SC;
  const boardCY = (bundleH + beamSz + joistH + boardT / 2) * SC;
  const fasciaCY = ((height - boardT) / 2) * SC;

  // 等間隔配置（外側は端から控える）。n=1なら中央。
  const spread = (half, n) =>
    n <= 1 ? [0] : Array.from({ length: n }, (_, i) => -half + (2 * half / (n - 1)) * i);

  const items = [];

  // 床板（X方向に伸び、Z方向に並ぶ。外周までオーバーハング）
  for (let i = 0; i < boardCount; i++) {
    const z = (-(depth / 2) + boardW / 2 + i * (boardW + boardGap)) * SC;
    items.push({ pi: 0, pos: [0, boardCY, z], rot: { rx: R90, ry: 0, rz: 0 } });
  }
  // 根太（Z方向に伸び、X方向に並ぶ。両端は構造外形内に控える）
  const joistXs = spread(structW / 2 - joistW / 2, joistCount);
  joistXs.forEach(x =>
    items.push({ pi: 1, pos: [x * SC, joistCY, 0], rot: { rx: R90, ry: 0, rz: 0 } })
  );
  // 大引き（X方向に伸び、Z方向に並ぶ。外側は外形面に合わせて控える）
  const beamZs = spread(structD / 2 - beamSz / 2, beamCount);
  beamZs.forEach(z =>
    items.push({ pi: 2, pos: [0, beamCY, z * SC] })
  );
  // 束柱（大引き直下の格子点。幕板の内側に収まる）
  const postXs = spread(structW / 2 - postSz / 2, postPerBeam);
  beamZs.forEach(z => postXs.forEach(x =>
    items.push({ pi: 3, pos: [x * SC, postCY, z * SC] })
  ));
  // 幕板（長辺：束柱の外側、Z=±に立つ。床板がこの外側へオーバーハング）
  const fasciaZ = (depth / 2 - overhang - fasciaT / 2) * SC;
  items.push({ pi: 4, pos: [0, fasciaCY,  fasciaZ] });
  items.push({ pi: 4, pos: [0, fasciaCY, -fasciaZ] });
  // 幕板（短辺：長辺幕板の間に納まる）
  const fasciaX = (width / 2 - overhang - fasciaT / 2) * SC;
  items.push({ pi: 5, pos: [ fasciaX, fasciaCY, 0], rot: { rx: 0, ry: R90, rz: 0 } });
  items.push({ pi: 5, pos: [-fasciaX, fasciaCY, 0], rot: { rx: 0, ry: R90, rz: 0 } });

  return _lay(parts, items);
}

// 新規パーツのデフォルト値
export function createDefaultPart() {
  return {
    id: newId(),
    name: '新しいパーツ',
    partType: '板材',
    width: 300,
    height: 300,
    depth: 18,
    thickness: 18,
    count: 1,
  };
}
