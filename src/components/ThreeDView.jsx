import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// =========================================================
// 定数・ヘルパー
// =========================================================
const COLORS = [
  0xd4a574, 0xc8956a, 0xe2b882, 0xb87d5a,
  0xf0c896, 0xa0725a, 0xcc9966, 0xe8d0a0,
  0x9a7055, 0xd4b896, 0xc07040, 0xe8c07a,
];
// 縮尺オプション
const SCALE_OPTIONS = [
  { label: '1:20',  value: 0.05  },
  { label: '1:50',  value: 0.02  },
  { label: '1:100', value: 0.01  },
  { label: '1:200', value: 0.005 },
];

// =========================================================
// 配置ロジック
// =========================================================
function computePositions(parts, templateId, sc) {
  if (templateId === 'bookshelf' || templateId === 'storage') return layoutBookshelf(parts, sc);
  if (templateId === 'table') return layoutTable(parts, sc);
  if (templateId === 'chair') return layoutChair(parts, sc);
  if (templateId === 'shelf') return layoutShelf(parts, sc);
  return layoutGeneric(parts, sc);
}

function layoutBookshelf(parts, sc) {
  const result = [];
  const side = parts.find(p => p.name.includes('側板'));
  const shelf = parts.find(p => p.name.includes('棚板'));
  const topBot = parts.find(p => p.name.includes('天板') || p.name.includes('底板'));
  const back = parts.find(p => p.name.includes('背板'));
  if (!side) return layoutGeneric(parts, sc);

  const H = side.height * sc, D = side.width * sc, T = side.depth * sc;
  const W = topBot ? (topBot.width + side.depth * 2) * sc : H * 0.5;

  for (let i = 0; i < 2; i++)
    result.push({ key: `${side.id}_${i}`, id: side.id, position: [i === 0 ? T / 2 : W - T / 2, H / 2, D / 2], size: [T, H, D] });

  if (topBot) {
    const tw = topBot.width * sc, td = topBot.height * sc;
    [0, H - T].forEach((y, i) =>
      result.push({ key: `${topBot.id}_${i}`, id: topBot.id, position: [W / 2, y + T / 2, td / 2], size: [tw, T, td] }));
  }
  if (shelf) {
    const sw = shelf.width * sc, sd = shelf.height * sc, st = shelf.depth * sc;
    const usableH = H - T * 2;
    for (let i = 0; i < shelf.count; i++) {
      const y = T + (usableH / (shelf.count + 1)) * (i + 1);
      result.push({ key: `${shelf.id}_${i}`, id: shelf.id, position: [W / 2, y, sd / 2], size: [sw, st, sd] });
    }
  }
  if (back) {
    const bt = Math.max(back.depth * sc, 0.06);
    result.push({ key: `${back.id}_0`, id: back.id, position: [W / 2, H / 2, T + bt / 2], size: [back.width * sc, back.height * sc, bt] });
  }
  return result;
}

function layoutTable(parts, sc) {
  const result = [];
  const top = parts.find(p => p.name.includes('天板'));
  const leg = parts.find(p => p.name.includes('脚'));
  const apron = parts.find(p => p.name.includes('幕板'));
  if (!top || !leg) return layoutGeneric(parts, sc);

  const TW = top.width * sc, TD = top.height * sc, TT = top.depth * sc;
  const LW = leg.width * sc, LH = leg.height * sc;
  result.push({ key: `${top.id}_0`, id: top.id, position: [TW / 2, LH + TT / 2, TD / 2], size: [TW, TT, TD] });
  [[LW / 2, LW / 2], [TW - LW / 2, LW / 2], [LW / 2, TD - LW / 2], [TW - LW / 2, TD - LW / 2]].forEach(([x, z], i) =>
    result.push({ key: `${leg.id}_${i}`, id: leg.id, position: [x, LH / 2, z], size: [LW, LH, LW] }));
  if (apron) {
    const AH = apron.height * sc, AT = apron.depth * sc, AY = LH - AH / 2;
    result.push({ key: `${apron.id}_0`, id: apron.id, position: [TW / 2, AY, LW / 2], size: [TW - LW * 2, AH, AT] });
    result.push({ key: `${apron.id}_1`, id: apron.id, position: [TW / 2, AY, TD - LW / 2], size: [TW - LW * 2, AH, AT] });
  }
  return result;
}

