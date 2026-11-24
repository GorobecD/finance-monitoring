export type ThemeGroup = "Класичні" | "Ігрові" | "Ретро" | "Атмосферні" | "Стильові";
type Family = "glow" | "flat";

export const THEMES: { id: string; name: string; desc: string; group: ThemeGroup; family: Family; sw: string[] }[] = [
  // Класичні
  { id: "neon", name: "Неон", desc: "Кіберпанк, світіння, HUD", group: "Класичні", family: "glow", sw: ["#04050d", "#00f0ff", "#ff2bd6", "#39ff88"] },
  { id: "minimal", name: "Мінімал", desc: "Світла, чиста", group: "Класичні", family: "flat", sw: ["#f4f5f8", "#2f6bff", "#e5487d", "#12a46b"] },
  { id: "nord", name: "Північ", desc: "Спокійна темна", group: "Класичні", family: "flat", sw: ["#1f232b", "#88c0d0", "#b48ead", "#a3be8c"] },
  { id: "paper", name: "Папір", desc: "Записник, чорнило", group: "Класичні", family: "flat", sw: ["#f3ecdf", "#1f4e79", "#a23b3b", "#3d6b35"] },
  { id: "luxury", name: "Люкс", desc: "Чорне золото, преміум", group: "Класичні", family: "flat", sw: ["#0b0b0b", "#d4af37", "#f3e5ab", "#8c7a4b"] },
  { id: "ukraine", name: "Вишиванка", desc: "Синє-жовте, орнамент", group: "Класичні", family: "flat", sw: ["#f7f4ec", "#0057b7", "#ffd700", "#c8102e"] },
  // Ігрові
  { id: "miami", name: "Маямі", desc: "Неоновий захід, пальми", group: "Ігрові", family: "glow", sw: ["#3a0f5e", "#ff3d8b", "#ffb547", "#2ee6d6"] },
  { id: "blocks", name: "Блоки", desc: "Піксельний воксель-стиль", group: "Ігрові", family: "glow", sw: ["#866043", "#55ff55", "#5ce1e6", "#ffff55"] },
  { id: "cybercity", name: "Кібер-місто", desc: "Жовтий глітч, мегаполіс", group: "Ігрові", family: "glow", sw: ["#0a0a0f", "#fcee0a", "#00f0ff", "#ff003c"] },
  { id: "wasteland", name: "Пустка", desc: "Бурштиновий наручний ПК", group: "Ігрові", family: "glow", sw: ["#140c00", "#ffb000", "#ffd27a", "#7a5200"] },
  { id: "fantasy", name: "Фентезі RPG", desc: "Золото, пергамент, магія", group: "Ігрові", family: "flat", sw: ["#1a1410", "#e0b54a", "#b83a3a", "#5b8def"] },
  { id: "horror", name: "Хорор", desc: "Кров, туман, мерехтіння", group: "Ігрові", family: "flat", sw: ["#0b0606", "#a30d0d", "#d8cfc0", "#4a3b2f"] },
  { id: "racing", name: "Гонки", desc: "Карбон, спідометр, червоний", group: "Ігрові", family: "flat", sw: ["#111214", "#e10600", "#ffffff", "#ffb400"] },
  { id: "space", name: "Космос", desc: "HUD зорельота, зорі", group: "Ігрові", family: "glow", sw: ["#02030a", "#4fd1ff", "#ff9f43", "#a3ffd6"] },
  { id: "arcade", name: "Аркада", desc: "Автомат 80-х, лабіринт", group: "Ігрові", family: "glow", sw: ["#000000", "#ffd800", "#2121de", "#ff6ad5"] },
  // Ретро
  { id: "synthwave", name: "Синтвейв", desc: "Захід сонця 80-х, хром", group: "Ретро", family: "glow", sw: ["#2b0b55", "#ff3cac", "#ffd319", "#2de2e6"] },
  { id: "terminal", name: "Термінал", desc: "Зелений CRT-монітор", group: "Ретро", family: "glow", sw: ["#020a04", "#33ff66", "#ffb000", "#b6ffc8"] },
  { id: "matrix", name: "Матриця", desc: "Цифровий дощ", group: "Ретро", family: "glow", sw: ["#000000", "#00ff41", "#008f11", "#d0ffd8"] },
  { id: "retroos", name: "Ретро ОС", desc: "Сірі вікна 95-го", group: "Ретро", family: "flat", sw: ["#008080", "#c0c0c0", "#000080", "#ffffff"] },
  { id: "vaporwave", name: "Вейпорвейв", desc: "Пастельна ностальгія", group: "Ретро", family: "flat", sw: ["#ff9ad5", "#8ec5fc", "#3d2c6b", "#00e5d1"] },
  { id: "steampunk", name: "Стімпанк", desc: "Латунь, шкіра, заклепки", group: "Ретро", family: "flat", sw: ["#1c120a", "#c9973f", "#7a4a24", "#e8d3a3"] },
  // Атмосферні
  { id: "aurora", name: "Аврора", desc: "Скляні панелі, сяйво", group: "Атмосферні", family: "flat", sw: ["#3b1d8f", "#6ee7f9", "#f0abfc", "#86efac"] },
  { id: "lofi", name: "Lo-fi вечір", desc: "Пастельні сутінки, затишок", group: "Атмосферні", family: "flat", sw: ["#3b3366", "#f6a5c0", "#a5d8ff", "#ffd6a5"] },
  { id: "ocean", name: "Океан", desc: "Глибина, бульбашки", group: "Атмосферні", family: "flat", sw: ["#021b2e", "#2ee6c9", "#4fa3ff", "#ffcf70"] },
  { id: "forest", name: "Ліс", desc: "Мох, хвоя, туман", group: "Атмосферні", family: "flat", sw: ["#0f1f17", "#8fd694", "#e8c07d", "#6bb3a8"] },
  { id: "sakura", name: "Сакура", desc: "Японська весна, туш", group: "Атмосферні", family: "flat", sw: ["#fff5f7", "#e85d8a", "#2b2b2b", "#c8102e"] },
  { id: "mars", name: "Марс", desc: "Червона пустеля, пил", group: "Атмосферні", family: "flat", sw: ["#2a0f08", "#ff7a3d", "#ffc796", "#9fd3c7"] },
  // Стильові
  { id: "comic", name: "Комікс", desc: "Поп-арт, растр, контур", group: "Стильові", family: "flat", sw: ["#ffe14d", "#e63946", "#1d4ed8", "#111111"] },
  { id: "brutal", name: "Бруталізм", desc: "Товсті рамки, жорсткі тіні", group: "Стильові", family: "flat", sw: ["#f5f0e6", "#ff6b6b", "#4dabf7", "#ffd43b"] },
  { id: "blueprint", name: "Креслення", desc: "Синька, інженерна сітка", group: "Стильові", family: "flat", sw: ["#0d3b66", "#ffffff", "#9ad1ff", "#ffd166"] },
  { id: "contrast", name: "Контраст", desc: "Максимальна читабельність", group: "Стильові", family: "flat", sw: ["#000000", "#ffffff", "#ffff00", "#00ffff"] },
];

