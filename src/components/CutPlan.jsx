import { useState, useMemo } from 'react';
import { generateCutPlan } from '../cutPlan';

const COLORS = [
  '#d4a574', '#c8956a', '#e2b882', '#b87d5a',
  '#f0c896', '#a0725a', '#cc9966', '#e8d0a0',
  '#9a7055', '#d4b896', '#c07040', '#e8c07a',
];

const KERF_DISPLAY = 3; // のこぎりの刃幅(mm) — cutPlan.js の KERF と一致

const s = {
  container: { padding: '0' },
  caption: {
    fontSize: '13px',
    color: '#7a6e5e',
    marginBottom: '16px',
    background: '#faf8f4',
    border: '1px solid #e4dfd8',
    borderRadius: '8px',
    padding: '10px 14px',
    lineHeight: '1.6',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  settingLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#5a4e3e',
    whiteSpace: 'nowrap',
  },
  settingInput: {
    width: '90px',
  },
  separator: {
    color: '#a0947e',
    fontWeight: '700',
    fontSize: '16px',
  },
  boardGroup: {
    marginBottom: '28px',
  },
  boardTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#3a2e22',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  boardTitleBadge: {
    background: '#5b8dd9',
    color: '#fff',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
  },
  svgWrapper: {
    border: '1px solid #ddd9d0',
    borderRadius: '8px',
    background: '#fff',
    overflow: 'hidden',
  },
  legend: {
    marginTop: '12px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#5a4e3e',
  },
  legendColor: {
    width: '14px',
    height: '14px',
    borderRadius: '3px',
    border: '1px solid rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  empty: {
    textAlign: 'center',
    color: '#a0947e',
    padding: '40px',
    fontSize: '14px',
  },
  warnBox: {
    marginTop: '8px',
    marginBottom: '20px',
    background: '#fdf3f0',
    border: '1px solid #e0b0a0',
    borderRadius: '8px',
    padding: '12px 14px',
  },
  warnTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#b04a2a',
    marginBottom: '6px',
  },
  warnItem: {
    fontSize: '12px',
    color: '#7a4a3a',
    lineHeight: '1.7',
  },
};

