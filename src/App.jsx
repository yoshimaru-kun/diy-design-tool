import { useState } from 'react';
import StartScreen from './components/StartScreen';
import PartsEditor from './components/PartsEditor';
import MaterialList from './components/MaterialList';
import CutPlan from './components/CutPlan';
import AssemblyView from './components/AssemblyView';
import { createDefaultPart } from './templates';

const TABS = [
  { id: 'parts', label: '✏️ パーツ編集' },
  { id: 'materials', label: '📋 材料リスト' },
  { id: 'assembly', label: '🔨 組み立て' },
  { id: 'cut', label: '🪚 カットプラン' },
];

const s = {
  app: { height: '100%', display: 'flex', flexDirection: 'column' },
  header: {
    background: '#3a2e22',
    color: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '54px',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '0.3px',
  },
  headerMeta: {
    fontSize: '12px',
    color: '#c0aa88',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  templateBadge: {
    background: '#5b8dd9',
    color: '#fff',
    borderRadius: '12px',
    padding: '2px 10px',
    fontSize: '12px',
    fontWeight: '600',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '12px',
    padding: '5px 12px',
    borderRadius: '5px',
  },
  body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  tabBar: {
    display: 'flex',
    background: '#fff',
    borderBottom: '2px solid #e4dfd8',
    flexShrink: 0,
    overflowX: 'auto',
  },
  tab: {
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#8b7355',
    background: 'transparent',
    borderRadius: 0,
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#5b8dd9',
    borderBottom: '2px solid #5b8dd9',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 24px',
  },
  contentFull: {
    flex: 1,
    overflow: 'hidden',
    padding: 0,
    minHeight: 0,
    position: 'relative',
  },
};

export default function App() {
  const [screen, setScreen] = useState('start');
  const [parts, setParts] = useState([]);
  const [templateId, setTemplateId] = useState(null);
  const [templateLabel, setTemplateLabel] = useState('');
  const [activeTab, setActiveTab] = useState('parts');
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [initialLayout, setInitialLayout] = useState(null);

  const handleSelectTemplate = (template, size) => {
    const generated = template.generate(size);
    setParts(generated);
    setTemplateId(template.id);
    setTemplateLabel(template.label);
    setInitialLayout(template.layout ? template.layout(generated, size) : null);
    setScreen('editor');
    setActiveTab('assembly');
  };

  const handleFree = () => {
    setParts([createDefaultPart()]);
    setTemplateId(null);
    setTemplateLabel('');
    setScreen('editor');
    setActiveTab('parts');
  };

  const handleAddPart = (partDef) => {
    const newPart = {
      ...createDefaultPart(),
      name: partDef.name,
      partType: partDef.partType || '板材',
      lumberName: partDef.lumberName || '',
      width: partDef.width,
      height: partDef.height,
      depth: partDef.depth,
      thickness: partDef.depth,
    };
    setParts(prev => [...prev, newPart]);
    return newPart;
  };

  const handleBack = () => {
    if (window.confirm('スタート画面に戻りますか？現在の編集内容は失われます。')) {
      setScreen('start');
      setParts([]);
      setTemplateId(null);
    }
  };

  if (screen === 'start') {
    return <StartScreen onSelectTemplate={handleSelectTemplate} onFree={handleFree} />;
  }

  const isFullHeight = activeTab === 'assembly';

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div
          style={{ ...s.headerTitle, cursor: 'pointer' }}
          onClick={handleBack}
          title="ホーム画面に戻る"
        >
          🪚 DIY 設計ツール
        </div>
        <div style={s.headerMeta}>
          {templateLabel && <span style={s.templateBadge}>{templateLabel}</span>}
          <span>{parts.length} パーツ</span>
          <button style={s.backBtn} onClick={handleBack}>🏠 ホーム</button>
        </div>
      </header>

      <div style={s.body}>
        <div style={s.tabBar}>
          {TABS.map(t => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={isFullHeight ? s.contentFull : s.content}>
          {activeTab === 'parts' && (
            <PartsEditor
              parts={parts}
              setParts={setParts}
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
            />
          )}
          {activeTab === 'materials' && (
            <MaterialList parts={parts} />
          )}
          {activeTab === 'assembly' && (
            <AssemblyView
              key={templateId ?? 'free'}
              parts={parts}
              onAddPart={handleAddPart}
              onSetParts={setParts}
              initialLayout={initialLayout}
            />
          )}
          {activeTab === 'cut' && (
            <CutPlan parts={parts} />
          )}
        </div>
      </div>
    </div>
  );
}
