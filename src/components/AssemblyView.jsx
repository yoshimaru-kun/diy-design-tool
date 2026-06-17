import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import LumberPicker from './LumberPicker';

const SCALE_OPTIONS = [
  { label: '1:20',  value: 0.05  },
  { label: '1:50',  value: 0.02  },
  { label: '1:100', value: 0.01  },
  { label: '1:200', value: 0.005 },
];

const COLORS = [
  0xd4a574, 0xc8956a, 0xe2b882, 0xb87d5a,
  0xf0c896, 0xa0725a, 0xcc9966, 0xe8d0a0,
  0x9a7055, 0xd4b896, 0xc07040, 0xe8c07a,
];

let idCounter = 0;
const newPlacedId = () => `p_${idCounter++}`;

// 方向定義
const DIRS = [
  { key: 'up',    label: '上へ',   icon: '⬆',  axis: 1, sign: +1 },
  { key: 'down',  label: '下へ',   icon: '⬇',  axis: 1, sign: -1 },
  { key: 'left',  label: '左へ',   icon: '⬅',  axis: 0, sign: -1 },
  { key: 'right', label: '右へ',   icon: '➡',  axis: 0, sign: +1 },
  { key: 'front', label: '手前へ', icon: '↙', axis: 2, sign: +1 },
  { key: 'back',  label: '奥へ',   icon: '↗', axis: 2, sign: -1 },
];

// 選択パーツをアンカーパーツの指定方向にスナップ
function calcAttachPos(sel, anc, dir) {
  const pos = [...anc.position];
  const hs = sel.size[dir.axis] / 2;
  const ha = anc.size[dir.axis] / 2;
  pos[dir.axis] = anc.position[dir.axis] + dir.sign * (ha + hs);
  // 横2軸は中心を揃える
  const other = [0, 1, 2].filter(i => i !== dir.axis);
  // Y方向以外の接合では Y は底面を揃える
  if (dir.axis !== 1) {
    pos[1] = sel.size[1] / 2; // 床上に置く
  }
  return pos;
}

// =========================================================
// スタイル
// =========================================================
const s = {
  root: { display: 'flex', height: '100%', fontFamily: "'Noto Sans JP','BIZ UDPGothic','Yu Gothic UI',sans-serif" },

  sidebar: {
    width: '200px', flexShrink: 0, background: '#faf8f4',
    borderRight: '1px solid #e4dfd8', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
  },
  sideSection: { padding: '10px 10px 6px', borderBottom: '1px solid #e4dfd8' },
  sideTitle: { fontSize: '11px', fontWeight: '700', color: '#8b7355', marginBottom: '6px', letterSpacing: '0.5px' },
  partBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', textAlign: 'left', background: '#fff',
    border: '1px solid #ddd9d0', borderRadius: '6px',
    padding: '6px 8px', marginBottom: '4px', fontSize: '12px', color: '#3a2e22',
  },
  addIcon: { fontSize: '16px', color: '#5b8dd9', fontWeight: '700' },

  stageList: { flex: 1, overflowY: 'auto', padding: '8px 10px' },
  stageItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '5px 7px', borderRadius: '6px', marginBottom: '3px',
    cursor: 'pointer', fontSize: '12px', color: '#3a2e22',
    border: '1.5px solid transparent',
  },
  stageItemSel: { background: '#e8f0fe', borderColor: '#5b8dd9', fontWeight: '700' },
  stageItemAnc: { background: '#fff3dc', borderColor: '#e0a030', fontWeight: '700' },
  removeBtn: { background: '#fee2e2', color: '#c0392b', padding: '1px 6px', fontSize: '11px', borderRadius: '4px' },

  center: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  canvas: { flex: 1, minHeight: 0, position: 'relative' },

  bottomBar: {
    background: '#fff', borderTop: '1px solid #e4dfd8',
    padding: '8px 16px', flexShrink: 0,
    overflowX: 'auto', overflowY: 'hidden',
  },
  stepRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', minWidth: 'max-content' },
  stepLabel: { fontSize: '12px', color: '#8b7355', fontWeight: '600', whiteSpace: 'nowrap' },
  stepVal: { fontSize: '13px', color: '#3a6bb5', fontWeight: '700' },
  anchorSelect: {
    fontSize: '12px', border: '1px solid #d0ccc8', borderRadius: '6px',
    padding: '4px 8px', background: '#fff', color: '#3a2e22', cursor: 'pointer',
  },
  dirGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(6, auto)', gap: '4px',
  },
  dirBtn: {
    background: '#5b8dd9', color: '#fff', borderRadius: '6px',
    padding: '5px 10px', fontSize: '12px', fontWeight: '600',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
    lineHeight: 1.2,
  },
  dirIcon: { fontSize: '14px' },
  dirLbl: { fontSize: '10px' },

  hint: {
    background: '#f5f2ec', borderRadius: '8px', padding: '10px 16px',
    fontSize: '12px', color: '#8b7355', lineHeight: 1.7,
  },
  resetBtn: {
    background: '#f5f0e8', color: '#7a5c30', border: '1px solid #d4c4a0',
    padding: '4px 12px', fontSize: '12px', borderRadius: '6px',
  },
};

// =========================================================
// スナップガイド（端部揃え時の視覚インジケータ）
// =========================================================
// スナップ判定：実寸1mm（スケール渡しで動的計算）
const SNAP_MM = 1;
const GUIDE_LEN = 15;

function clearSnapGuides(scene, ref) {
  // ガイドライン削除
  ref.current.lines.forEach(obj => {
    scene.remove(obj); obj.geometry.dispose(); obj.material.dispose();
  });
  // ハイライト色を元に戻す
  ref.current.highlights.forEach(({ mesh, origColor, origEmissive }) => {
    mesh.material.color.setHex(origColor);
    mesh.material.emissive.setHex(origEmissive);
  });
  ref.current = { lines: [], highlights: [] };
}

// =========================================================
// グループ中心マーカー
// =========================================================
function computeGroupCenter(members) {
  const mins = [Infinity, Infinity, Infinity], maxs = [-Infinity, -Infinity, -Infinity];
  members.forEach(m => {
    [0, 1, 2].forEach(i => {
      mins[i] = Math.min(mins[i], m.position[i] - m.size[i] / 2);
      maxs[i] = Math.max(maxs[i], m.position[i] + m.size[i] / 2);
    });
  });
  return {
    center: [(mins[0]+maxs[0])/2, maxs[1], (mins[2]+maxs[2])/2], // Y は上面
    size: [maxs[0]-mins[0], maxs[1]-mins[1], maxs[2]-mins[2]],
    cx: (mins[0]+maxs[0])/2, cz: (mins[2]+maxs[2])/2,
    top: maxs[1],
  };
}

function updateGroupCenterMarker(scene, cx, top, cz, markerRef) {
  const prev = markerRef.current.center;
  if (prev && Math.abs(prev[0]-cx)<0.0005 && Math.abs(prev[1]-top)<0.0005 && Math.abs(prev[2]-cz)<0.0005) return;
  clearGroupCenterMarker(scene, markerRef);
  markerRef.current.center = [cx, top, cz];
  const objs = [];

  // 黄色い球マーカー
  const sg = new THREE.SphereGeometry(0.05, 10, 10);
  const sm = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  const sphere = new THREE.Mesh(sg, sm);
  sphere.position.set(cx, top + 0.06, cz);
  scene.add(sphere); objs.push(sphere);

  // 十字ライン（X方向・Z方向）
  const lineLen = 3;
  const mkL = (p1, p2, color = 0xffdd00) => {
    const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const ml = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(g, ml);
  };
  const xLine = mkL(new THREE.Vector3(cx-lineLen, top+0.01, cz), new THREE.Vector3(cx+lineLen, top+0.01, cz));
  const zLine = mkL(new THREE.Vector3(cx, top+0.01, cz-lineLen), new THREE.Vector3(cx, top+0.01, cz+lineLen));
  scene.add(xLine); objs.push(xLine);
  scene.add(zLine); objs.push(zLine);

  markerRef.current.objects = objs;
}

function clearGroupCenterMarker(scene, markerRef) {
  (markerRef.current.objects || []).forEach(obj => {
    scene.remove(obj);
    obj.geometry?.dispose();
    obj.material?.dispose();
  });
  markerRef.current = { center: null, objects: [] };
}

function clearMeasureObjs(scene, ref) {
  ref.current.forEach(obj => {
    scene.remove(obj);
    obj.geometry?.dispose();
    obj.material?.dispose();
  });
  ref.current = [];
}

function clearCenterGuides(scene, ref) {
  ref.current.forEach(obj => {
    scene.remove(obj); obj.geometry?.dispose(); obj.material?.dispose();
  });
  ref.current = [];
}

function makeLine(p1, p2) {
  const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff });
  return new THREE.Line(geo, mat);
}

function highlightMesh(mesh, ref, selectedId) {
  // 選択中のメッシュは黄色を維持するためスキップ
  if (selectedId && mesh.userData.placedId === selectedId) return;
  if (ref.current.highlights.find(h => h.mesh === mesh)) return;
  const origColor = mesh.material.color.getHex();
  const origEmissive = mesh.material.emissive.getHex();
  mesh.material.color.setHex(0xff2222);
  mesh.material.emissive.setHex(0x661111);
  ref.current.highlights.push({ mesh, origColor, origEmissive });
}

function showSnapGuides(scene, dragMesh, dragId, ref, scale, selectedId) {
  clearSnapGuides(scene, ref);

  const threshold = SNAP_MM * (scale || 0.01);
  const dragBox = new THREE.Box3().setFromObject(dragMesh);

  const otherMeshes = scene.children.filter(
    c => c.isMesh && c.userData.placedId && c.userData.placedId !== dragId
  );

  let anySnap = false;

  const overlaps1D = (aMin, aMax, bMin, bMax) =>
    aMax > bMin + 1e-4 && aMin < bMax - 1e-4;

  otherMeshes.forEach(other => {
    const ob = new THREE.Box3().setFromObject(other);

    const axes = [
      { c: 'x', o1: 'y', o2: 'z' },
      { c: 'y', o1: 'x', o2: 'z' },
      { c: 'z', o1: 'x', o2: 'y' },
    ];

    let contacted = false;
    for (const { c, o1, o2 } of axes) {
      const faceTouch =
        Math.abs(dragBox.max[c] - ob.min[c]) < threshold ||
        Math.abs(dragBox.min[c] - ob.max[c]) < threshold;
      const ov1 = overlaps1D(dragBox.min[o1], dragBox.max[o1], ob.min[o1], ob.max[o1]);
      const ov2 = overlaps1D(dragBox.min[o2], dragBox.max[o2], ob.min[o2], ob.max[o2]);
      if (faceTouch && ov1 && ov2) {
        contacted = true;
        break;
      }
    }

    if (contacted) {
      highlightMesh(other, ref, selectedId);
      anySnap = true;
    }
  });

  if (anySnap) highlightMesh(dragMesh, ref, selectedId);
}

