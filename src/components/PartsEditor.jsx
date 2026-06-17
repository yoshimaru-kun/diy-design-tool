import { useState } from 'react';
import { createDefaultPart } from '../templates';
import LumberPicker from './LumberPicker';

// 種別ごとの寸法ラベルとフィールドマッピング
const PART_TYPE_DIMS = {
  '板材': [
    { label: '長さ', key: 'width' },
    { label: '板幅', key: 'height' },
    { label: '板厚', key: 'depth' },
  ],
  '角材': [
    { label: '長さ', key: 'width' },
    { label: '断面幅', key: 'height' },
    { label: '断面高さ', key: 'depth' },
  ],
  'カスタム': [
    { label: '幅', key: 'width' },
    { label: '高さ', key: 'height' },
    { label: '奥行き', key: 'depth' },
  ],
};

const PART_TYPES = ['板材', '角材', 'カスタム'];

const PART_TYPE_COLOR = {
  '板材':  { bg: '#e8f0fe', color: '#3a6bb5' },
  '角材':  { bg: '#fdf0e0', color: '#a05a10' },
  'カスタム': { bg: '#f0f0f0', color: '#555' },
};

const s = {
  container: { padding: '0' },
  caption: {
    fontSize: '13px', color: '#7a6e5e', marginBottom: '16px',
    lineHeight: '1.6', background: '#faf8f4', border: '1px solid #e4dfd8',
    borderRadius: '8px', padding: '10px 14px',
  },
  tableWrapper: {
    overflowX: 'auto', borderRadius: '10px',
    border: '1px solid #ddd9d0', background: '#fff',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    background: '#f5f2ec', padding: '8px 6px', textAlign: 'center',
    fontWeight: '600', color: '#5a4e3e', borderBottom: '2px solid #ddd9d0',
    whiteSpace: 'nowrap', fontSize: '12px',
  },
  thLeft: {
    background: '#f5f2ec', padding: '8px 8px', textAlign: 'left',
    fontWeight: '600', color: '#5a4e3e', borderBottom: '2px solid #ddd9d0',
    whiteSpace: 'nowrap', fontSize: '12px',
  },
  td: { padding: '6px', borderBottom: '1px solid #eee9e0', verticalAlign: 'middle' },
  tdCenter: { padding: '6px', borderBottom: '1px solid #eee9e0', verticalAlign: 'middle', textAlign: 'center' },
  trHighlight: { background: '#f0f6ff' },
  nameInput: { width: '110px', minWidth: '80px' },
  numInput: { width: '64px', textAlign: 'right' },
  countInput: { width: '52px', textAlign: 'right' },
  typeSelect: {
    fontSize: '11px', fontWeight: '600', border: '1px solid #d0ccc8',
    borderRadius: '4px', padding: '3px 4px', cursor: 'pointer',
    background: '#fff', width: '64px',
  },
  dimCell: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  },
  dimLabel: { fontSize: '10px', color: '#8b7355', lineHeight: 1, whiteSpace: 'nowrap' },
  lumberBtn: {
    background: '#f5f0e8', color: '#7a5c30', border: '1px solid #d4c4a0',
    padding: '3px 7px', fontSize: '11px', borderRadius: '5px',
    whiteSpace: 'nowrap', display: 'block', marginTop: '3px',
    width: '100%', textAlign: 'left',
  },
  lumberBadge: {
    fontSize: '11px', color: '#7a5c30', background: '#fdf4e3',
    border: '1px solid #e8d4a0', borderRadius: '4px', padding: '2px 5px',
    display: 'block', marginTop: '2px', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px',
  },
  deleteBtn: {
    background: '#fee2e2', color: '#c0392b',
    padding: '4px 10px', fontSize: '12px', borderRadius: '5px',
  },
  btnRow: { marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' },
  addBtn: {
    background: '#5b8dd9', color: '#fff', fontWeight: '600',
    padding: '9px 20px', borderRadius: '7px',
  },
  emptyState: { padding: '32px', textAlign: 'center', color: '#a0947e', fontSize: '14px' },
};

function NumInput({ value, onChange, min = 1, max = 9999, style }) {
  return (
    <input
      type="number"
      style={{ ...s.numInput, ...style }}
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
    />
  );
}

function DimCell({ label, value, onChange }) {
  return (
    <td style={s.tdCenter}>
      <div style={s.dimCell}>
        <span style={s.dimLabel}>{label}</span>
        <NumInput value={value} onChange={onChange} />
      </div>
    </td>
  );
}

