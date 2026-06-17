import { useState } from 'react';
import { TEMPLATES } from '../templates';

const JP_FONT = "'BIZ UDPGothic', 'BIZ UDGothic', 'Yu Gothic UI', 'Meiryo UI', 'Meiryo', 'MS PGothic', sans-serif";

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: JP_FONT,
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #f8f5f0 0%, #e8e4dd 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#3a2e22',
    marginBottom: '12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b5f50',
    lineHeight: '1.7',
  },
  section: {
    width: '100%',
    maxWidth: '860px',
    marginBottom: '40px',
  },
  sectionLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#8b7355',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    marginBottom: '16px',
    paddingLeft: '4px',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px',
  },
  templateCard: {
    background: '#fff',
    border: '2px solid transparent',
    borderRadius: '12px',
    padding: '24px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  templateCardHover: {
    border: '2px solid #5b8dd9',
    boxShadow: '0 4px 16px rgba(91,141,217,0.2)',
    transform: 'translateY(-2px)',
  },
  templateIcon: {
    fontSize: '36px',
    marginBottom: '10px',
  },
  templateLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#3a2e22',
    marginBottom: '6px',
  },
  templateDesc: {
    fontSize: '12px',
    color: '#8b7355',
    lineHeight: '1.5',
  },
  freeButton: {
    width: '100%',
    maxWidth: '860px',
    background: '#fff',
    border: '2px dashed #c0b8a8',
    borderRadius: '12px',
    padding: '24px',
    fontSize: '15px',
    color: '#6b5f50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalBox: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#3a2e22',
    marginBottom: '6px',
  },
  modalDesc: {
    fontSize: '13px',
    color: '#8b7355',
    marginBottom: '24px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#5a4e3e',
    marginBottom: '6px',
    display: 'block',
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
  },
  inputCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  inputUnit: {
    fontSize: '11px',
    color: '#a0947e',
    textAlign: 'center',
  },
  btnRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  btnPrimary: {
    background: '#5b8dd9',
    color: '#fff',
    fontWeight: '600',
    padding: '10px 24px',
  },
  btnSecondary: {
    background: '#f0ede8',
    color: '#5a4e3e',
    padding: '10px 20px',
  },
};

function TemplateModal({ template, onConfirm, onClose }) {
  const def = template.defaultSize;
  const [width, setWidth] = useState(def.width);
  const [height, setHeight] = useState(def.height);
  const [depth, setDepth] = useState(def.depth);

  const handleConfirm = () => {
    onConfirm(template, { width: Number(width), height: Number(height), depth: Number(depth) });
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>{template.icon} {template.label}の基本サイズを入力</div>
        <div style={styles.modalDesc}>
          サイズを入力すると、パーツが自動生成されます。後からでも変更できます。
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>基本サイズ (mm)</label>
          <div style={styles.inputRow}>
            <div style={styles.inputCell}>
              <input type="number" value={width} onChange={e => setWidth(e.target.value)} min="100" max="3000" />
              <span style={styles.inputUnit}>幅 (W)</span>
            </div>
            <div style={styles.inputCell}>
              <input type="number" value={height} onChange={e => setHeight(e.target.value)} min="100" max="3000" />
              <span style={styles.inputUnit}>高さ (H)</span>
            </div>
            <div style={styles.inputCell}>
              <input type="number" value={depth} onChange={e => setDepth(e.target.value)} min="50" max="2000" />
              <span style={styles.inputUnit}>奥行き (D)</span>
            </div>
          </div>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.btnSecondary} onClick={onClose}>キャンセル</button>
          <button style={styles.btnPrimary} onClick={handleConfirm}>パーツを生成</button>
        </div>
      </div>
    </div>
  );
}

export default function StartScreen({ onSelectTemplate, onFree }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🪚 DIY 設計ツール</h1>
        <p style={styles.subtitle}>
          作りたいものを選んで、サイズを入力するだけ。<br />
          3Dイメージ・材料リスト・カット図が自動で生成されます。
        </p>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>テンプレートから選ぶ</div>
        <div style={styles.templateGrid}>
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              style={{
                ...styles.templateCard,
                ...(hoveredId === t.id ? styles.templateCardHover : {}),
              }}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedTemplate(t)}
            >
              <div style={styles.templateIcon}>{t.icon}</div>
              <div style={styles.templateLabel}>{t.label}</div>
              <div style={styles.templateDesc}>{t.description}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        style={styles.freeButton}
        onMouseEnter={e => { e.currentTarget.style.border = '2px dashed #5b8dd9'; e.currentTarget.style.color = '#3a6bb5'; }}
        onMouseLeave={e => { e.currentTarget.style.border = '2px dashed #c0b8a8'; e.currentTarget.style.color = '#6b5f50'; }}
        onClick={onFree}
      >
        <span style={{ fontSize: '20px' }}>✏️</span>
        <span>自由に作る（ゼロから設計する）</span>
      </button>

      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onConfirm={(tmpl, size) => {
            setSelectedTemplate(null);
            onSelectTemplate(tmpl, size);
          }}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