function layoutChair(parts, sc) {
  const result = [];
  const seat = parts.find(p => p.name.includes('座面'));
  const leg = parts.find(p => p.name.includes('脚'));
  const back = parts.find(p => p.name.includes('背もたれ'));
  if (!seat || !leg) return layoutGeneric(parts, sc);

  const SW = seat.width * sc, SD = seat.height * sc, ST = seat.depth * sc;
  const LW = leg.width * sc, LH = leg.height * sc;
  const seatY = LH + ST / 2;
  result.push({ key: `${seat.id}_0`, id: seat.id, position: [SW / 2, seatY, SD / 2], size: [SW, ST, SD] });
  [[LW / 2, LW / 2], [SW - LW / 2, LW / 2], [LW / 2, SD - LW / 2], [SW - LW / 2, SD - LW / 2]].forEach(([x, z], i) =>
    result.push({ key: `${leg.id}_${i}`, id: leg.id, position: [x, LH / 2, z], size: [LW, LH, LW] }));
  if (back) {
    const BH = back.height * sc, BT = back.depth * sc;
    result.push({ key: `${back.id}_0`, id: back.id, position: [SW / 2, seatY + ST / 2 + BH / 2, BT / 2], size: [SW, BH, BT] });
  }
  return result;
}

function layoutShelf(parts, sc) {
  const result = [];
  const board = parts.find(p => p.name.includes('棚板'));
  const side = parts.find(p => p.name.includes('側板') || p.name.includes('受け'));
  if (!board) return layoutGeneric(parts, sc);

  const BW = board.width * sc, BD = board.height * sc, BT = board.depth * sc;
  const SH = side ? side.height * sc : 0.2, ST = side ? side.depth * sc : BT;
  if (side) {
    [ST / 2, BW - ST / 2].forEach((x, i) =>
      result.push({ key: `${side.id}_${i}`, id: side.id, position: [x, SH / 2, BD / 2], size: [ST, SH, BD] }));
  }
  result.push({ key: `${board.id}_0`, id: board.id, position: [BW / 2, SH + BT / 2, BD / 2], size: [BW, BT, BD] });
  return result;
}

function layoutGeneric(parts, sc) {
  const result = [];
  let offsetX = 0;
  parts.forEach(p => {
    for (let c = 0; c < p.count; c++) {
      const w = p.width * sc, h = p.height * sc, d = p.depth * sc;
      result.push({ key: `${p.id}_${c}`, id: p.id, position: [offsetX + w / 2, h / 2, d / 2], size: [w, h, d] });
      offsetX += w + 0.15;
    }
  });
  return result;
}

// =========================================================
// パーツ詳細パネル
// =========================================================
const DEG5 = 5 * Math.PI / 180;
const DEG15 = 15 * Math.PI / 180;
const DEG90 = Math.PI / 2;