// =========================================================
// 位置調整パネル（mm単位で中心座標を直接編集）
// =========================================================
function PositionEditor({ selectedId, placed, scale, onMove }) {
  const item = placed.find(p => p.id === selectedId);
  const sc = scale || 0.01;

  // Three.js 座標 → mm（中心位置）
  const toMm = v => Math.round(v / sc);

  const [vals, setVals] = useState({ x: 0, y: 0, z: 0 });

  // 選択が変わったら現在値を同期
  useEffect(() => {
    if (item) setVals({
      x: toMm(item.position[0]),
      y: toMm(item.position[1]),
      z: toMm(item.position[2]),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, item?.position[0], item?.position[1], item?.position[2]]);

  if (!item) return null;

  const update = (k, v) => {
    const next = { ...vals, [k]: v };
    setVals(next);
    onMove(selectedId, [next.x, next.y, next.z]);
  };

  const numInp = {
    width: '70px', padding: '3px 5px', fontSize: '12px', textAlign: 'right',
    border: '1px solid #d0ccc8', borderRadius: '5px',
  };

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#8b7355', fontWeight: '600', marginBottom: '4px' }}>⑤ 位置調整 (mm・中心)</div>
      {[['X(左右)', 'x'], ['Y(高さ)', 'y'], ['Z(前後)', 'z']].map(([lbl, k]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
          <span style={{ fontSize: '10px', color: '#8b7355', width: '52px', flexShrink: 0 }}>{lbl}</span>
          <input
            type="number"
            style={numInp}
            value={vals[k]}
            onChange={e => update(k, +e.target.value)}
          />
          <span style={{ fontSize: '10px', color: '#a0947e' }}>mm</span>
        </div>
      ))}
    </div>
  );
}

// =========================================================
// 種別ごとの寸法ラベル
// =========================================================
const PART_TYPE_DIMS = {
  '板材': [{ label: '長さ', key: 'width' }, { label: '板幅', key: 'height' }, { label: '板厚', key: 'depth' }],
  '角材': [{ label: '長さ', key: 'width' }, { label: '断面幅', key: 'height' }, { label: '断面高', key: 'depth' }],
  'カスタム': [{ label: '幅', key: 'width' }, { label: '高さ', key: 'height' }, { label: '奥行', key: 'depth' }],
};
const PART_TYPES = ['板材', '角材', 'カスタム'];
const TYPE_COLOR = {
  '板材':   { bg: '#e8f0fe', color: '#3a6bb5' },
  '角材':   { bg: '#fdf0e0', color: '#a05a10' },
  'カスタム': { bg: '#f0f0f0', color: '#555' },
};

// =========================================================
// メインコンポーネント
// =========================================================
// 新規パーツ作成フォーム（サイドバー内）
function NewPartForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('新しいパーツ');
  const [partType, setPartType] = useState('板材');
  const [dims, setDims] = useState({ width: 300, height: 300, depth: 18 });
  const [lumberName, setLumberName] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const dimDefs = PART_TYPE_DIMS[partType];

  const handleLumberConfirm = (lumber) => {
    const updates = { depth: lumber.thickness };
    if (lumber.category === 'panel') {
      setPartType('板材');
      if (lumber.boardSize) {
        updates.width = lumber.boardSize[0];
        updates.height = lumber.boardSize[1];
      }
    } else {
      setPartType(lumber.thickness === lumber.width ? '角材' : '板材');
      updates.height = lumber.width ?? lumber.height;
    }
    setDims(prev => ({ ...prev, ...updates }));
    setLumberName(lumber.lumberName);
    setShowPicker(false);
  };

  const handleAdd = () => {
    onAdd({ name, partType, lumberName, ...dims });
    setOpen(false);
    setName('新しいパーツ'); setPartType('板材');
    setDims({ width: 300, height: 300, depth: 18 }); setLumberName('');
  };

  const inp = { width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #d0ccc8', borderRadius: '5px' };
  const tc = TYPE_COLOR[partType];

  return (
    <div style={{ borderTop: '1px solid #e4dfd8', padding: '8px 10px' }}>
      {!open ? (
        <button
          style={{ width: '100%', background: '#5b8dd9', color: '#fff', borderRadius: '6px', padding: '6px', fontSize: '12px', fontWeight: '600' }}
          onClick={() => setOpen(true)}
        >
          ＋ 新しい材料を作る
        </button>
      ) : (
        <div style={{ fontSize: '12px' }}>
          <div style={{ fontWeight: '700', color: '#8b7355', marginBottom: '6px', fontSize: '11px' }}>新しい材料</div>

          {/* 名前 */}
          <input style={{ ...inp, marginBottom: '5px' }} placeholder="名前" value={name} onChange={e => setName(e.target.value)} />

          {/* 種別 */}
          <div style={{ marginBottom: '5px' }}>
            <div style={{ fontSize: '10px', color: '#8b7355', marginBottom: '2px' }}>種別</div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {PART_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setPartType(t)}
                  style={{
                    flex: 1, fontSize: '11px', fontWeight: '600', borderRadius: '4px', padding: '3px 0',
                    background: partType === t ? tc.bg : '#f5f2ec',
                    color: partType === t ? tc.color : '#7a6e5e',
                    border: partType === t ? `1.5px solid ${tc.color}` : '1px solid #d0ccc8',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 素材（LumberPicker） */}
          <div style={{ marginBottom: '5px' }}>
            <div style={{ fontSize: '10px', color: '#8b7355', marginBottom: '2px' }}>素材</div>
            {lumberName && (
              <div style={{ fontSize: '11px', color: '#7a5c30', background: '#fdf4e3', border: '1px solid #e8d4a0', borderRadius: '4px', padding: '2px 6px', marginBottom: '3px' }}>
                🪵 {lumberName}
              </div>
            )}
            <button
              style={{ width: '100%', background: '#f5f0e8', color: '#7a5c30', border: '1px solid #d4c4a0', borderRadius: '5px', padding: '4px', fontSize: '11px' }}
              onClick={() => setShowPicker(true)}
            >
              {lumberName ? '素材を変更' : '＋ 素材を選ぶ'}
            </button>
          </div>

          {/* 寸法（種別に応じたラベル） */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '6px' }}>
            {dimDefs.map(({ label, key }) => (
              <div key={key}>
                <div style={{ fontSize: '10px', color: '#8b7355', textAlign: 'center' }}>{label}(mm)</div>
                <input
                  type="number" min="1" max="9999"
                  style={{ ...inp, textAlign: 'right' }}
                  value={dims[key]}
                  onChange={e => setDims(prev => ({ ...prev, [key]: +e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={{ flex: 1, background: '#5b8dd9', color: '#fff', borderRadius: '6px', padding: '5px', fontSize: '12px', fontWeight: '600' }} onClick={handleAdd}>追加</button>
            <button style={{ flex: 1, background: '#f0ede8', color: '#6b5f50', borderRadius: '6px', padding: '5px', fontSize: '12px' }} onClick={() => { setOpen(false); setLumberName(''); }}>キャンセル</button>
          </div>
        </div>
      )}

      {showPicker && (
        <LumberPicker onConfirm={handleLumberConfirm} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

export default function AssemblyView({ parts, onAddPart, onSetParts, initialLayout }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const sceneRef = useRef(null);
  const meshMapRef = useRef({});
  const needsRebuildRef = useRef(true);
  const placedRef = useRef([]);
  const selectedRef = useRef(null);
  const anchorRef = useRef(null);
  const colorMapRef = useRef({});
  const rotationsRef = useRef(initialLayout?.rotations ? { ...initialLayout.rotations } : {});

  const [placed, setPlaced] = useState(() => initialLayout?.placed ?? []);
  const [selectedId, setSelectedId] = useState(null);
  const [anchorId, setAnchorId] = useState(null);
  const [mainId, setMainId] = useState(null);
  const [lockedIds, setLockedIds] = useState(new Set());
  const lockedIdsRef = useRef(new Set());
  const [showAnchorCoord, setShowAnchorCoord] = useState(false);
  const [scale, setScale] = useState(0.01);
  const scaleRef = useRef(0.01);
  const mainIdRef = useRef(null);
  const snapGuidesRef = useRef({ lines: [], highlights: [] });
  const centerGuideRef = useRef([]);  // センター合致ガイドライン
  const gizmoRef = useRef(null);
  const axisArrowsRef = useRef([]);        // THREE.ArrowHelper × 3
  const axisLabelCanvasRef = useRef(null); // 2Dオーバーレイ（X/Y/Zラベル）
  const coordDisplayRef = useRef(null);      // 選択パーツ座標表示DOM
  const anchorCoordRef = useRef(null);       // 基準パーツ座標表示DOM
  const showAnchorCoordRef = useRef(false);  // ON/OFFをアニメループから参照
  const groupCenterMarkerRef = useRef({ center: null, objects: [] });
  // グループ機能
  const [checkedIds, setCheckedIds] = useState(new Set()); // 複数チェック用
  const groupCounter = useRef(0);
  // 計測モード
  const [measureMode, setMeasureMode] = useState(false);
  const measureModeRef = useRef(false);
  const measurePointsRef = useRef([]); // [{pos, normal, name}]
  const measureObjsRef = useRef([]);   // Three.js objects for cleanup
  const measureLabelRef = useRef(null);
  measureModeRef.current = measureMode;
  // アンドゥ履歴
  const [history, setHistory] = useState([]);
  const pushHistory = useCallback(() => {
    setHistory(prev => [
      ...prev.slice(-30),
      { placed: placedRef.current.map(p => ({ ...p })), rotations: { ...rotationsRef.current } }
    ]);
  }, []);

  const colorMap = useMemo(() => {
    const m = {};
    let ci = 0;
    parts.forEach(p => { m[p.id] = COLORS[ci++ % COLORS.length]; });
    return m;
  }, [parts]);

  // ref sync
  placedRef.current = placed;
  selectedRef.current = selectedId;
  anchorRef.current = anchorId;
  colorMapRef.current = colorMap;
  mainIdRef.current = mainId;
  lockedIdsRef.current = lockedIds;
  showAnchorCoordRef.current = showAnchorCoord;
  const pushHistoryRef = useRef(pushHistory);
  pushHistoryRef.current = pushHistory;
  const undoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { needsRebuildRef.current = true; }, [placed, selectedId, anchorId, mainId, lockedIds, checkedIds]);

  // Three.js init
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || 600;
    const H = el.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd6cfc4);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 500);
    camera.position.set(3, 2, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xfff8f0, 0.6));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sun.position.set(5, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.3);
    fill.position.set(-4, 3, -3);
    scene.add(fill);

    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshLambertMaterial({ color: 0xb8b0a0 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.001;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    scene.add(new THREE.GridHelper(20, 20, 0x999080, 0xaaa090));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    const onResize = () => {
      const w = el.clientWidth || 600;
      const h = el.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const rebuildMeshes = () => {
      Object.values(meshMapRef.current).forEach(({ mesh, line }) => {
        scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose();
        scene.remove(line); line.geometry.dispose(); line.material.dispose();
      });
      meshMapRef.current = {};

      const items = placedRef.current;
      const selId = selectedRef.current;
      const ancId = anchorRef.current;
      const mnId = mainIdRef.current;
      const lIds = lockedIdsRef.current;
      const cmap = colorMapRef.current;

      items.forEach(item => {
        const [w, h, d] = item.size;
        const isSelected = item.id === selId;
        const isAnchor = item.id === ancId;
        const isMain = mnId?.startsWith('grp:')
          ? item.groupId === mnId.slice(4)
          : item.id === mnId;
        const isLocked = lIds.has(item.id);
        const baseColor = cmap[item.partId] || 0xd4a574;
        const color = isSelected ? 0xffe000 : isAnchor ? 0xe8a020 : isMain ? 0xe85050 : isLocked ? 0x888888 : baseColor;
        const emissive = isSelected ? 0x554400 : 0x000000;

        const geo = new THREE.BoxGeometry(Math.max(w, 0.001), Math.max(h, 0.001), Math.max(d, 0.001));
        const mat = new THREE.MeshLambertMaterial({ color, emissive });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.placedId = item.id;
        mesh.position.set(...item.position);

        const rot = rotationsRef.current[item.id] || { rx: 0, ry: 0, rz: 0 };
        mesh.rotation.set(rot.rx, rot.ry, rot.rz);

        const line = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: isSelected ? 0xbb9900 : isAnchor ? 0xb06000 : isMain ? 0xaa2020 : 0x6a5040 })
        );
        line.position.set(...item.position);
        line.rotation.set(rot.rx, rot.ry, rot.rz);

        // 床面スナップ
        const bbox = new THREE.Box3().setFromObject(mesh);
        if (bbox.min.y < 0) {
          const adj = -bbox.min.y;
          mesh.position.y += adj;
          line.position.y += adj;
          item.position = [mesh.position.x, mesh.position.y, mesh.position.z];
        }

        scene.add(mesh);
        scene.add(line);
        meshMapRef.current[item.id] = { mesh, line };
      });
    };

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (needsRebuildRef.current) {
        needsRebuildRef.current = false;
        rebuildMeshes();
      }
      // 選択中の木材と他の木材の接触を常時チェック
      const selId = selectedRef.current;
      if (selId && meshMapRef.current[selId]) {
        showSnapGuides(scene, meshMapRef.current[selId].mesh, selId, snapGuidesRef, scaleRef.current, selId);
      } else {
        clearSnapGuides(scene, snapGuidesRef);
      }

      // センター合致ガイドライン（全操作対応：アニメーションループで常時チェック）
      {
        const ancIdL = anchorRef.current;
        const selEntryL = selId ? meshMapRef.current[selId] : null;
        if (ancIdL && selEntryL && !dragState) {
          const sc = scaleRef.current;
          const selMesh = selEntryL.mesh;
          let aCX, aCZ, aTop;
          if (ancIdL.startsWith('grp:')) {
            const mems = placedRef.current.filter(p => p.groupId === ancIdL.slice(4));
            if (mems.length) { const gc0 = computeGroupCenter(mems); aCX = gc0.cx; aCZ = gc0.cz; aTop = gc0.top; }
          } else {
            const ai = placedRef.current.find(p => p.id === ancIdL);
            if (ai) { aCX = ai.position[0]; aCZ = ai.position[2]; aTop = ai.position[1]; }
          }
          if (aCX !== undefined) {
            // mm単位で比較（浮動小数点誤差を排除）
            const selXmm = Math.round(selMesh.position.x / sc);
            const selZmm = Math.round(selMesh.position.z / sc);
            const ancXmm = Math.round(aCX / sc);
            const ancZmm = Math.round(aCZ / sc);
            const alignX = selXmm === ancXmm;
            const alignZ = selZmm === ancZmm;
            const lineY = (aTop ?? 0) + 0.02;
            const gLen = 5;
            const hasPrev = centerGuideRef.current.length > 0;
            const needsX = alignX, needsZ = alignZ;
            // 状態変化時のみ再描画
            const prevState = centerGuideRef.current._state;
            const curState = `${needsX},${needsZ}`;
            if (prevState !== curState) {
              clearCenterGuides(scene, centerGuideRef);
              centerGuideRef.current._state = curState;
              const mkCL = (p1, p2, color) => {
                const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                const m = new THREE.LineBasicMaterial({ color });
                const ln = new THREE.Line(g, m);
                scene.add(ln); centerGuideRef.current.push(ln);
              };
              // X軸センター合致：赤線（Z方向に伸びる）
              if (needsX) mkCL(new THREE.Vector3(aCX, lineY, aCZ - gLen), new THREE.Vector3(aCX, lineY, aCZ + gLen), 0xff2020);
              // Z軸センター合致：青線（X方向に伸びる）
              if (needsZ) mkCL(new THREE.Vector3(aCX - gLen, lineY, aCZ), new THREE.Vector3(aCX + gLen, lineY, aCZ), 0x2080ff);
            }
          } else {
            if (centerGuideRef.current.length > 0) clearCenterGuides(scene, centerGuideRef);
          }
        } else {
          if (centerGuideRef.current.length > 0) clearCenterGuides(scene, centerGuideRef);
        }
      }

      // グループ中心マーカー（基準がグループのとき表示）
      const ancId = anchorRef.current;
      if (ancId && typeof ancId === 'string' && ancId.startsWith('grp:')) {
        const gid = ancId.slice(4);
        const members = placedRef.current.filter(p => p.groupId === gid);
        if (members.length) {
          const gc2 = computeGroupCenter(members);
          updateGroupCenterMarker(scene, gc2.cx, gc2.top, gc2.cz, groupCenterMarkerRef);
        }
      } else {
        clearGroupCenterMarker(scene, groupCenterMarkerRef);
      }

      // 選択パーツのXYZ軸矢印（render前に更新して同フレームで描画）
      const selEntry = selId ? meshMapRef.current[selId] : null;
      axisArrowsRef.current.forEach(a => {
        scene.remove(a);
        a.line?.geometry?.dispose(); a.line?.material?.dispose();
        a.cone?.geometry?.dispose(); a.cone?.material?.dispose();
      });
      axisArrowsRef.current = [];
      const screenPts = [];
      if (selEntry) {
        const selItem = placedRef.current.find(p => p.id === selId);
        const sz = selItem ? Math.max(...selItem.size) * 2.0 : 0.6;
        const origin = selEntry.mesh.position.clone();
        const AXIS_DEF = [
          { dir: new THREE.Vector3(1,0,0), color: 0xff3333, label: 'X', labelColor: '#ff4444' },
          { dir: new THREE.Vector3(0,1,0), color: 0x33cc33, label: 'Y', labelColor: '#44dd44' },
          { dir: new THREE.Vector3(0,0,1), color: 0x3399ff, label: 'Z', labelColor: '#4499ff' },
        ];
        AXIS_DEF.forEach(({ dir, color, label, labelColor }) => {
          const arrow = new THREE.ArrowHelper(dir, origin, sz, color, sz * 0.22, sz * 0.12);
          scene.add(arrow);
          axisArrowsRef.current.push(arrow);
          screenPts.push({ dir, sz, origin, label, labelColor });
        });
      }

      controls.update();
      renderer.render(scene, camera);

      // 計測ラベルを中間点に追従させる
      const mLabel = measureLabelRef.current;
      if (mLabel && mLabel._midWorld && mLabel._distText) {
        const ndc = mLabel._midWorld.clone().project(camera);
        const cw = renderer.domElement.clientWidth;
        const ch = renderer.domElement.clientHeight;
        const sx = (ndc.x * 0.5 + 0.5) * cw;
        const sy = (-ndc.y * 0.5 + 0.5) * ch;
        mLabel.style.left = `${sx}px`;
        mLabel.style.top = `${sy}px`;
        mLabel.style.display = 'block';
        // 改行対応で textContent ではなく innerHTML 使用
        mLabel.innerHTML = mLabel._distText.replace('\n', '<br>');
      }

      // render後にラベルと座標を2D描画（カメラ行列が確定した状態で投影）
      const labelCanvas = axisLabelCanvasRef.current;
      if (labelCanvas) {
        const lctx = labelCanvas.getContext('2d');
        lctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
        const lw = labelCanvas.width, lh = labelCanvas.height;
        screenPts.forEach(({ dir, sz, origin, label, labelColor }) => {
          const tipWorld = origin.clone().add(dir.clone().multiplyScalar(sz * 1.18));
          const tipNDC = tipWorld.clone().project(camera);
          const sx = (tipNDC.x * 0.5 + 0.5) * lw;
          const sy = (-tipNDC.y * 0.5 + 0.5) * lh;
          if (sx < -20 || sx > lw + 20 || sy < -20 || sy > lh + 20) return;
          lctx.font = 'bold 15px sans-serif';
          lctx.textAlign = 'center'; lctx.textBaseline = 'middle';
          lctx.strokeStyle = 'rgba(0,0,0,0.8)'; lctx.lineWidth = 4;
          lctx.strokeText(label, sx, sy);
          lctx.fillStyle = labelColor;
          lctx.fillText(label, sx, sy);
        });
      }

      // 基準パーツ座標表示
      const ancCoordEl = anchorCoordRef.current;
      if (ancCoordEl) {
        const ancId4 = anchorRef.current;
        if (showAnchorCoordRef.current && ancId4) {
          const sc = scaleRef.current;
          let txt = '';
          if (ancId4.startsWith('grp:')) {
            const gid4 = ancId4.slice(4);
            const mems4 = placedRef.current.filter(p => p.groupId === gid4);
            if (mems4.length) {
              const gc5 = computeGroupCenter(mems4);
              const gcYmm = Math.round((gc5.top - gc5.size[1] / 2) / sc);
              txt = `基準(G) X:${Math.round(gc5.cx/sc)}  Y:${gcYmm}  Z:${Math.round(gc5.cz/sc)} mm`;
            }
          } else {
            const ancItem4 = placedRef.current.find(p => p.id === ancId4);
            if (ancItem4) {
              const [ax,ay,az] = ancItem4.position;
              txt = `基準 X:${Math.round(ax/sc)}  Y:${Math.round(ay/sc)}  Z:${Math.round(az/sc)} mm`;
            }
          }
          ancCoordEl.textContent = txt;
          ancCoordEl.style.display = txt ? 'block' : 'none';
        } else {
          ancCoordEl.style.display = 'none';
        }
      }

      // 座標表示（選択中パーツのリアルタイム位置）
      const coordEl = coordDisplayRef.current;
      if (coordEl) {
        if (selEntry) {
          const sc = scaleRef.current;
          const p = selEntry.mesh.position;
          const rx = Math.round(p.x / sc);
          const ry = Math.round(p.y / sc);
          const rz = Math.round(p.z / sc);
          coordEl.textContent = `X: ${rx}  Y: ${ry}  Z: ${rz} mm`;
          coordEl.style.display = 'block';
        } else {
          coordEl.style.display = 'none';
        }
      }

      // 軸ギズモ描画
      const gc = gizmoRef.current;
      if (gc) {
        const ctx = gc.getContext('2d');
        const gw = gc.width, gh = gc.height;
        const cx = gw / 2, cy = gh / 2, len = 26;
        ctx.clearRect(0, 0, gw, gh);
        // 背景円
        ctx.beginPath(); ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30,24,18,0.45)'; ctx.fill();
        const AXES = [
          { vec: new THREE.Vector3(1, 0, 0), color: '#ff5555', neg: '#883333', label: 'X' },
          { vec: new THREE.Vector3(0, 1, 0), color: '#55dd55', neg: '#337733', label: 'Y' },
          { vec: new THREE.Vector3(0, 0, 1), color: '#5599ff', neg: '#334488', label: 'Z' },
        ];
        // 奥→手前の順で描画するためdot積でソート
        const projected = AXES.map(a => {
          const dir = a.vec.clone().transformDirection(camera.matrixWorldInverse);
          return { ...a, dir, dot: dir.z };
        }).sort((a, b) => a.dot - b.dot);
        projected.forEach(({ dir, color, neg, label }) => {
          const ex = cx + dir.x * len, ey = cy - dir.y * len;
          const nx = cx - dir.x * len * 0.5, ny = cy + dir.y * len * 0.5;
          // 負方向（薄く）
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
          ctx.strokeStyle = neg; ctx.lineWidth = 1.5; ctx.stroke();
          // 正方向
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
          ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
          // ラベル
          ctx.fillStyle = color; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(label, ex + dir.x * 8, ey - dir.y * 8);
        });
      }
    };
    animate();

    // ドラッグ操作
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const intersectPt = new THREE.Vector3();
    const offset = new THREE.Vector3();
    let dragState = null;
    let mouseDownPos = null;
    let isDragging = false;

    const getNDC = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onDown = (e) => {
      if (e.button !== 0) return;
      getNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(meshMapRef.current).map(m => m.mesh);

      // ── 計測モード ──────────────────────────────────────────
      if (measureModeRef.current) {
        const hits2 = raycaster.intersectObjects(meshes);
        if (!hits2.length) return;
        const hit = hits2[0];
        const hitMesh = hit.object;
        const partName = placedRef.current.find(p => p.id === hitMesh.userData.placedId)?.name ?? hitMesh.userData.placedId;

        // 面の法線（ワールド空間）
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitMesh.matrixWorld);
        const faceNormalWorld = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();

        // 面の中心 = バウンディングボックス中心 + 法線方向のハーフサイズ
        const box3 = new THREE.Box3().setFromObject(hitMesh);
        const boxCenter = new THREE.Vector3(); box3.getCenter(boxCenter);
        const boxSize = new THREE.Vector3(); box3.getSize(boxSize);
        const halfExtent = Math.abs(faceNormalWorld.x) * boxSize.x / 2
                         + Math.abs(faceNormalWorld.y) * boxSize.y / 2
                         + Math.abs(faceNormalWorld.z) * boxSize.z / 2;
        const faceCenter = boxCenter.clone().addScaledVector(faceNormalWorld, halfExtent);

        const sc = scaleRef.current;
        const pts = measurePointsRef.current;

        // 1点目
        if (pts.length === 0) {
          // 既存の計測オブジェクトをクリア
          clearMeasureObjs(scene, measureObjsRef);
          if (measureLabelRef.current) measureLabelRef.current.style.display = 'none';

          pts.push({ pos: faceCenter, normal: faceNormalWorld, name: partName });
          // マーカー球
          const sg = new THREE.SphereGeometry(sc * 8, 10, 10);
          const sm = new THREE.MeshBasicMaterial({ color: 0xff8800 });
          const sphere = new THREE.Mesh(sg, sm);
          sphere.position.copy(faceCenter);
          scene.add(sphere);
          measureObjsRef.current.push(sphere);
          if (measureLabelRef.current) {
            measureLabelRef.current.textContent = '2つ目の面をクリックしてください';
            measureLabelRef.current.style.display = 'block';
            measureLabelRef.current.style.background = 'rgba(0,0,0,0.65)';
          }

        } else if (pts.length === 1) {
          // 2点目
          pts.push({ pos: faceCenter, normal: faceNormalWorld, name: partName });

          // 2点目マーカー球
          const sg2 = new THREE.SphereGeometry(sc * 8, 10, 10);
          const sm2 = new THREE.MeshBasicMaterial({ color: 0xff8800 });
          const sphere2 = new THREE.Mesh(sg2, sm2);
          sphere2.position.copy(faceCenter);
          scene.add(sphere2);
          measureObjsRef.current.push(sphere2);

          // 計測ライン
          const lg = new THREE.BufferGeometry().setFromPoints([pts[0].pos, pts[1].pos]);
          const lm = new THREE.LineBasicMaterial({ color: 0xff8800 });
          const ln = new THREE.Line(lg, lm);
          scene.add(ln);
          measureObjsRef.current.push(ln);

          // 距離計算
          const distUnits = pts[0].pos.distanceTo(pts[1].pos);
          const distMm = Math.round(distUnits / sc);
          const midWorld = pts[0].pos.clone().add(pts[1].pos).multiplyScalar(0.5);
          if (measureLabelRef.current) {
            measureLabelRef.current._midWorld = midWorld;
            measureLabelRef.current._distText = `📏 ${distMm} mm\n${pts[0].name} ↔ ${pts[1].name}`;
          }
        } else {
          // 3クリック目でリセット
          clearMeasureObjs(scene, measureObjsRef);
          measurePointsRef.current = [];
          if (measureLabelRef.current) measureLabelRef.current.style.display = 'none';
        }
        return;
      }
      // ────────────────────────────────────────────────────────

      const hits = raycaster.intersectObjects(meshes);
      if (!hits.length) return;

      const mesh = hits[0].object;
      const placedId = mesh.userData.placedId;
      setSelectedId(placedId);
      // メイン材が設定済みで、自分以外なら自動でアンカーにセット
      if (mainIdRef.current) {
        const mn = mainIdRef.current;
        const clickedItem = placedRef.current.find(p => p.id === placedId);
        const isInMainGroup = mn.startsWith('grp:') && clickedItem?.groupId === mn.slice(4);
        if (!isInMainGroup && mn !== placedId) {
          setAnchorId(mn);
        }
      }
      // ロック済みならドラッグ不可（グループ内に1つでもロックがあれば全体停止）
      if (lockedIdsRef.current.has(placedId)) return;
      const draggedItem = placedRef.current.find(p => p.id === placedId);
      if (draggedItem?.groupId) {
        const anyLocked = placedRef.current.some(
          p => p.groupId === draggedItem.groupId && lockedIdsRef.current.has(p.id)
        );
        if (anyLocked) return;
      }
      controls.enabled = false;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      isDragging = false;

      const isY = e.shiftKey;
      if (isY) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        dragPlane.setFromNormalAndCoplanarPoint(camDir, mesh.position);
      } else {
        dragPlane.set(new THREE.Vector3(0, 1, 0), -mesh.position.y);
      }
      raycaster.ray.intersectPlane(dragPlane, intersectPt);
      offset.copy(intersectPt).sub(mesh.position);
      // グループ全員の初期位置を記録（ドラッグ開始時）
      const groupInitialPositions = {};
      if (draggedItem?.groupId) {
        placedRef.current.forEach(p => {
          if (p.groupId === draggedItem.groupId) {
            groupInitialPositions[p.id] = [...p.position];
          }
        });
      }
      dragState = { placedId, mesh, isY, groupInitialPositions };
    };

    const onMove = (e) => {
      if (!dragState) return;
      // 5px 以上動いたらドラッグ開始
      if (!isDragging && mouseDownPos) {
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          isDragging = true;
          pushHistoryRef.current(); // ドラッグ開始前に履歴保存
        }
      }
      if (!isDragging) return;

      getNDC(e);
      raycaster.setFromCamera(mouse, camera);
      if (!raycaster.ray.intersectPlane(dragPlane, intersectPt)) return;

      const { placedId, isY } = dragState;
      // rebuildMeshes が走ってメッシュが差し替わる場合に備え毎回最新を取得
      const freshEntry = meshMapRef.current[placedId];
      if (!freshEntry) return;
      const mesh = freshEntry.mesh;
      dragState.mesh = mesh; // dragPlane 再計算用に更新

      const np = intersectPt.clone().sub(offset);
      const { groupInitialPositions } = dragState;
      const initPos = groupInitialPositions[placedId];

      if (isY) {
        mesh.position.y = np.y;
      } else {
        mesh.position.x = np.x;
        mesh.position.z = np.z;
      }

      // 回転込みのバウンディングボックスで床面貫通を防ぐ
      const bbox = new THREE.Box3().setFromObject(mesh);
      if (bbox.min.y < 0) mesh.position.y -= bbox.min.y;

      freshEntry.line.position.copy(mesh.position);

      const item = placedRef.current.find(p => p.id === placedId);
      if (item) item.position = [mesh.position.x, mesh.position.y, mesh.position.z];

      // グループ内の他パーツ：初期位置 + 変位で計算（累積誤差なし）
      if (item?.groupId && initPos) {
        const disp = new THREE.Vector3(
          mesh.position.x - initPos[0],
          mesh.position.y - initPos[1],
          mesh.position.z - initPos[2],
        );
        placedRef.current.forEach(p => {
          if (p.groupId === item.groupId && p.id !== placedId) {
            const e = meshMapRef.current[p.id];
            if (!e) return;
            const pInit = groupInitialPositions[p.id];
            if (pInit) {
              e.mesh.position.set(
                pInit[0] + disp.x,
                pInit[1] + disp.y,
                pInit[2] + disp.z,
              );
            }
            const bb2 = new THREE.Box3().setFromObject(e.mesh);
            if (bb2.min.y < 0) e.mesh.position.y -= bb2.min.y;
            e.line.position.copy(e.mesh.position);
            p.position = e.mesh.position.toArray();
          }
        });
      }

      // グループ中心へのスナップ（基準がグループのとき）
      if (!isY) {
        const ancId2 = anchorRef.current;
        if (ancId2 && typeof ancId2 === 'string' && ancId2.startsWith('grp:')) {
          const gid2 = ancId2.slice(4);
          const members2 = placedRef.current.filter(p => p.groupId === gid2);
          if (members2.length) {
            const gc3 = computeGroupCenter(members2);
            const snapDist = Math.max(0.00010, 0.05);
            const snappedX = Math.abs(mesh.position.x - gc3.cx) < snapDist ? gc3.cx : null;
            const snappedZ = Math.abs(mesh.position.z - gc3.cz) < snapDist ? gc3.cz : null;
            if (snappedX !== null || snappedZ !== null) {
              if (snappedX !== null) mesh.position.x = snappedX;
              if (snappedZ !== null) mesh.position.z = snappedZ;
              freshEntry.line.position.copy(mesh.position);
              if (item) item.position = [mesh.position.x, mesh.position.y, mesh.position.z];
              // スナップ後も他メンバーを再更新
              if (item?.groupId && initPos) {
                const disp2 = new THREE.Vector3(
                  mesh.position.x - initPos[0],
                  mesh.position.y - initPos[1],
                  mesh.position.z - initPos[2],
                );
                placedRef.current.forEach(p => {
                  if (p.groupId === item.groupId && p.id !== placedId) {
                    const e = meshMapRef.current[p.id];
                    if (!e) return;
                    const pInit = groupInitialPositions[p.id];
                    if (pInit) e.mesh.position.set(pInit[0]+disp2.x, pInit[1]+disp2.y, pInit[2]+disp2.z);
                    const bb3 = new THREE.Box3().setFromObject(e.mesh);
                    if (bb3.min.y < 0) e.mesh.position.y -= bb3.min.y;
                    e.line.position.copy(e.mesh.position);
                    p.position = e.mesh.position.toArray();
                  }
                });
              }
            }
          }
        }
      }

      // センター合致スナップ＆ガイドライン
      if (!isY) {
        clearCenterGuides(scene, centerGuideRef);
        const ancId3 = anchorRef.current;
        if (ancId3) {
          let ancCX, ancCZ, ancY;
          if (ancId3.startsWith('grp:')) {
            const gid3 = ancId3.slice(4);
            const mems = placedRef.current.filter(p => p.groupId === gid3);
            if (mems.length) {
              const gc4 = computeGroupCenter(mems);
              ancCX = gc4.cx; ancCZ = gc4.cz;
              ancY = gc4.top;
            }
          } else {
            const ancItem2 = placedRef.current.find(p => p.id === ancId3);
            if (ancItem2) {
              ancCX = ancItem2.position[0]; ancCZ = ancItem2.position[2];
              ancY = ancItem2.position[1];
            }
          }
          if (ancCX !== undefined) {
            const snapDist2 = 0.0001;
            const lineY = (ancY ?? 0) + 0.02;
            const guideLen = 5;
            const mkCL = (p1, p2, color) => {
              const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
              const m = new THREE.LineBasicMaterial({ color });
              const ln = new THREE.Line(g, m);
              scene.add(ln); centerGuideRef.current.push(ln);
            };
            // X軸センター合致：赤線（Z方向に伸びる）
            if (Math.abs(mesh.position.x - ancCX) < snapDist2) {
              mesh.position.x = ancCX;
              freshEntry.line.position.copy(mesh.position);
              if (item) item.position = [mesh.position.x, mesh.position.y, mesh.position.z];
              mkCL(
                new THREE.Vector3(ancCX, lineY, ancCZ - guideLen),
                new THREE.Vector3(ancCX, lineY, ancCZ + guideLen),
                0xff2020
              );
            }
            // Z軸センター合致：青線（X方向に伸びる）
            if (Math.abs(mesh.position.z - ancCZ) < snapDist2) {
              mesh.position.z = ancCZ;
              freshEntry.line.position.copy(mesh.position);
              if (item) item.position = [mesh.position.x, mesh.position.y, mesh.position.z];
              mkCL(
                new THREE.Vector3(ancCX - guideLen, lineY, ancCZ),
                new THREE.Vector3(ancCX + guideLen, lineY, ancCZ),
                0x2080ff
              );
            }
            // グループ移動にも反映
            if (item?.groupId && dragState.groupInitialPositions) {
              const initP = dragState.groupInitialPositions[placedId];
              if (initP) {
                const disp3 = new THREE.Vector3(
                  mesh.position.x - initP[0], mesh.position.y - initP[1], mesh.position.z - initP[2]
                );
                placedRef.current.forEach(p => {
                  if (p.groupId === item.groupId && p.id !== placedId) {
                    const e = meshMapRef.current[p.id];
                    if (!e) return;
                    const pI = dragState.groupInitialPositions[p.id];
                    if (pI) e.mesh.position.set(pI[0]+disp3.x, pI[1]+disp3.y, pI[2]+disp3.z);
                    const bbc = new THREE.Box3().setFromObject(e.mesh);
                    if (bbc.min.y < 0) e.mesh.position.y -= bbc.min.y;
                    e.line.position.copy(e.mesh.position);
                    p.position = e.mesh.position.toArray();
                  }
                });
              }
            }
          }
        }
      }

      // スナップガイドはアニメーションループで常時更新
    };

    const onUp = () => {
      if (dragState) {
        controls.enabled = true;
        if (isDragging) {
          // 最終位置を React state に反映（グループ全員）
          const { placedId } = dragState;
          const movedItem = placedRef.current.find(p => p.id === placedId);
          const gid = movedItem?.groupId;
          setPlaced(prev => prev.map(p => {
            const e = meshMapRef.current[p.id];
            if (!e) return p;
            if (p.id === placedId || (gid && p.groupId === gid)) {
              return { ...p, position: e.mesh.position.toArray() };
            }
            return p;
          }));
        }
        clearCenterGuides(scene, centerGuideRef);
        dragState = null;
        isDragging = false;
        mouseDownPos = null;
      }
    };

    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoRef.current?.();
        return;
      }

      // 矢印キーで選択パーツを微調整移動
      const ARROW_KEYS = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      if (!ARROW_KEYS.includes(e.key)) return;
      const selId = selectedRef.current;
      if (!selId || isLockedRef(selId)) return;
      const entry = meshMapRef.current[selId];
      if (!entry) return;
      e.preventDefault(); // スクロール防止

      // Shift押しで10mm、通常は1mm
      const step = (e.shiftKey ? 10 : 1) * scaleRef.current;
      const { mesh, line } = entry;

      if (e.key === 'ArrowLeft')  mesh.position.x -= step;
      if (e.key === 'ArrowRight') mesh.position.x += step;
      if (e.key === 'ArrowUp')    mesh.position.z -= step;
      if (e.key === 'ArrowDown')  mesh.position.z += step;

      // 床面貫通防止
      const bbox = new THREE.Box3().setFromObject(mesh);
      if (bbox.min.y < 0) mesh.position.y -= bbox.min.y;
      line.position.copy(mesh.position);

      const item = placedRef.current.find(p => p.id === selId);
      if (item) item.position = mesh.position.toArray();

      // グループ全員も同量移動
      if (item?.groupId) {
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dz = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;
        placedRef.current.forEach(p => {
          if (p.groupId === item.groupId && p.id !== selId) {
            const e2 = meshMapRef.current[p.id];
            if (!e2) return;
            e2.mesh.position.x += dx;
            e2.mesh.position.z += dz;
            const bb2 = new THREE.Box3().setFromObject(e2.mesh);
            if (bb2.min.y < 0) e2.mesh.position.y -= bb2.min.y;
            e2.line.position.copy(e2.mesh.position);
            p.position = e2.mesh.position.toArray();
          }
        });
      }

      // React state に反映
      pushHistoryRef.current();
      setPlaced(prev => prev.map(p => {
        const e2 = meshMapRef.current[p.id];
        if (!e2) return p;
        if (p.id === selId || (item?.groupId && p.groupId === item.groupId)) {
          return { ...p, position: e2.mesh.position.toArray() };
        }
        return p;
      }));

      // センター合致ガイドライン（キーボード移動後）
      clearCenterGuides(scene, centerGuideRef);
      const ancIdK = anchorRef.current;
      if (ancIdK) {
        let kCX, kCZ, kY;
        if (ancIdK.startsWith('grp:')) {
          const gid = ancIdK.slice(4);
          const mems = placedRef.current.filter(p => p.groupId === gid);
          if (mems.length) { const gc = computeGroupCenter(mems); kCX = gc.cx; kCZ = gc.cz; kY = gc.top; }
        } else {
          const ai = placedRef.current.find(p => p.id === ancIdK);
          if (ai) { kCX = ai.position[0]; kCZ = ai.position[2]; kY = ai.position[1]; }
        }
        if (kCX !== undefined) {
          const kMesh = entry.mesh;
          const thr = 0.0001;
          const lineY = (kY ?? 0) + 0.02;
          const guideLen = 5;
          const mkCL = (p1, p2, color) => {
            const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            const m = new THREE.LineBasicMaterial({ color });
            const ln = new THREE.Line(g, m);
            scene.add(ln); centerGuideRef.current.push(ln);
          };
          // X軸センター合致：赤線
          if (Math.abs(kMesh.position.x - kCX) < thr)
            mkCL(new THREE.Vector3(kCX, lineY, kCZ - guideLen), new THREE.Vector3(kCX, lineY, kCZ + guideLen), 0xff2020);
          // Z軸センター合致：青線
          if (Math.abs(kMesh.position.z - kCZ) < thr)
            mkCL(new THREE.Vector3(kCX - guideLen, lineY, kCZ), new THREE.Vector3(kCX + guideLen, lineY, kCZ), 0x2080ff);
        }
      }
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onUp);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      clearSnapGuides(scene, snapGuidesRef);
      clearCenterGuides(scene, centerGuideRef);
      clearMeasureObjs(scene, measureObjsRef);
      clearGroupCenterMarker(scene, groupCenterMarkerRef);
      axisArrowsRef.current.forEach(a => {
        scene.remove(a);
        a.line?.geometry?.dispose(); a.line?.material?.dispose();
        a.cone?.geometry?.dispose(); a.cone?.material?.dispose();
      });
      axisArrowsRef.current = [];
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onUp);
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  const setView = useCallback((dir) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    const refId = anchorRef.current || mainIdRef.current || selectedRef.current;
    let target, dist;

    if (refId && refId.startsWith('grp:')) {
      // グループ全体の中心とサイズを使う
      const gid = refId.slice(4);
      const members = placedRef.current.filter(p => p.groupId === gid);
      if (members.length) {
        const gc = computeGroupCenter(members);
        const cx = gc.cx;
        const cy = (gc.top + (gc.top - gc.size[1])) / 2; // 縦方向の中心
        const cz = gc.cz;
        target = new THREE.Vector3(cx, cy, cz);
        dist = Math.max(...gc.size) * 2 + 0.75;
      }
    }

    if (!target) {
      const item = refId ? placedRef.current.find(p => p.id === refId) : null;
      target = item
        ? new THREE.Vector3(...item.position)
        : new THREE.Vector3(0, 0.5, 0);
      dist = item ? Math.max(...item.size) * 4 + 1.5 : 3;
    }

    if (dir === 'front') cam.position.set(target.x, target.y, target.z + dist);
    else if (dir === 'side') cam.position.set(target.x + dist, target.y, target.z);
    else if (dir === 'top') cam.position.set(target.x, target.y + dist, target.z - 0.001);
    ctrl.target.copy(target);
    ctrl.update();
  }, []);

  const handleScaleChange = useCallback((val) => {
    scaleRef.current = val;
    setScale(val);
    setPlaced([]);
    setSelectedId(null);
    setAnchorId(null);
  }, []);

  // パーツをステージに追加
  const addPart = useCallback((part) => {
    pushHistory();
    const sc = scaleRef.current;
    const size = [part.width * sc, part.height * sc, part.depth * sc];
    const last = placedRef.current[placedRef.current.length - 1];
    let position;
    if (!last) {
      position = [size[0] / 2, size[1] / 2, size[2] / 2];
    } else {
      position = [
        last.position[0] + last.size[0] / 2 + size[0] / 2 + 0.1,
        size[1] / 2,
        last.position[2],
      ];
    }
    const item = { id: newPlacedId(), partId: part.id, name: part.name, size, position };
    setPlaced(prev => [...prev, item]);
    setSelectedId(item.id);
  }, []);

  // ロック状態チェック（refベースで常に最新）
  const isLockedRef = useCallback((id) => {
    if (lockedIdsRef.current.has(id)) return true;
    const item = placedRef.current.find(p => p.id === id);
    if (item?.groupId) {
      return placedRef.current.some(p => p.groupId === item.groupId && lockedIdsRef.current.has(p.id));
    }
    return false;
  }, []);

  // UI表示用（Reactステートベース）
  const isMovable = useCallback((id) => !isLockedRef(id), [isLockedRef]);

  // 選択パーツをアンカーに接合
  const attach = useCallback((dir) => {
    const selId = selectedRef.current;
    if (!selId || isLockedRef(selId)) return;
    const ancId = anchorRef.current;
    if (!ancId || selId === ancId) return;
    pushHistoryRef.current();
    const sel = placedRef.current.find(p => p.id === selId);
    if (!sel) return;

    // グループが基準の場合、バウンディングボックスから仮想アンカーを生成
    let anc;
    if (ancId.startsWith('grp:')) {
      const gid = ancId.slice(4);
      const members = placedRef.current.filter(p => p.groupId === gid);
      if (!members.length) return;
      const mins = [Infinity, Infinity, Infinity], maxs = [-Infinity, -Infinity, -Infinity];
      members.forEach(m => {
        [0, 1, 2].forEach(i => {
          mins[i] = Math.min(mins[i], m.position[i] - m.size[i] / 2);
          maxs[i] = Math.max(maxs[i], m.position[i] + m.size[i] / 2);
        });
      });
      anc = {
        position: [(mins[0]+maxs[0])/2, (mins[1]+maxs[1])/2, (mins[2]+maxs[2])/2],
        size: [maxs[0]-mins[0], maxs[1]-mins[1], maxs[2]-mins[2]],
      };
    } else {
      anc = placedRef.current.find(p => p.id === ancId);
    }
    if (!anc) return;
    const newPos = calcAttachPos(sel, anc, dir);
    if (sel.groupId) {
      const delta = [newPos[0] - sel.position[0], newPos[1] - sel.position[1], newPos[2] - sel.position[2]];
      setPlaced(prev => prev.map(p => {
        if (p.id === selId) return { ...p, position: newPos };
        if (p.groupId === sel.groupId) return { ...p, position: [p.position[0] + delta[0], p.position[1] + delta[1], p.position[2] + delta[2]] };
        return p;
      }));
    } else {
      setPlaced(prev => prev.map(p => p.id === selId ? { ...p, position: newPos } : p));
    }
  }, [isLockedRef]);

  const removePlaced = useCallback((id) => {
    pushHistory();
    setPlaced(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (anchorId === id) setAnchorId(null);
    if (mainId === id) setMainId(null);
    setLockedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [selectedId, anchorId, mainId]);

  const toggleLock = useCallback((id) => {
    setLockedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    needsRebuildRef.current = true;
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setPlaced(last.placed);
      rotationsRef.current = last.rotations;
      needsRebuildRef.current = true;
      return prev.slice(0, -1);
    });
  }, []);
  undoRef.current = undo;

  const reset = useCallback(() => {
    pushHistory();
    setPlaced([]);
    setSelectedId(null);
    setAnchorId(null);
    setMainId(null);
    setLockedIds(new Set());
    setCheckedIds(new Set());
    rotationsRef.current = {};
  }, [pushHistory]);

  // チェック切り替え
  const toggleCheck = useCallback((id) => {
    setCheckedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  // 選択中のパーツ・グループをまとめてグループ化
  const createGroup = useCallback(() => {
    // checkedIds には個別パーツID と "grp:xxx" の両方が入る
    const grpKeys = [...checkedIds].filter(id => id.startsWith('grp:'));
    const partIds = [...checkedIds].filter(id => !id.startsWith('grp:'));
    const unitCount = grpKeys.length + partIds.length;
    if (unitCount < 2) return;

    const newGid = `grp_${++groupCounter.current}`;
    pushHistory();
    // grp:xxx → そのグループの全メンバーを新グループに移す
    const mergeGids = new Set(grpKeys.map(k => k.slice(4)));
    setPlaced(prev => prev.map(p => {
      if (partIds.includes(p.id)) return { ...p, groupId: newGid };
      if (p.groupId && mergeGids.has(p.groupId)) return { ...p, groupId: newGid };
      return p;
    }));
    if (anchorId) {
      const ancIsGrp = typeof anchorId === 'string' && anchorId.startsWith('grp:');
      if (ancIsGrp && mergeGids.has(anchorId.slice(4))) setAnchorId(`grp:${newGid}`);
    }
    setCheckedIds(new Set());
  }, [checkedIds, anchorId, pushHistory]);

  // グループ解除
  const ungroup = useCallback((gid) => {
    pushHistory();
    setPlaced(prev => prev.map(p => p.groupId === gid ? { ...p, groupId: undefined } : p));
  }, [pushHistory]);

  // グループ複製
  const duplicateGroup = useCallback((gid) => {
    pushHistory();
    const members = placedRef.current.filter(p => p.groupId === gid);
    if (!members.length) return;
    const newGid = `grp_${++groupCounter.current}`;
    const offset = 0.3;
    const newItems = members.map(p => ({
      ...p,
      id: newPlacedId(),
      groupId: newGid,
      position: [p.position[0] + offset, p.position[1], p.position[2] + offset],
    }));
    // 回転も引き継ぐ
    newItems.forEach((item, i) => {
      const srcRot = rotationsRef.current[members[i].id];
      if (srcRot) rotationsRef.current[item.id] = { ...srcRot };
    });
    setPlaced(prev => [...prev, ...newItems]);
  }, []);

  // 保存・読み込み
  const saveProject = useCallback(() => {
    const data = {
      version: 1,
      parts,
      placed,
      rotations: rotationsRef.current,
      lockedIds: [...lockedIds],
      mainId,
      scale,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diy-project.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [parts, placed, lockedIds, mainId, scale]);

  const loadProject = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version) { alert('未対応のファイル形式です'); return; }
        if (data.parts && onSetParts) onSetParts(data.parts);
        if (data.placed) {
          // idCounter を読み込んだIDより大きい値に更新して衝突を防ぐ
          const maxNum = data.placed.reduce((mx, p) => {
            const n = parseInt(p.id.replace('p_', '')) || 0;
            return Math.max(mx, n);
          }, 0);
          idCounter = maxNum + 1;
          // groupCounter 更新
          const maxGrp = data.placed.reduce((mx, p) => {
            if (!p.groupId) return mx;
            const n = parseInt(p.groupId.replace('grp_', '')) || 0;
            return Math.max(mx, n);
          }, 0);
          groupCounter.current = maxGrp + 1;

          setPlaced(data.placed);
          rotationsRef.current = data.rotations || {};
        }
        setLockedIds(new Set(data.lockedIds || []));
        setMainId(data.mainId ?? null);
        if (data.scale) { setScale(data.scale); scaleRef.current = data.scale; }
        setSelectedId(null);
        setAnchorId(null);
        setCheckedIds(new Set());
        needsRebuildRef.current = true;
      } catch {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  }, [onSetParts]);

  const DEG5 = 5 * Math.PI / 180;
  const DEG15 = 15 * Math.PI / 180;
  const DEG90 = Math.PI / 2;

  const handleRotate = useCallback((axis, delta) => {
    const selId = selectedRef.current;
    if (!selId || isLockedRef(selId)) return;
    const key_map = { x: 'rx', y: 'ry', z: 'rz' };
    const rk = key_map[axis];
    const entry = meshMapRef.current[selId];
    if (!entry) return;
    const { mesh, line } = entry;
    const cur = rotationsRef.current[selId] || { rx: 0, ry: 0, rz: 0 };
    const next = { ...cur, [rk]: cur[rk] + delta };
    rotationsRef.current[selId] = next;
    mesh.rotation.set(next.rx, next.ry, next.rz);
    line.rotation.set(next.rx, next.ry, next.rz);
    // 床面スナップ
    const box = new THREE.Box3().setFromObject(mesh);
    if (box.min.y < 0) {
      const adj = -box.min.y;
      mesh.position.y += adj;
      line.position.y += adj;
      setPlaced(prev => prev.map(p =>
        p.id === selId ? { ...p, position: [mesh.position.x, mesh.position.y, mesh.position.z] } : p
      ));
    }
  }, []);

  const selectedPart = placed.find(p => p.id === selectedId);
  const anchorPart = placed.find(p => p.id === anchorId);

  return (
    <div style={s.root}>
      {/* サイドバー */}
      <div style={s.sidebar}>
        {/* 保存・読み込み */}
        <div style={{ ...s.sideSection, display: 'flex', gap: '4px' }}>
          <button
            style={{ flex: 1, background: '#5b8dd9', color: '#fff', fontSize: '11px', padding: '5px 0', borderRadius: '6px', fontWeight: '600' }}
            onClick={saveProject}
          >💾 保存</button>
          <button
            style={{ flex: 1, background: '#f5f0e8', color: '#7a5c30', border: '1px solid #d4c4a0', fontSize: '11px', padding: '5px 0', borderRadius: '6px', fontWeight: '600' }}
            onClick={() => fileInputRef.current?.click()}
          >📂 読込</button>
          <button
            style={{ flex: 1, background: measureMode ? '#ff8800' : '#f5f0e8', color: measureMode ? '#fff' : '#7a5c30', border: measureMode ? '1px solid #cc6600' : '1px solid #d4c4a0', fontSize: '11px', padding: '5px 0', borderRadius: '6px', fontWeight: '600' }}
            onClick={() => {
              const next = !measureMode;
              setMeasureMode(next);
              if (!next && sceneRef.current) {
                clearMeasureObjs(sceneRef.current, measureObjsRef);
                measurePointsRef.current = [];
                if (measureLabelRef.current) {
                  measureLabelRef.current.style.display = 'none';
                  measureLabelRef.current._midWorld = null;
                  measureLabelRef.current._distText = null;
                }
              }
            }}
          >📏 計測</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { loadProject(e.target.files[0]); e.target.value = ''; } }}
          />
        </div>

        {/* パーツ追加エリア */}
        <div style={s.sideSection}>
          <div style={s.sideTitle}>① パーツを追加</div>
          {parts.length === 0 && (
            <div style={{ fontSize: '12px', color: '#a0947e' }}>パーツ編集でパーツを追加してください</div>
          )}
          {parts.map(p => (
            <button key={p.id} style={s.partBtn} onClick={() => addPart(p)}>
              <span>{p.name}<br /><span style={{ fontSize: '10px', color: '#a0947e' }}>{p.width}×{p.height}×{p.depth}mm</span></span>
              <span style={s.addIcon}>＋</span>
            </button>
          ))}
        </div>

        {/* ステージ上のパーツ */}
        <div style={{ ...s.sideSection, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={s.sideTitle}>ステージ上のパーツ</div>
            {checkedIds.size >= 2 && (
              <button
                style={{ background: '#5b8dd9', color: '#fff', fontSize: '10px', padding: '2px 7px', borderRadius: '4px' }}
                onClick={createGroup}
              >グループ化</button>
            )}
          </div>
        </div>
        <div style={s.stageList}>
          {placed.length === 0 && (
            <div style={{ fontSize: '12px', color: '#b0a898', textAlign: 'center', marginTop: '20px' }}>
              まだパーツがありません
            </div>
          )}

          {/* グループ表示 */}
          {(() => {
            const groupIds = [...new Set(placed.filter(p => p.groupId).map(p => p.groupId))];
            const ungrouped = placed.filter(p => !p.groupId);
            return (
              <>
                {groupIds.map((gid, gi) => {
                  const members = placed.filter(p => p.groupId === gid);
                  const isGroupSel = members.some(p => p.id === selectedId);
                  const grpKey = `grp:${gid}`;
                  const isGrpMain = mainId === grpKey;
                  return (
                    <div key={gid} style={{ marginBottom: '6px', border: `1.5px solid ${isGrpMain ? '#e85050' : isGroupSel ? '#5b8dd9' : '#c8b89a'}`, borderRadius: '7px', background: isGrpMain ? '#fff0f0' : isGroupSel ? '#f0f6ff' : '#fdf8f0', overflow: 'hidden' }}>
                      {/* グループヘッダー */}
                      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 7px', background: isGrpMain ? '#fde0e0' : isGroupSel ? '#ddeaff' : '#f0e8d8', gap: '4px' }}>
                        <input
                          type="checkbox"
                          title="グループを選択（さらにグループ化）"
                          checked={checkedIds.has(grpKey)}
                          onChange={e => {
                            e.stopPropagation();
                            setCheckedIds(prev => {
                              const next = new Set(prev);
                              if (next.has(grpKey)) next.delete(grpKey); else next.add(grpKey);
                              return next;
                            });
                          }}
                          style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: isGrpMain ? '#c03030' : '#5a4030', flex: 1 }}>
                          {isGrpMain ? '⭐ ' : '📦 '}グループ {gi + 1}
                        </span>
                        <button
                          title={isGrpMain ? 'メイン解除' : 'メインに設定'}
                          style={{ background: isGrpMain ? '#e85050' : '#f5f0e8', color: isGrpMain ? '#fff' : '#8b7355', fontSize: '11px', padding: '1px 5px', borderRadius: '4px', border: isGrpMain ? '1px solid #c03030' : '1px solid #d4c4a0' }}
                          onClick={() => setMainId(isGrpMain ? null : grpKey)}
                        >{isGrpMain ? '★' : '☆'}</button>
                        <button
                          title="複製"
                          style={{ background: '#e8f4e8', color: '#2a7a2a', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a0d0a0' }}
                          onClick={() => duplicateGroup(gid)}
                        >🔁 複製</button>
                        <button
                          title="グループ解除"
                          style={{ background: '#f5f0e8', color: '#8b7355', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', border: '1px solid #d4c4a0' }}
                          onClick={() => ungroup(gid)}
                        >解除</button>
                      </div>
                      {/* グループメンバー */}
                      {members.map(p => {
                        const isSel = p.id === selectedId;
                        return (
                          <div key={p.id}
                            style={{ display: 'flex', alignItems: 'center', padding: '3px 7px 3px 14px', cursor: 'pointer', fontSize: '11px', color: '#3a2e22', background: isSel ? '#e0ecff' : 'transparent', borderTop: '1px solid #e8ddd0' }}
                            onClick={() => {
                              setSelectedId(p.id);
                              // メインがグループの場合：自分のグループでなければそのグループをアンカーに
                              if (mainId) {
                                const mainIsGrp = mainId.startsWith('grp:');
                                const sameGrp = mainIsGrp && mainId.slice(4) === gid;
                                if (!sameGrp && mainId !== p.id) setAnchorId(mainId);
                              }
                            }}
                          >
                            <span style={{ flex: 1 }}>{isSel ? '🔵 ' : '▪ '}{p.name}</span>
                            <button
                              title={lockedIds.has(p.id) ? 'ロック解除' : 'ロック'}
                              style={{ background: lockedIds.has(p.id) ? '#555' : 'transparent', color: lockedIds.has(p.id) ? '#fff' : '#7a5c30', padding: '0px 4px', fontSize: '10px', borderRadius: '3px', border: 'none' }}
                              onClick={e => { e.stopPropagation(); toggleLock(p.id); }}
                            >{lockedIds.has(p.id) ? '🔒' : '🔓'}</button>
                            <button style={{ ...s.removeBtn, padding: '0px 4px', fontSize: '10px' }} onClick={e => { e.stopPropagation(); removePlaced(p.id); }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* グループ外のパーツ */}
                {ungrouped.map((p, i) => {
                  const isSel = p.id === selectedId;
                  const isMn = p.id === mainId;
                  const isChk = checkedIds.has(p.id);
                  const itemStyle = isSel
                    ? { ...s.stageItem, ...s.stageItemSel }
                    : isMn
                    ? { ...s.stageItem, background: '#fde8e8', borderColor: '#e85050', fontWeight: '700' }
                    : { ...s.stageItem };
                  return (
                    <div key={p.id} style={{ ...itemStyle, paddingLeft: '4px' }}
                      onClick={() => {
                        setSelectedId(p.id);
                        if (mainId && mainId !== p.id) setAnchorId(mainId);
                      }}
                    >
                      <input type="checkbox" checked={isChk}
                        style={{ marginRight: '4px', flexShrink: 0, cursor: 'pointer' }}
                        onChange={() => toggleCheck(p.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <span style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
                        {isMn ? '⭐ ' : isSel ? '🔵 ' : ''}{p.name}
                        <span style={{ fontSize: '10px', color: '#a0947e', marginLeft: '3px' }}>#{placed.indexOf(p) + 1}</span>
                      </span>
                      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button
                          title={isMn ? 'メイン解除' : 'メインに設定'}
                          style={{ background: isMn ? '#e85050' : '#f5f0e8', color: isMn ? '#fff' : '#8b7355', padding: '1px 5px', fontSize: '11px', borderRadius: '4px', border: isMn ? '1px solid #c03030' : '1px solid #d4c4a0' }}
                          onClick={e => { e.stopPropagation(); setMainId(isMn ? null : p.id); }}
                        >{isMn ? '★' : '☆'}</button>
                        <button
                          title={lockedIds.has(p.id) ? 'ロック解除' : 'ロック'}
                          style={{ background: lockedIds.has(p.id) ? '#555' : '#f5f0e8', color: lockedIds.has(p.id) ? '#fff' : '#7a5c30', padding: '1px 5px', fontSize: '11px', borderRadius: '4px', border: lockedIds.has(p.id) ? '1px solid #333' : '1px solid #d4c4a0' }}
                          onClick={e => { e.stopPropagation(); toggleLock(p.id); }}
                        >{lockedIds.has(p.id) ? '🔒' : '🔓'}</button>
                        <button style={s.removeBtn} onClick={e => { e.stopPropagation(); removePlaced(p.id); }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>

        <NewPartForm onAdd={(partDef) => {
          // 親に新パーツを追加してもらい、即ステージにも乗せる
          const newPart = onAddPart ? onAddPart(partDef) : { ...partDef, id: `custom_${Date.now()}`, count: 1, thickness: partDef.depth };
          addPart(newPart);
        }} />

        {placed.length > 0 && (
          <div style={{ padding: '8px 10px', borderTop: '1px solid #e4dfd8' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                style={{ ...s.resetBtn, opacity: history.length ? 1 : 0.4 }}
                disabled={!history.length}
                onClick={undo}
                title="Ctrl+Z"
              >↩ 元に戻す</button>
              <button style={s.resetBtn} onClick={reset}>🗑 リセット</button>
            </div>
          </div>
        )}
      </div>

      {/* メインエリア */}
      <div style={s.center}>
        {/* 3Dキャンバス */}
        <div ref={mountRef} style={s.canvas}>
          {/* 座標表示（選択中） */}
          <div ref={coordDisplayRef} style={{
            position: 'absolute', bottom: '10px', left: '10px', zIndex: 10,
            background: 'rgba(20,16,12,0.72)', color: '#eee', borderRadius: '7px',
            padding: '5px 12px', fontSize: '13px', fontWeight: '700',
            fontFamily: 'monospace', letterSpacing: '0.5px', pointerEvents: 'none',
            display: 'none',
          }} />
          {/* 基準座標表示 */}
          <div ref={anchorCoordRef} style={{
            position: 'absolute', bottom: '40px', left: '10px', zIndex: 10,
            background: 'rgba(180,100,0,0.82)', color: '#fff', borderRadius: '7px',
            padding: '5px 12px', fontSize: '13px', fontWeight: '700',
            fontFamily: 'monospace', letterSpacing: '0.5px', pointerEvents: 'none',
            display: 'none',
          }} />
          {/* 基準座標 ON/OFF ボタン */}
          <button
            onClick={() => setShowAnchorCoord(v => !v)}
            style={{
              position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, fontSize: '11px', fontWeight: '700', padding: '4px 12px',
              borderRadius: '6px', border: '1px solid #c0a060',
              background: showAnchorCoord ? '#e87820' : 'rgba(40,30,20,0.7)',
              color: '#fff', cursor: 'pointer',
            }}
          >{showAnchorCoord ? '📍 基準座標 ON' : '📍 基準座標 OFF'}</button>

          {/* 計測ラベル（3D中点に追従） */}
          <div ref={measureLabelRef} style={{
            position: 'absolute', display: 'none', transform: 'translate(-50%, -120%)',
            background: 'rgba(0,0,0,0.75)', color: '#ffcc00', borderRadius: '7px',
            padding: '5px 12px', fontSize: '13px', fontWeight: '700',
            fontFamily: 'monospace', pointerEvents: 'none', zIndex: 15,
            textAlign: 'center', whiteSpace: 'nowrap', lineHeight: '1.6',
            border: '1px solid #ff8800',
          }} />

          {/* XYZ軸ラベルオーバーレイ */}
          <canvas ref={axisLabelCanvasRef} width={800} height={600}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />
          {/* 軸ギズモ */}
          <canvas ref={gizmoRef} width={72} height={72} style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 10, pointerEvents: 'none', borderRadius: '50%' }} />

          {/* 視点プリセット */}
          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
            {[
              { label: '正面', dir: 'front', icon: '⬛' },
              { label: '真横', dir: 'side', icon: '◀' },
              { label: '真上', dir: 'top', icon: '▲' },
            ].map(({ label, dir, icon }) => (
              <button key={dir} onClick={() => setView(dir)}
                style={{ background: 'rgba(255,255,255,0.92)', color: '#3a2e22', fontSize: '11px', fontWeight: '600', padding: '4px 9px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', border: '1px solid #d0c8b8', fontFamily: "'Noto Sans JP','Meiryo',sans-serif" }}
              >{label}</button>
            ))}
          </div>

          {/* 縮尺セレクター */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.92)', borderRadius: '10px', padding: '5px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontFamily: "'Noto Sans JP','BIZ UDPGothic','Meiryo',sans-serif", zIndex: 10 }}>
            <span style={{ fontSize: '11px', color: '#8b7355', fontWeight: '600', marginRight: '4px' }}>縮尺</span>
            {SCALE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleScaleChange(opt.value)}
                style={{
                  fontSize: '11px', fontWeight: '600', borderRadius: '6px',
                  padding: '3px 8px', cursor: 'pointer',
                  background: scale === opt.value ? '#5b8dd9' : '#f0ede8',
                  color: scale === opt.value ? '#fff' : '#5a4e3e',
                  border: scale === opt.value ? '1px solid #4a7dc9' : '1px solid #d0ccc8',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 操作パネル（下部） */}
        <div style={s.bottomBar}>
          {placed.length === 0 ? (
            <div style={s.hint}>
              <b>使い方</b>　① パーツを追加　② リストの「☆」でメイン材を設定（赤）　③ 他のパーツをクリック（青）→ 自動でメイン材が基準にセット　④ 方向ボタンで接合！　基準は手動でも変更できます。
            </div>
          ) : !selectedId ? (
            <div style={s.hint}>3D画面またはリストのパーツをクリックして選択してください（青くなります）</div>
          ) : (
            <div style={s.stepRow}>
              {/* 選択中 */}
              <div>
                <div style={s.stepLabel}>② 動かすパーツ</div>
                <div style={s.stepVal}>🔵 {selectedPart?.name}</div>
              </div>

              <div style={{ fontSize: '18px', color: '#c0b8a8' }}>→</div>

              {/* 基準パーツ選択 */}
              <div>
                <div style={s.stepLabel}>③ 基準パーツ（黄色）</div>
                <select
                  style={s.anchorSelect}
                  value={anchorId || ''}
                  onChange={e => setAnchorId(e.target.value || null)}
                >
                  <option value="">選択してください</option>
                  {/* 非グループパーツ */}
                  {placed.filter(p => p.id !== selectedId && !p.groupId).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} #{placed.indexOf(p) + 1}</option>
                  ))}
                  {/* グループ（選択パーツ自身のグループは除外） */}
                  {(() => {
                    const selGid = selectedPart?.groupId;
                    const seen = new Set();
                    let gi = 0;
                    return placed
                      .filter(p => p.groupId && p.groupId !== selGid && !seen.has(p.groupId) && (seen.add(p.groupId), true))
                      .map(p => (
                        <option key={`grp:${p.groupId}`} value={`grp:${p.groupId}`}>📦 グループ {++gi} ({placed.filter(m => m.groupId === p.groupId).length}点)</option>
                      ));
                  })()}
                </select>
              </div>

              <div style={{ fontSize: '18px', color: '#c0b8a8' }}>→</div>

              {/* 方向ボタン */}
              <div>
                <div style={s.stepLabel}>④ くっつける方向</div>
                <div style={s.dirGrid}>
                  {DIRS.map(dir => (
                    <button
                      key={dir.key}
                      style={{
                        ...s.dirBtn,
                        opacity: anchorId ? 1 : 0.4,
                        cursor: anchorId ? 'pointer' : 'not-allowed',
                      }}
                      disabled={!anchorId}
                      onClick={() => attach(dir)}
                      title={dir.label}
                    >
                      <span style={s.dirIcon}>{dir.icon}</span>
                      <span style={s.dirLbl}>{dir.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: '1px', background: '#e4dfd8', alignSelf: 'stretch' }} />

              {/* 選択部材サイズ表示 */}
              {(() => {
                const selItem = placed.find(p => p.id === selectedId);
                if (!selItem) return null;
                const sc = scale || 0.01;
                const rot = rotationsRef.current[selectedId] || { rx: 0, ry: 0, rz: 0 };
                // 回転後の実効寸法（rx=90°でYとZが入れ替わる等）
                let [sw, sh, sd] = selItem.size.map(v => Math.round(v / sc));
                const rx90 = Math.abs(Math.round(rot.rx / (Math.PI / 2))) % 2 === 1;
                const ry90 = Math.abs(Math.round(rot.ry / (Math.PI / 2))) % 2 === 1;
                const rz90 = Math.abs(Math.round(rot.rz / (Math.PI / 2))) % 2 === 1;
                if (rx90) { const t = sh; sh = sd; sd = t; }
                if (ry90) { const t = sw; sw = sd; sd = t; }
                if (rz90) { const t = sw; sw = sh; sh = t; }
                const dimStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '80px' };
                const valStyle = { fontSize: '13px', fontWeight: '700', color: '#3a2e22', fontFamily: 'monospace' };
                const lblStyle = { fontSize: '10px', color: '#8b7355' };
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#8b7355', textAlign: 'center' }}>サイズ (mm)</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={dimStyle}>
                        <span style={valStyle}>{sw}</span>
                        <span style={lblStyle}>幅 X</span>
                      </div>
                      <div style={dimStyle}>
                        <span style={valStyle}>{sh}</span>
                        <span style={lblStyle}>高 Y</span>
                      </div>
                      <div style={dimStyle}>
                        <span style={valStyle}>{sd}</span>
                        <span style={lblStyle}>奥 Z</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ width: '1px', background: '#e4dfd8', alignSelf: 'stretch' }} />

              {/* 位置調整（mm単位） */}
              <PositionEditor
                selectedId={selectedId}
                placed={placed}
                scale={scale}
                onMove={(id, newPosMm) => {
                  if (isLockedRef(id)) return;
                  const sc = scaleRef.current;
                  const pos3d = [newPosMm[0] * sc, newPosMm[1] * sc, newPosMm[2] * sc];
                  const movingItem = placedRef.current.find(p => p.id === id);
                  const gid = movingItem?.groupId;
                  const entry = meshMapRef.current[id];
                  if (entry) {
                    const delta = new THREE.Vector3(
                      pos3d[0] - entry.mesh.position.x,
                      pos3d[1] - entry.mesh.position.y,
                      pos3d[2] - entry.mesh.position.z
                    );
                    entry.mesh.position.set(...pos3d);
                    entry.line.position.set(...pos3d);
                    const box = new THREE.Box3().setFromObject(entry.mesh);
                    if (box.min.y < 0) { entry.mesh.position.y -= box.min.y; entry.line.position.y -= box.min.y; }
                    // グループ全員を同じ量移動
                    if (gid) {
                      placedRef.current.forEach(p => {
                        if (p.groupId === gid && p.id !== id) {
                          const e = meshMapRef.current[p.id];
                          if (!e) return;
                          e.mesh.position.add(delta);
                          e.line.position.copy(e.mesh.position);
                          const b2 = new THREE.Box3().setFromObject(e.mesh);
                          if (b2.min.y < 0) { e.mesh.position.y -= b2.min.y; e.line.position.y = e.mesh.position.y; }
                          p.position = e.mesh.position.toArray();
                        }
                      });
                    }
                  }
                  setPlaced(prev => prev.map(p => {
                    if (p.id === id) {
                      const e = meshMapRef.current[id];
                      return { ...p, position: e ? e.mesh.position.toArray() : pos3d };
                    }
                    if (gid && p.groupId === gid) {
                      const e = meshMapRef.current[p.id];
                      return e ? { ...p, position: e.mesh.position.toArray() } : p;
                    }
                    return p;
                  }));
                }}
              />

              <div style={{ width: '1px', background: '#e4dfd8', alignSelf: 'stretch' }} />

              {/* 回転 */}
              <div>
                <div style={s.stepLabel}>⑥ 回転</div>
                {[
                  { label: 'Y(水平)', axis: 'y' },
                  { label: 'X(前後)', axis: 'x' },
                  { label: 'Z(立て)', axis: 'z' },
                ].map(({ label, axis }) => {
                  const sb = { background: '#f0ede8', color: '#5a4e3e', border: '1px solid #d0ccc8', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' };
                  const bb = { ...sb, fontSize: '13px', padding: '2px 7px' };
                  return (
                    <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10px', color: '#8b7355', width: '42px', flexShrink: 0 }}>{label}</span>
                      <button style={bb} onClick={() => handleRotate(axis, -DEG90)}>↺90</button>
                      <button style={sb} onClick={() => handleRotate(axis, -DEG15)}>-15</button>
                      <button style={sb} onClick={() => handleRotate(axis, -DEG5)}>-5</button>
                      <button style={sb} onClick={() => handleRotate(axis, DEG5)}>+5</button>
                      <button style={sb} onClick={() => handleRotate(axis, DEG15)}>+15</button>
                      <button style={bb} onClick={() => handleRotate(axis, DEG90)}>↻90</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
