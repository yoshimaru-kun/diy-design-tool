// 切り出し配置図(カットプラン)のアルゴリズム
// グリーディ矩形パッキング: 大きいパーツから順に配置

const KERF = 3; // のこぎりの刃幅(mm)

// 1枚の板に対するパッキング
function packIntoBoard(boardW, boardH, rects) {
  // 空きスペースをリストで管理
  let spaces = [{ x: 0, y: 0, w: boardW, h: boardH }];
  const placed = [];
  const unplaced = [];

  for (const rect of rects) {
    let best = null;
    let bestIdx = -1;
    let bestRot = false; // 採用した向きで回転したか

    for (let i = 0; i < spaces.length; i++) {
      const sp = spaces[i];
      // 通常向きと90度回転の両方を試す
      const orientations = [
        { w: rect.w + KERF, h: rect.h + KERF, rot: false },
        { w: rect.h + KERF, h: rect.w + KERF, rot: true },
      ];
      for (const o of orientations) {
        if (sp.w >= o.w && sp.h >= o.h) {
          // より左上のスペースを優先
          if (best === null || sp.y < best.y || (sp.y === best.y && sp.x < best.x)) {
            best = sp;
            bestIdx = i;
            bestRot = o.rot;
          }
        }
      }
    }

    if (best !== null) {
      const rw = (bestRot ? rect.h : rect.w) + KERF;
      const rh = (bestRot ? rect.w : rect.h) + KERF;
      placed.push({
        ...rect,
        x: best.x,
        y: best.y,
        w: bestRot ? rect.h : rect.w,
        h: bestRot ? rect.w : rect.h,
        rotated: bestRot,
      });
      // スペースを分割(Guillotine分割)
      spaces.splice(bestIdx, 1);
      // 右側の残りスペース
      if (best.w - rw > 10) {
        spaces.push({ x: best.x + rw, y: best.y, w: best.w - rw, h: rh });
      }
      // 下側の残りスペース
      if (best.h - rh > 10) {
        spaces.push({ x: best.x, y: best.y + rh, w: best.w, h: best.h - rh });
      }
    } else {
      unplaced.push(rect);
    }
  }

  return { placed, unplaced };
}

// 線材(角材)を定尺の木材から1次元で切り出す計画
// 戻り値: スティック配列 [{ cross, crossA, crossB, stockLength, num, custom, pieces:[...] }]
function generateLumberPlan(lumberParts, stockLength = 2000) {
  // 各ピースを展開: 最長辺=length、残り2辺=断面
  const pieces = [];
  for (const part of lumberParts) {
    const dims = [part.width, part.height, part.depth].sort((a, b) => b - a);
    const length = dims[0];
    const crossA = dims[1];
    const crossB = dims[2];
    const cross = `${crossA}×${crossB}`;
    for (let i = 0; i < part.count; i++) {
      pieces.push({ id: part.id, label: part.name, length, cross, crossA, crossB, index: i + 1 });
    }
  }

  // 断面サイズごとにグループ化
  const byCross = {};
  for (const p of pieces) {
    if (!byCross[p.cross]) byCross[p.cross] = [];
    byCross[p.cross].push(p);
  }

  const sticks = [];
  for (const [cross, group] of Object.entries(byCross)) {
    const crossA = group[0].crossA;
    const crossB = group[0].crossB;

    // 定尺より長い部材は特注の長さの木材を割り当てる
    const oversizedLen = group.filter(p => p.length > stockLength);
    const fitting = group
      .filter(p => p.length <= stockLength)
      .sort((a, b) => b.length - a.length);

    // 1次元ビンパッキング(First Fit Decreasing)
    const bins = []; // { used, pieces }
    for (const p of fitting) {
      let placed = false;
      for (const bin of bins) {
        const add = p.length + (bin.pieces.length ? KERF : 0);
        if (bin.used + add <= stockLength) {
          bin.used += add;
          bin.pieces.push(p);
          placed = true;
          break;
        }
      }
      if (!placed) bins.push({ used: p.length, pieces: [p] });
    }
    bins.forEach((bin, i) => {
      sticks.push({ cross, crossA, crossB, stockLength, num: i + 1, custom: false, pieces: bin.pieces });
    });

    // 特注の長さの木材(部材1本につき1本)
    oversizedLen.forEach((p) => {
      sticks.push({ cross, crossA, crossB, stockLength: p.length, num: '特注', custom: true, pieces: [p] });
    });
  }

  return sticks;
}

// パーツリストからカットプランを生成
export function generateCutPlan(parts, boardWidth = 1820, boardHeight = 910, stockLength = 2000) {
  // 板材系(板材/カスタム)と線材(角材)に分離
  const boardParts = parts.filter(p => p.partType !== '角材');
  const lumberParts = parts.filter(p => p.partType === '角材');

  // パーツを個数分展開し、大きいものから並べる
  const rects = [];
  for (const part of boardParts) {
    for (let i = 0; i < part.count; i++) {
      rects.push({
        id: part.id,
        label: part.name,
        // カットプランでは「幅×奥行き」を使用(厚さは別管理)
        w: part.width,
        h: part.height,
        thickness: part.thickness,
        index: i + 1,
      });
    }
  }

  // 厚さごとにグループ化
  const byThickness = {};
  for (const r of rects) {
    const key = r.thickness;
    if (!byThickness[key]) byThickness[key] = [];
    byThickness[key].push(r);
  }

  const allBoards = [];

  // 部材が板に収まるか(回転も考慮)を判定
  const fitsInBoard = (r) => {
    const rw = r.w + KERF;
    const rh = r.h + KERF;
    return (rw <= boardWidth && rh <= boardHeight) ||
           (rh <= boardWidth && rw <= boardHeight);
  };

  for (const [thickness, group] of Object.entries(byThickness)) {
    // 規格板に収まらない部材は分離し、専用サイズの板を用意する
    const fitting = [];
    const oversized = [];
    for (const r of group) {
      if (fitsInBoard(r)) fitting.push(r);
      else oversized.push(r);
    }

    // 面積の大きい順にソート
    const sorted = fitting.sort((a, b) => b.w * b.h - a.w * a.h);
    let remaining = sorted;
    let boardNum = 1;

    while (remaining.length > 0) {
      const { placed, unplaced } = packIntoBoard(boardWidth, boardHeight, remaining);
      allBoards.push({
        boardNum,
        thickness: Number(thickness),
        boardWidth,
        boardHeight,
        placed,
        custom: false,
      });
      boardNum++;
      remaining = unplaced;
    }

    // サイズオーバー部材: その部材にぴったり合った専用サイズの板を1部材ずつ用意
    oversized
      .sort((a, b) => b.w * b.h - a.w * a.h)
      .forEach((r) => {
        const cw = Math.max(r.w, r.h);
        const ch = Math.min(r.w, r.h);
        allBoards.push({
          boardNum: boardNum++,
          thickness: Number(thickness),
          boardWidth: cw,
          boardHeight: ch,
          // 板に合わせて横向きで配置
          placed: [{ ...r, x: 0, y: 0, w: cw, h: ch, rotated: r.h > r.w }],
          custom: true,
        });
      });
  }

  const lumber = generateLumberPlan(lumberParts, stockLength);

  allBoards.lumber = lumber;
  return allBoards;
}
