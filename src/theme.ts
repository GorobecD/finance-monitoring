export type ThemeGroup = "Класичні" | "За мотивами ігор" | "За мотивами фільмів";
type Family = "glow" | "flat";

export const THEMES: { id: string; name: string; desc: string; group: ThemeGroup; family: Family; sw: string[] }[] = [
  // Класичні
  { id: "neon", name: "Неон", desc: "Кіберпанк, світіння, HUD", group: "Класичні", family: "glow", sw: ["#04050d", "#00f0ff", "#ff2bd6", "#39ff88"] },
  // За мотивами ігор
  { id: "family", name: "Сімейна справа", desc: "У дусі Mafia, нуар 30-х", group: "За мотивами ігор", family: "flat", sw: ["#0b0e13", "#efe6d2", "#9e1b16", "#1a1a1a"] },
  { id: "abyss", name: "Глибоководна база", desc: "У дусі Subnautica", group: "За мотивами ігор", family: "glow", sw: ["#032336", "#6ee7ff", "#b388ff", "#6dffb0"] },
  // За мотивами фільмів
  { id: "sewer", name: "Каналізація", desc: "У дусі Черепашок-ніндзя", group: "За мотивами фільмів", family: "flat", sw: ["#1d2e21", "#7cff3a", "#2a7fff", "#ff8c1a"] },
  { id: "miami", name: "Маямі", desc: "У дусі GTA VI, неоновий захід", group: "За мотивами ігор", family: "glow", sw: ["#3a0f5e", "#ff3d8b", "#ffb547", "#2ee6d6"] },
];

export const THEME_GROUPS: ThemeGroup[] = ["Класичні", "За мотивами ігор", "За мотивами фільмів"];

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
