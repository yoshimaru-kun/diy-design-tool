import { useState } from 'react';
import { LUMBER_DATA } from '../lumberData';

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: '#fff',
    borderRadius: '14px',
    width: '560px',
    maxWidth: '95vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
    overflow: 'hidden',
  },
  header: {
    padding: '18px 20px 0',
    borderBottom: '1px solid #e4dfd8',
    flexShrink: 0,
  },
  title: {
    fontSize: '16px', fontWeight: '700', color: '#3a2e22', marginBottom: '14px',
  },
  tabs: {
    display: 'flex', gap: '4px',
  },
  tab: {
    padding: '7px 14px', fontSize: '13px', fontWeight: '600',
    color: '#8b7355', background: 'transparent',
    borderRadius: '7px 7px 0 0',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#5b8dd9',
    borderBottom: '2px solid #5b8dd9',
    background: '#f5f8ff',
  },
  body: {
    overflowY: 'auto',
    padding: '16px 20px',
    flex: 1,
  },
  note: {
    fontSize: '12px', color: '#8b7355',
    background: '#faf8f4', border: '1px solid #e4dfd8',
    borderRadius: '6px', padding: '7px 12px', marginBottom: '14px',
  },
  // ツーバイ材テーブル
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '13px',
  },
  th: {
    background: '#f5f2ec', padding: '7px 10px',
    textAlign: 'left', fontWeight: '600', color: '#5a4e3e',
    borderBottom: '1px solid #ddd9d0',
  },
  tr: { cursor: 'pointer' },
  td: {
    padding: '9px 10px', borderBottom: '1px solid #f0ece5', color: '#3a2e22',
  },
  tdSmall: {
    padding: '9px 10px', borderBottom: '1px solid #f0ece5',
    color: '#6b5f50', fontSize: '12px',
  },
  trHover: { background: '#f0f6ff' },
  // 板材グリッド
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
  },
  card: {
    border: '1px solid #ddd9d0', borderRadius: '8px',
    padding: '12px 14px', cursor: 'pointer',
    transition: 'border-color 0.12s, background 0.12s',
  },
  cardName: { fontSize: '13px', fontWeight: '700', color: '#3a2e22', marginBottom: '8px' },
  cardRow: { fontSize: '12px', color: '#6b5f50', marginBottom: '4px' },
  // 厚さ・長さボタン
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' },
  chip: {
    padding: '3px 9px', borderRadius: '12px',
    fontSize: '11px', fontWeight: '600',
    background: '#f0ede8', color: '#5a4e3e',
    cursor: 'pointer', border: '1px solid #d0ccc8',
  },
  chipSelected: {
    background: '#5b8dd9', color: '#fff', border: '1px solid #5b8dd9',
  },
  footer: {
    padding: '14px 20px',
    borderTop: '1px solid #e4dfd8',
    display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0,
  },
  btnCancel: { background: '#f0ede8', color: '#5a4e3e', padding: '9px 20px' },
  btnOk: { background: '#5b8dd9', color: '#fff', fontWeight: '700', padding: '9px 24px' },
};

// ツーバイ材・杉材の行
function DimensionalRow({ item, selected, onSelect }) {
  const [hovering, setHovering] = useState(false);
  return (
    <tr
      style={{ ...s.tr, ...(hovering || selected ? s.trHover : {}) }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => onSelect(item)}
    >
      <td style={s.td}>
        <input type="radio" readOnly checked={selected} style={{ marginRight: 6 }} />
        {item.name}
      </td>
      <td style={s.td}>{item.thickness} × {item.width}</td>
      <td style={s.tdSmall}>{item.lengths.join(' / ')}</td>
    </tr>
  );
}

// 板材カード
function PanelCard({ item, selectedThickness, onSelect }) {
  const [hovering, setHovering] = useState(false);
  const isActive = selectedThickness?.name === item.name;
  return (
    <div
      style={{
        ...s.card,
        ...(hovering || isActive ? { borderColor: '#5b8dd9', background: '#f5f8ff' } : {}),
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={s.cardName}>{item.name}</div>
      <div style={s.cardRow}>サイズ: {item.sizes.map(([w, h]) => `${w}×${h}`).join(' / ')} mm</div>
      <div style={s.cardRow}>厚さを選択:</div>
      <div style={s.chipRow}>
        {item.thicknesses.map(t => {
          const sel = isActive && selectedThickness?.thickness === t;
          return (
            <button
              key={t}
              style={{ ...s.chip, ...(sel ? s.chipSelected : {}) }}
              onClick={() => onSelect({ name: item.name, thickness: t, boardSize: item.sizes[0] })}
            >
              {t}mm
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LumberPicker({ onConfirm, onClose }) {
  const [activeCat, setActiveCat] = useState('twoby');
  const [selectedItem, setSelectedItem] = useState(null);   // ツーバイ/杉
  const [selectedPanel, setSelectedPanel] = useState(null); // 板材

  const cat = LUMBER_DATA.categories.find(c => c.id === activeCat);

  const handleConfirm = () => {
    if (activeCat === 'panel') {
      if (!selectedPanel) return;
      onConfirm({
        lumberName: selectedPanel.name,
        thickness: selectedPanel.thickness,
        boardSize: selectedPanel.boardSize,
        category: 'panel',
      });
    } else {
      if (!selectedItem) return;
      onConfirm({
        lumberName: selectedItem.name,
        thickness: selectedItem.thickness,
        width: selectedItem.width,
        category: activeCat,
      });
    }
  };

  const canConfirm = activeCat === 'panel' ? !!selectedPanel : !!selectedItem;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={s.header}>
          <div style={s.title}>🪵 素材・木材を選ぶ</div>
          <div style={s.tabs}>
            {LUMBER_DATA.categories.map(c => (
              <button
                key={c.id}
                style={{ ...s.tab, ...(activeCat === c.id ? s.tabActive : {}) }}
                onClick={() => { setActiveCat(c.id); setSelectedItem(null); setSelectedPanel(null); }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ボディ */}
        <div style={s.body}>
          <div style={s.note}>{cat.note}</div>

          {activeCat !== 'panel' ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>名称</th>
                  <th style={s.th}>断面 厚×幅 (mm)</th>
                  <th style={s.th}>長さの種類 (mm)</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map(item => (
                  <DimensionalRow
                    key={item.name}
                    item={item}
                    selected={selectedItem?.name === item.name}
                    onSelect={setSelectedItem}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div style={s.grid}>
              {cat.items.map(item => (
                <PanelCard
                  key={item.name}
                  item={item}
                  selectedThickness={selectedPanel}
                  onSelect={setSelectedPanel}
                />
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div style={s.footer}>
          <button style={s.btnCancel} onClick={onClose}>キャンセル</button>
          <button
            style={{ ...s.btnOk, opacity: canConfirm ? 1 : 0.4 }}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            この素材を使用
          </button>
        </div>
      </div>
    </div>
  );
}
