export type ThemeId = "neon" | "synthwave" | "terminal" | "aurora" | "nord" | "minimal" | "paper";

export const THEMES: { id: ThemeId; name: string; desc: string; sw: string[] }[] = [
  { id: "neon", name: "Неон", desc: "Кіберпанк, світіння, HUD", sw: ["#04050d", "#00f0ff", "#ff2bd6", "#39ff88"] },
  { id: "synthwave", name: "Синтвейв", desc: "Захід сонця 80-х, хром", sw: ["#2b0b55", "#ff3cac", "#ffd319", "#2de2e6"] },
  { id: "terminal", name: "Термінал", desc: "Зелений CRT-монітор", sw: ["#020a04", "#33ff66", "#ffb000", "#b6ffc8"] },
  { id: "aurora", name: "Аврора", desc: "Скляні панелі, сяйво", sw: ["#3b1d8f", "#6ee7f9", "#f0abfc", "#86efac"] },
  { id: "nord", name: "Північ", desc: "Спокійна темна", sw: ["#1f232b", "#88c0d0", "#b48ead", "#a3be8c"] },
  { id: "minimal", name: "Мінімал", desc: "Світла, чиста", sw: ["#f4f5f8", "#2f6bff", "#e5487d", "#12a46b"] },
  { id: "paper", name: "Папір", desc: "Записник, чорнило", sw: ["#f3ecdf", "#1f4e79", "#a23b3b", "#3d6b35"] },
];

export function applyTheme(id: string | undefined) {
  const t = id || "neon";
  if (document.documentElement.dataset.theme !== t) document.documentElement.dataset.theme = t;
}

export const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Neon category colors (defaults + picker) -> per-theme palette slot (--cat-N). */
const NEON_CAT = [
  "#00f0ff", "#36c5ff", "#39ff88", "#7cffcb", "#5dffea", "#4d9dff", "#ff2bd6", "#c03bff",
  "#ff6ad5", "#9d6bff", "#ff8a3d", "#ffd23d", "#a0a8c0", "#f5ff3b", "#ff3b5c",
];
export function catColor(hex: string | undefined) {
  if (!hex) return cssVar("--muted");
  const i = NEON_CAT.indexOf(hex.toLowerCase());
  if (i < 0) return hex;
  return cssVar(`--cat-${i}`) || hex;
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