function PartDetailPanel({ part, position, onClose, onRotate }) {
  if (!part) return null;
  const posText = position
    ? `X: ${(position.x / SC).toFixed(0)}  Y: ${(position.y / SC).toFixed(0)}  Z: ${(position.z / SC).toFixed(0)} mm`
    : null;

  const smallBtn = {
    background: '#f0ede8', color: '#5a4e3e', border: '1px solid #d0ccc8',
    borderRadius: '5px', padding: '3px 7px', fontSize: '11px', cursor: 'pointer', fontWeight: '600',
  };
  const bigBtn = {
    ...smallBtn, fontSize: '14px', padding: '3px 9px',
  };

  const RotRow = ({ label, axis }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
      <span style={{ fontSize: '11px', color: '#8b7355', width: '44px', flexShrink: 0 }}>{label}</span>
      <button style={bigBtn} onClick={() => onRotate(axis, -DEG90)} title="-90°">↺90</button>
      <button style={smallBtn} onClick={() => onRotate(axis, -DEG15)} title="-15°">-15</button>
      <button style={smallBtn} onClick={() => onRotate(axis, -DEG5)} title="-5°">-5</button>
      <button style={smallBtn} onClick={() => onRotate(axis, DEG5)} title="+5°">+5</button>
      <button style={smallBtn} onClick={() => onRotate(axis, DEG15)} title="+15°">+15</button>
      <button style={bigBtn} onClick={() => onRotate(axis, DEG90)} title="+90°">↻90</button>
    </div>
  );

  return (
    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.96)', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '240px', fontSize: '13px', color: '#3a2e22', fontFamily: "'Noto Sans JP','BIZ UDPGothic','Yu Gothic UI','Meiryo',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontWeight: '700', fontSize: '15px' }}>{part.name}</div>
        <button onClick={onClose} style={{ background: '#f0ede8', color: '#6b5f50', padding: '2px 8px', fontSize: '13px', borderRadius: '5px' }}>✕</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {[['幅', part.width], ['高さ', part.height], ['深さ(D)', part.depth], ['厚さ', part.thickness], ['個数', part.count]].map(([l, v], i) => (
            <tr key={i}>
              <td style={{ padding: '4px 8px 4px 0', color: '#8b7355', fontWeight: '600' }}>{l}</td>
              <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '700', fontSize: '15px', color: '#3a6bb5' }}>{v}</td>
              <td style={{ padding: '4px 0 4px 4px', color: '#8b7355', fontSize: '12px' }}>{i < 4 ? 'mm' : '枚'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {posText && <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e4dfd8', fontSize: '11px', color: '#8b7355' }}>位置: {posText}</div>}
      <div style={{ marginTop: '6px', fontSize: '11px', color: '#a0947e' }}>体積: {((part.width * part.height * part.depth) / 1e6).toFixed(3)} L</div>
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e4dfd8' }}>
        <div style={{ fontSize: '11px', color: '#8b7355', marginBottom: '4px', fontWeight: '600' }}>回転 (°)</div>
        <RotRow label="Y軸(水平)" axis="y" />
        <RotRow label="X軸(前後)" axis="x" />
        <RotRow label="Z軸(立て)" axis="z" />
      </div>
    </div>
  );
}

// =========================================================
// メインコンポーネント
// =========================================================
export default function ThreeDView({ parts, templateId, selectedPartId, onSelectPart }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const meshMapRef = useRef({});
  const overridesRef = useRef({});
  const rotationsRef = useRef({});
  const dragRef = useRef(null);

  // アニメーションループからアクセスするため最新値を ref に保持
  const meshItemsRef = useRef([]);
  const colorMapRef = useRef({});
  const selectedPartIdRef = useRef(selectedPartId);
  const needsRebuildRef = useRef(true);
  const isFirstBuildRef = useRef(true);

  const [dragging, setDragging] = useState(false);
  const [selectedPos, setSelectedPos] = useState(null);
  const [scale, setScale] = useState(0.01);
  const scaleRef = useRef(0.01);

  const meshItems = useMemo(() => computePositions(parts, templateId, scale), [parts, templateId, scale]);
  const colorMap = useMemo(() => {
    const map = {};
    let ci = 0;
    meshItems.forEach(item => { if (!map[item.id]) map[item.id] = COLORS[ci++ % COLORS.length]; });
    return map;
  }, [meshItems]);

  // props が変わったら ref を更新してリビルドをフラグ
  meshItemsRef.current = meshItems;
  colorMapRef.current = colorMap;
  selectedPartIdRef.current = selectedPartId;

  useEffect(() => {
    needsRebuildRef.current = true;
  }, [meshItems, selectedPartId, colorMap]);

  // =========================================================
  // Three.js 初期化 & アニメーションループ（マウント時のみ）
  // =========================================================
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || window.innerWidth;
    const H = el.clientHeight || window.innerHeight - 96;

    // シーン
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd6cfc4);
    scene.fog = new THREE.Fog(0xd6cfc4, 25, 60);
    sceneRef.current = scene;

    // カメラ
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
    camera.position.set(4, 3, 5);
    cameraRef.current = camera;

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ライト（作業場風：天井蛍光灯＋サイド光）
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.55));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.35);
    fill.position.set(-6, 4, -4);
    scene.add(fill);

    // 床面（コンクリート調）
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xb8b0a0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.001;
    floor.receiveShadow = true;
    scene.add(floor);

    // グリッド（作業台の目盛り風）
    scene.add(new THREE.GridHelper(30, 30, 0x999080, 0xaaa090));

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    // リサイズ
    const onResize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight - 96;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // リビルド関数（ループ内から呼ばれる）
    const rebuildMeshes = () => {
      const items = meshItemsRef.current;
      const cmap = colorMapRef.current;
      const selId = selectedPartIdRef.current;

      Object.values(meshMapRef.current).forEach(({ mesh, line }) => {
        scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose();
        scene.remove(line); line.geometry.dispose(); line.material.dispose();
      });
      meshMapRef.current = {};

      items.forEach(item => {
        const [w, h, d] = item.size;
        const baseColor = cmap[item.id] || 0xd4a574;
        const isSelected = item.id === selId;
        const geo = new THREE.BoxGeometry(
          Math.max(w, 0.001), Math.max(h, 0.001), Math.max(d, 0.001)
        );
        const mat = new THREE.MeshLambertMaterial({ color: isSelected ? 0x4a90d9 : baseColor });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.userData.partId = item.id;
        mesh.userData.itemKey = item.key;

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isSelected ? 0x1a5aaa : 0x7a6050 }));

        const pos = (overridesRef.current[item.key] || new THREE.Vector3(...item.position)).clone();
        mesh.position.copy(pos);
        line.position.copy(pos);

        const rot = rotationsRef.current[item.key] || { rx: 0, ry: 0, rz: 0 };
        mesh.rotation.set(rot.rx, rot.ry, rot.rz);
        line.rotation.set(rot.rx, rot.ry, rot.rz);

        // 回転込みのバウンディングボックスで床面スナップ
        const bbox = new THREE.Box3().setFromObject(mesh);
        if (bbox.min.y < 0) {
          const adj = -bbox.min.y;
          mesh.position.y += adj;
          line.position.y += adj;
          overridesRef.current[item.key] = mesh.position.clone();
        }

        scene.add(mesh);
        scene.add(line);
        meshMapRef.current[item.key] = { mesh, line, baseColor };
      });

      // 初回のみカメラフィット
      if (isFirstBuildRef.current && items.length > 0) {
        isFirstBuildRef.current = false;
        const box = new THREE.Box3();
        Object.values(meshMapRef.current).forEach(({ mesh }) => box.expandByObject(mesh));
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          const dist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.9;
          camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.7);
          camera.lookAt(center);
          controls.target.copy(center);
        }
      }
    };

    // アニメーションループ
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (needsRebuildRef.current) {
        needsRebuildRef.current = false;
        rebuildMeshes();
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      meshMapRef.current = {};
      isFirstBuildRef.current = true;
      needsRebuildRef.current = true;
    };
  }, []);

  // =========================================================
  // ドラッグ操作
  // =========================================================
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const intersectPt = new THREE.Vector3();
    const offset = new THREE.Vector3();

    const getNDC = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onDown = (e) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || e.button !== 0) return;
      getNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(meshMapRef.current).map(m => m.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (!hits.length) return;

      const mesh = hits[0].object;
      onSelectPart(mesh.userData.partId);
      controls.enabled = false;
      setDragging(true);

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
      dragRef.current = { key: mesh.userData.itemKey, mesh, isY };
    };

    const onMove = (e) => {
      if (!dragRef.current || !cameraRef.current) return;
      getNDC(e);
      raycaster.setFromCamera(mouse, cameraRef.current);
      if (!raycaster.ray.intersectPlane(dragPlane, intersectPt)) return;

      const { key, mesh, isY } = dragRef.current;
      const np = intersectPt.clone().sub(offset);
      if (isY) {
        mesh.position.y = np.y;
        // バウンディングボックスでグリッド(y=0)未満に行かないよう補正
        const box = new THREE.Box3().setFromObject(mesh);
        if (box.min.y < 0) mesh.position.y -= box.min.y;
      } else {
        mesh.position.x = np.x;
        mesh.position.z = np.z;
      }

      const entry = meshMapRef.current[key];
      if (entry) entry.line.position.copy(mesh.position);
      overridesRef.current[key] = mesh.position.clone();
      setSelectedPos(mesh.position.clone());
    };

    const onUp = () => {
      if (dragRef.current) {
        if (controlsRef.current) controlsRef.current.enabled = true;
        dragRef.current = null;
        setDragging(false);
      }
    };

    const onClick = (e) => {
      if (!dragRef.current && cameraRef.current) {
        getNDC(e);
        raycaster.setFromCamera(mouse, cameraRef.current);
        const hits = raycaster.intersectObjects(Object.values(meshMapRef.current).map(m => m.mesh));
        if (!hits.length) onSelectPart(null);
      }
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('click', onClick);
    };
  }, [onSelectPart]);

  // =========================================================
  // 配置リセット・回転
  // =========================================================
  const handleReset = useCallback(() => {
    overridesRef.current = {};
    rotationsRef.current = {};
    isFirstBuildRef.current = true;
    needsRebuildRef.current = true;
    setSelectedPos(null);
  }, []);

  const handleScaleChange = useCallback((val) => {
    scaleRef.current = val;
    overridesRef.current = {};
    rotationsRef.current = {};
    isFirstBuildRef.current = true;
    setSelectedPos(null);
    setScale(val); // meshItems 再計算 → needsRebuild は useEffect で立つ
  }, []);

  const handleRotate = useCallback((axis, delta) => {
    if (!selectedPartId) return;
    const key_map = { x: 'rx', y: 'ry', z: 'rz' };
    Object.entries(meshMapRef.current).forEach(([key, { mesh, line }]) => {
      if (mesh.userData.partId !== selectedPartId) return;
      const cur = rotationsRef.current[key] || { rx: 0, ry: 0, rz: 0 };
      const rk = key_map[axis];
      const next = { ...cur, [rk]: cur[rk] + delta };
      rotationsRef.current[key] = next;
      mesh.rotation.set(next.rx, next.ry, next.rz);
      line.rotation.set(next.rx, next.ry, next.rz);
      // 回転後に床面貫通を補正
      const box = new THREE.Box3().setFromObject(mesh);
      if (box.min.y < 0) {
        const adj = -box.min.y;
        mesh.position.y += adj;
        line.position.y += adj;
        overridesRef.current[key] = mesh.position.clone();
      }
    });
    setSelectedPos(prev => {
      const entry = Object.values(meshMapRef.current).find(
        ({ mesh }) => mesh.userData.partId === selectedPartId
      );
      return entry ? entry.mesh.position.clone() : prev;
    });
  }, [selectedPartId]);

  const selectedPart = parts.find(p => p.id === selectedPartId) || null;
  const cursor = dragging ? 'grabbing' : (selectedPartId ? 'grab' : 'default');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor }} />

      <PartDetailPanel
        part={selectedPart}
        position={selectedPos}
        onClose={() => { onSelectPart(null); setSelectedPos(null); }}
        onRotate={handleRotate}
      />

      <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.88)', borderRadius: '20px', padding: '5px 16px', fontSize: '12px', color: '#6b5f50', fontFamily: "'Noto Sans JP','BIZ UDPGothic','Meiryo',sans-serif", pointerEvents: 'none' }}>
          {dragging ? '🖱️ ドラッグ中 (Shift = 上下移動)' : 'ドラッグで視点回転 ／ パーツクリックで選択・移動 ／ Shift+ドラッグで高さ調整'}
        </div>
        <button onClick={handleReset} style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #d0ccc8', borderRadius: '16px', padding: '5px 14px', fontSize: '12px', color: '#6b5f50', cursor: 'pointer', fontFamily: "'Noto Sans JP','BIZ UDPGothic','Meiryo',sans-serif" }}>
          ↺ 配置リセット
        </button>
      </div>

      {/* 縮尺セレクター */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.92)', borderRadius: '10px', padding: '5px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontFamily: "'Noto Sans JP','BIZ UDPGothic','Meiryo',sans-serif" }}>
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

      {!selectedPart && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.78)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#8b7355', pointerEvents: 'none', fontFamily: "'Noto Sans JP','BIZ UDPGothic','Meiryo',sans-serif" }}>
          パーツをクリックで選択 / ドラッグで移動
        </div>
      )}
    </div>
  );
}
