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
  empty: {
    textAlign: 'center',
    color: '#a0947e',
    padding: '40px',
    fontSize: '14px',
  },
  group: {
    marginBottom: '20px',
  },
  groupTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#5a4e3e',
    background: '#f0ede8',
    borderRadius: '6px',
    padding: '6px 12px',
    marginBottom: '8px',
  },
  tableWrapper: {
    borderRadius: '8px',
    border: '1px solid #ddd9d0',
    overflow: 'hidden',
    background: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    background: '#f5f2ec',
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#5a4e3e',
    borderBottom: '1px solid #ddd9d0',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #f0ece5',
    color: '#3a2e22',
  },
  tdCount: {
    fontWeight: '700',
    color: '#3a6bb5',
    textAlign: 'right',
  },
  summary: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#fff8e8',
    border: '1px solid #e6d9a8',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#5a4e1e',
    lineHeight: '1.7',
  },
};

// パーツリストを (サイズ×厚さ) でまとめる
function aggregateParts(parts) {
  const map = {};
  for (const p of parts) {
    const key = `${p.width}x${p.height}x${p.thickness}`;
    if (!map[key]) {
      map[key] = { ...p, count: 0, names: [] };
    }
    map[key].count += p.count;
    if (!map[key].names.includes(p.name)) map[key].names.push(p.name);
  }
  return Object.values(map);
}

// 厚さでグループ化
function groupByThickness(parts) {
  const groups = {};
  for (const p of parts) {
    const t = p.thickness;
    if (!groups[t]) groups[t] = [];
    groups[t].push(p);
  }
  return groups;
}

export default function MaterialList({ parts }) {
  if (parts.length === 0) {
    return (
      <div style={s.container}>
        <div style={s.caption}>
          📋 パーツ編集タブでパーツを追加すると、必要な板材の一覧が自動で表示されます。
        </div>
        <div style={s.empty}>パーツがまだ登録されていません</div>
      </div>
    );
  }

  const aggregated = aggregateParts(parts);
  const groups = groupByThickness(aggregated);
  const totalCount = parts.reduce((s, p) => s + p.count, 0);

  return (
    <div style={s.container}>
      <div style={s.caption}>
        📋 同じサイズ・厚さのパーツはまとめて表示しています。<br />
        「厚さ」ごとに板材をまとめて購入するのが効率的です。
      </div>

      {Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0])).map(([thickness, items]) => (
        <div key={thickness} style={s.group}>
          <div style={s.groupTitle}>板厚 {thickness}mm の板材</div>
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>パーツ名</th>
                  <th style={s.th}>幅 (mm)</th>
                  <th style={s.th}>高さ (mm)</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>必要枚数</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={s.td}>{item.names.join(' / ')}</td>
                    <td style={s.td}>{item.width}</td>
                    <td style={s.td}>{item.height}</td>
                    <td style={{ ...s.td, ...s.tdCount }}>{item.count} 枚</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div style={s.summary}>
        合計 {totalCount} 枚のパーツが必要です。<br />
        ホームセンターでの購入時は、厚さ別にまとめて注文すると効率的です。
      </div>
    </div>
  );
}