export default function PartsEditor({ parts, setParts, selectedPartId, onSelectPart }) {
  const [pickerTargetId, setPickerTargetId] = useState(null);

  const updatePart = (id, key, value) =>
    setParts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));

  const updatePartMulti = (id, updates) =>
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

  const deletePart = (id) => {
    setParts(prev => prev.filter(p => p.id !== id));
    if (selectedPartId === id) onSelectPart(null);
  };

  const addPart = () => setParts(prev => [...prev, createDefaultPart()]);

  const handleLumberConfirm = (lumber) => {
    const updates = {
      thickness: lumber.thickness,
      lumberName: lumber.lumberName,
      lumberCategory: lumber.category,
    };
    if (lumber.category === 'panel') {
      updates.partType = '板材';
      updates.depth = lumber.thickness;
      if (lumber.boardSize) {
        updates.width = lumber.boardSize[0];
        updates.height = lumber.boardSize[1];
      }
    } else {
      // ツーバイ材・杉材: thickness==width → 角材, それ以外 → 板材
      updates.partType = lumber.thickness === lumber.width ? '角材' : '板材';
      updates.depth = lumber.thickness;
      updates.height = lumber.width ?? lumber.height;
    }
    updatePartMulti(pickerTargetId, updates);
    setPickerTargetId(null);
  };

  return (
    <div style={s.container}>
      <div style={s.caption}>
        💡 種別を選ぶとラベルが変わります。素材ボタンで木材を選ぶと寸法が自動入力されます。
      </div>

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.thLeft}>パーツ名</th>
              <th style={s.th}>種別</th>
              <th style={s.th}>素材</th>
              <th style={s.th}>寸法① mm</th>
              <th style={s.th}>寸法② mm</th>
              <th style={s.th}>寸法③ mm</th>
              <th style={s.th}>個数</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {parts.length === 0 && (
              <tr>
                <td colSpan={8} style={s.emptyState}>
                  まだパーツがありません。下の「パーツを追加」ボタンから追加してください。
                </td>
              </tr>
            )}
            {parts.map(p => {
              const type = p.partType || 'カスタム';
              const dims = PART_TYPE_DIMS[type] ?? PART_TYPE_DIMS['カスタム'];
              const typeColor = PART_TYPE_COLOR[type] ?? PART_TYPE_COLOR['カスタム'];
              return (
                <tr
                  key={p.id}
                  style={selectedPartId === p.id ? s.trHighlight : {}}
                  onClick={() => onSelectPart(p.id)}
                >
                  {/* パーツ名 */}
                  <td style={s.td}>
                    <input
                      type="text"
                      style={s.nameInput}
                      value={p.name}
                      onChange={e => updatePart(p.id, 'name', e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>

                  {/* 種別 */}
                  <td style={s.tdCenter} onClick={e => e.stopPropagation()}>
                    <select
                      style={{ ...s.typeSelect, background: typeColor.bg, color: typeColor.color }}
                      value={type}
                      onChange={e => updatePart(p.id, 'partType', e.target.value)}
                    >
                      {PART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>

                  {/* 素材 */}
                  <td style={s.td} onClick={e => e.stopPropagation()}>
                    {p.lumberName && (
                      <span style={s.lumberBadge} title={p.lumberName}>🪵 {p.lumberName}</span>
                    )}
                    <button style={s.lumberBtn} onClick={() => setPickerTargetId(p.id)}>
                      {p.lumberName ? '変更' : '＋ 素材'}
                    </button>
                  </td>

                  {/* 寸法①②③ (ラベル適応) */}
                  {dims.map(dim => (
                    <DimCell
                      key={dim.key}
                      label={dim.label}
                      value={p[dim.key]}
                      onChange={v => updatePart(p.id, dim.key, v)}
                    />
                  ))}

                  {/* 個数 */}
                  <td style={s.tdCenter}>
                    <NumInput
                      value={p.count}
                      onChange={v => updatePart(p.id, 'count', v)}
                      max={50}
                      style={s.countInput}
                    />
                  </td>

                  {/* 削除 */}
                  <td style={s.tdCenter}>
                    <button
                      style={s.deleteBtn}
                      onClick={e => { e.stopPropagation(); deletePart(p.id); }}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={s.btnRow}>
        <button style={s.addBtn} onClick={addPart}>＋ パーツを追加</button>
      </div>

      {pickerTargetId && (
        <LumberPicker
          onConfirm={handleLumberConfirm}
          onClose={() => setPickerTargetId(null)}
        />
      )}
    </div>
  );
}
