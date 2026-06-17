// ホームセンターで売られているDIY木材データ（単位: mm）

export const LUMBER_DATA = {
  categories: [
    {
      id: 'twoby',
      label: 'ツーバイ材（SPF材）',
      icon: '🪵',
      note: '実寸サイズです。2×4と表記でも実際は38×89mmです。',
      items: [
        { name: '1×4', thickness: 19, width: 89, lengths: [1820, 2440] },
        { name: '1×6', thickness: 19, width: 140, lengths: [1820, 2440] },
        { name: '2×2', thickness: 38, width: 38, lengths: [910, 1820, 2440] },
        { name: '2×4', thickness: 38, width: 89, lengths: [910, 1820, 2440, 3640] },
        { name: '2×6', thickness: 38, width: 140, lengths: [910, 1820, 2440, 3640] },
        { name: '2×8', thickness: 38, width: 184, lengths: [1820, 2440, 3640] },
        { name: '2×10', thickness: 38, width: 235, lengths: [1820, 2440, 3640] },
        { name: '2×12', thickness: 38, width: 286, lengths: [1820, 2440, 3640] },
        { name: '4×4', thickness: 89, width: 89, lengths: [910, 1820] },
      ],
    },
    {
      id: 'panel',
      label: '集成材・合板（板材）',
      icon: '📋',
      note: 'サブロク板(900×1800mm)が基本サイズです。',
      items: [
        { name: 'パイン集成材', thicknesses: [12, 15, 18, 24], sizes: [[450, 600], [450, 900], [600, 1800]] },
        { name: 'シナベニヤ', thicknesses: [4, 5.5, 9, 12, 15, 21], sizes: [[900, 1800]] },
        { name: 'ラワンベニヤ', thicknesses: [4, 9, 12, 15, 18], sizes: [[900, 1800]] },
        { name: 'コンパネ（構造用合板）', thicknesses: [12], sizes: [[900, 1800]] },
        { name: 'MDF', thicknesses: [9, 12, 15, 18], sizes: [[900, 1800]] },
        { name: 'OSB合板', thicknesses: [9, 12], sizes: [[900, 1800]] },
      ],
    },
    {
      id: 'cedar',
      label: '杉材（無垢材）',
      icon: '🌲',
      note: '天然木。反りや節があります。',
      items: [
        { name: '杉板 12×90', thickness: 12, width: 90, lengths: [900, 1820] },
        { name: '杉板 12×105', thickness: 12, width: 105, lengths: [900, 1820] },
        { name: '杉板 18×90', thickness: 18, width: 90, lengths: [900, 1820] },
        { name: '杉板 18×105', thickness: 18, width: 105, lengths: [900, 1820] },
        { name: '杉角材 30×30', thickness: 30, width: 30, lengths: [900, 1820] },
      ],
    },
  ],
};

// カテゴリIDから情報を取得
export function getCategoryById(id) {
  return LUMBER_DATA.categories.find(c => c.id === id);
}