export const THEME_GROUPS: ThemeGroup[] = ["Класичні", "Ігрові", "Ретро", "Атмосферні", "Стильові"];

export function applyTheme(id: string | undefined) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  const el = document.documentElement;
  if (el.dataset.theme !== t.id) el.dataset.theme = t.id;
  if (el.dataset.family !== t.family) el.dataset.family = t.family;
}

export const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Neon category colors (defaults + picker) -> per-theme palette slot (--cat-N). */
const NEON_CAT = [
  "#00f0ff", "#36c5ff", "#39ff88", "#7cffcb", "#5dffea", "#4d9dff", "#ff2bd6", "#c03bff",
  "#ff6ad5", "#9d6bff", "#ff8a3d", "#ffd23d", "#a0a8c0", "#f5ff3b", "#ff3b5c",
];
// which theme accent each neon slot maps to when a theme has no explicit palette
const SLOT_BASE = ["--cyan", "--cyan", "--green", "--green", "--cyan", "--cyan", "--magenta", "--magenta", "--magenta", "--magenta", "--yellow", "--yellow", "--muted", "--yellow", "--red"];
const SLOT_MIX = [0, 0.35, 0, 0.35, 0.55, -0.3, 0, -0.3, 0.35, 0.55, -0.25, 0.3, 0, 0.55, 0];

function parseColor(c: string): [number, number, number] | null {
  const h = c.match(/^#([0-9a-f]{6})/i);
  if (h) return [0, 2, 4].map((i) => parseInt(h[1].slice(i, i + 2), 16)) as [number, number, number];
  const r = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return r ? [Number(r[1]), Number(r[2]), Number(r[3])] : null;
}
function shade(c: string, amt: number, toward: string) {
  const a = parseColor(c);
  const b = parseColor(toward);
  if (!a || !b || amt === 0) return c;
  const t = Math.abs(amt);
  const target = amt > 0 ? b : ([0, 0, 0] as [number, number, number]);
  const m = a.map((v, i) => Math.round(v + (target[i] - v) * t));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
}

export function catColor(hex: string | undefined) {
  if (!hex) return cssVar("--muted");
  const i = NEON_CAT.indexOf(hex.toLowerCase());
  if (i < 0 || document.documentElement.dataset.theme === "neon") return hex;
  const explicit = cssVar(`--cat-${i}`);
  if (explicit) return explicit;
  return shade(cssVar(SLOT_BASE[i]) || hex, SLOT_MIX[i], cssVar("--text") || "#ffffff");
}

/** Chart colors for the current theme. Call during render (theme attr is set before children render). */
export function chartTheme() {
  const v = (n: string) => cssVar(n);
  const tip = {
    contentStyle: { background: v("--bg2"), border: `1px solid ${v("--line")}`, borderRadius: 8, fontFamily: v("--body"), color: v("--text") },
    labelStyle: { color: v("--cyan") },
    itemStyle: { color: v("--text") },
    cursor: { fill: v("--chart-grid") },
  };
  return { tip, grid: v("--chart-grid"), muted: v("--muted"), line: v("--line"), green: v("--green"), magenta: v("--magenta"), yellow: v("--yellow"), cyan: v("--cyan") };
}