function BoardSVG({ board, colorMap }) {
  const boardWidth = board.boardWidth;
  const boardHeight = board.boardHeight;
  const DISPLAY_W = 660;
  const scaleX = DISPLAY_W / boardWidth;
  const scaleY = scaleX; // 同スケール
  const DISPLAY_H = Math.round(boardHeight * scaleY);
  const PAD = 16;
  const FONT = 10;

  return (
    <div style={s.svgWrapper}>
      <svg
        width={DISPLAY_W + PAD * 2}
        height={DISPLAY_H + PAD * 2}
        viewBox={`0 0 ${DISPLAY_W + PAD * 2} ${DISPLAY_H + PAD * 2}`}
        style={{ display: 'block' }}
      >
        {/* 板の背景 */}
        <rect x={PAD} y={PAD} width={DISPLAY_W} height={DISPLAY_H} fill="#f5f0e8" stroke="#b0a090" strokeWidth="1.5" />

        {/* 配置パーツ */}
        {board.placed.map((r, i) => {
          const x = PAD + r.x * scaleX;
          const y = PAD + r.y * scaleY;
          const w = r.w * scaleX;
          const h = r.h * scaleY;
          const color = colorMap[r.id];
          const label = r.index > 1 ? `${r.label}(${r.index})` : r.label;
          const dimText = r.rotated ? `${r.w}×${r.h} ↻` : `${r.w}×${r.h}`;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={w} height={h}
                fill={color}
                stroke="#6a4a30"
                strokeWidth="1"
                opacity={0.88}
              />
              {w > 30 && h > 16 && (
                <>
                  <text
                    x={x + w / 2} y={y + h / 2 - 5}
                    textAnchor="middle"
                    fontSize={Math.min(FONT, w / (label.length * 0.65), h / 3)}
                    fill="#3a2010"
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    {label}
                  </text>
                  <text
                    x={x + w / 2} y={y + h / 2 + 8}
                    textAnchor="middle"
                    fontSize={Math.min(9, w / (dimText.length * 0.65), h / 4)}
                    fill="#6a4a30"
                    fontFamily="sans-serif"
                  >
                    {dimText}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* 板のサイズ表示 */}
        <text x={PAD + DISPLAY_W / 2} y={PAD - 4} textAnchor="middle" fontSize="11" fill="#8b7355" fontFamily="sans-serif">
          {boardWidth} mm
        </text>
        <text
          x={PAD - 4} y={PAD + DISPLAY_H / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#8b7355"
          fontFamily="sans-serif"
          transform={`rotate(-90, ${PAD - 4}, ${PAD + DISPLAY_H / 2})`}
        >
          {boardHeight} mm
        </text>
      </svg>
    </div>
  );
}

// 線材(角材)を定尺木材から切り出すプラン
function LumberSVG({ stick, colorMap }) {
  const DISPLAY_W = 660;
  const scale = DISPLAY_W / stick.stockLength;
  const BAR_H = 40;
  const PAD = 16;
  const FONT = 10;

  let cursor = 0; // mm
  const segments = stick.pieces.map((p, i) => {
    const x = cursor;
    cursor += p.length + (i < stick.pieces.length - 1 ? KERF_DISPLAY : 0);
    return { ...p, x };
  });
  const used = stick.pieces.reduce((s, p) => s + p.length, 0);
  const wastePct = Math.round((1 - used / stick.stockLength) * 100);

  return (
    <div style={s.svgWrapper}>
      <svg
        width={DISPLAY_W + PAD * 2}
        height={BAR_H + PAD * 2}
        viewBox={`0 0 ${DISPLAY_W + PAD * 2} ${BAR_H + PAD * 2}`}
        style={{ display: 'block' }}
      >
        {/* 木材(定尺)の背景 */}
        <rect x={PAD} y={PAD} width={DISPLAY_W} height={BAR_H} fill="#f5f0e8" stroke="#b0a090" strokeWidth="1.5" />

        {segments.map((p, i) => {
          const x = PAD + p.x * scale;
          const w = p.length * scale;
          const color = colorMap[p.id];
          const label = p.index > 1 ? `${p.label}(${p.index})` : p.label;
          return (
            <g key={i}>
              <rect x={x} y={PAD} width={w} height={BAR_H} fill={color} stroke="#6a4a30" strokeWidth="1" opacity={0.88} />
              {w > 28 && (
                <>
                  <text x={x + w / 2} y={PAD + BAR_H / 2 - 3} textAnchor="middle"
                    fontSize={Math.min(FONT, w / (label.length * 0.65))} fill="#3a2010" fontFamily="sans-serif" fontWeight="600">
                    {label}
                  </text>
                  <text x={x + w / 2} y={PAD + BAR_H / 2 + 10} textAnchor="middle"
                    fontSize={9} fill="#6a4a30" fontFamily="sans-serif">
                    {p.length}mm
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* 木材の長さ表示 */}
        <text x={PAD + DISPLAY_W / 2} y={PAD - 4} textAnchor="middle" fontSize="11" fill="#8b7355" fontFamily="sans-serif">
          長さ {stick.stockLength} mm（端材 約{wastePct}%）
        </text>
      </svg>
    </div>
  );
}

export default function CutPlan({ parts }) {
  const [boardWidth, setBoardWidth] = useState(1820);
  const [boardHeight, setBoardHeight] = useState(910);
  const [stockLength, setStockLength] = useState(2000);

  const boards = useMemo(
    () => parts.length > 0 ? generateCutPlan(parts, boardWidth, boardHeight, stockLength) : [],
    [parts, boardWidth, boardHeight, stockLength]
  );
  const lumber = boards.lumber || [];

  // パーツIDごとの色マッピング(板材・線材を統一)
  const colorMap = {};   // id -> 色文字列(SVG用)
  const legend = {};     // id -> { color, label }(凡例用)
  let colorIdx = 0;
  const assign = (id, label) => {
    if (!colorMap[id]) {
      const c = COLORS[colorIdx++ % COLORS.length];
      colorMap[id] = c;
      legend[id] = { color: c, label };
    }
  };
  boards.forEach(b => b.placed.forEach(r => assign(r.id, r.label)));
  lumber.forEach(st => st.pieces.forEach(p => assign(p.id, p.label)));

  if (parts.length === 0) {
    return (
      <div style={s.container}>
        <div style={s.caption}>
          🪚 パーツを登録すると、ここに板からの切り出し配置図が自動表示されます。
        </div>
        <div style={s.empty}>パーツがまだ登録されていません</div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.caption}>
        🪚 元の板（規格サイズ）からパーツをどう切り出すかを自動で計算・表示します。<br />
        板が複数枚必要な場合は「1枚目」「2枚目」と分けて表示します。のこぎりの刃幅 3mm を考慮しています。
      </div>

      <div style={s.settingRow}>
        <span style={s.settingLabel}>元の板のサイズ：</span>
        <input
          type="number"
          style={s.settingInput}
          value={boardWidth}
          min="300"
          max="4000"
          onChange={e => setBoardWidth(Number(e.target.value))}
        />
        <span style={s.separator}>×</span>
        <input
          type="number"
          style={s.settingInput}
          value={boardHeight}
          min="300"
          max="4000"
          onChange={e => setBoardHeight(Number(e.target.value))}
        />
        <span style={{ fontSize: '13px', color: '#8b7355' }}>mm（幅 × 高さ）</span>
      </div>

      {lumber.length > 0 && (
        <div style={s.settingRow}>
          <span style={s.settingLabel}>角材(線材)の定尺長さ：</span>
          <input
            type="number"
            style={s.settingInput}
            value={stockLength}
            min="300"
            max="6000"
            onChange={e => setStockLength(Number(e.target.value))}
          />
          <span style={{ fontSize: '13px', color: '#8b7355' }}>mm</span>
        </div>
      )}

      {/* 板材：厚さごとにグループ化して表示 */}
      {(() => {
        const byThickness = {};
        boards.forEach(b => {
          if (!byThickness[b.thickness]) byThickness[b.thickness] = [];
          byThickness[b.thickness].push(b);
        });

        return Object.entries(byThickness).sort((a, b) => Number(b[0]) - Number(a[0])).map(([thickness, bds]) => (
          <div key={thickness}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a4e3e', marginBottom: '12px', marginTop: '4px' }}>
              ▼ 板厚 {thickness}mm の板材（{bds.length} 枚必要）
            </div>
            {bds.map((board, i) => (
              <div key={i} style={s.boardGroup}>
                <div style={s.boardTitle}>
                  <span style={s.boardTitleBadge}>{i + 1} 枚目</span>
                  {board.custom && (
                    <span style={{ ...s.boardTitleBadge, background: '#c07040' }}>特注サイズ {board.boardWidth}×{board.boardHeight}mm</span>
                  )}
                  <span style={{ fontSize: '13px', color: '#6b5f50', fontWeight: '400' }}>
                    {board.placed.length} パーツ配置
                  </span>
                </div>
                <BoardSVG board={board} colorMap={colorMap} />
              </div>
            ))}
          </div>
        ));
      })()}

      {/* 角材(線材)：断面ごとにグループ化して表示 */}
      {lumber.length > 0 && (() => {
        const byCross = {};
        lumber.forEach(st => {
          if (!byCross[st.cross]) byCross[st.cross] = [];
          byCross[st.cross].push(st);
        });

        return (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#3a2e22', marginBottom: '4px', marginTop: '16px' }}>
              🪵 角材（線材）のカット
            </div>
            {Object.entries(byCross).map(([cross, sticks]) => (
              <div key={cross}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a4e3e', marginBottom: '12px', marginTop: '8px' }}>
                  ▼ 断面 {cross}mm の角材（{sticks.length} 本必要）
                </div>
                {sticks.map((stick, i) => (
                  <div key={i} style={s.boardGroup}>
                    <div style={s.boardTitle}>
                      <span style={{ ...s.boardTitleBadge, background: '#8b7355' }}>
                        {stick.custom ? '特注長さ' : `${i + 1} 本目`}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6b5f50', fontWeight: '400' }}>
                        {stick.pieces.length} 本切り出し
                      </span>
                    </div>
                    <LumberSVG stick={stick} colorMap={colorMap} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* 凡例 */}
      <div style={s.legend}>
        {Object.entries(legend).map(([id, { color, label }]) => (
          <div key={id} style={s.legendItem}>
            <div style={{ ...s.legendColor, background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
