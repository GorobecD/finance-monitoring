import { Fx, rnd, type FxEvent, type ThemeFx } from "./engine";

const v = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const every = (() => {
  const acc = new Map<string, number>();
  return (key: string, dt: number, period: number) => {
    const t = (acc.get(key) ?? 0) + dt;
    if (t >= period) {
      acc.set(key, t - period);
      return true;
    }
    acc.set(key, t);
    return false;
  };
})();
const label = (t: FxEvent) => (t === "income" ? "+ дохід" : t === "expense" ? "− витрата" : t === "transfer" ? "→ відкладено" : "збережено");

/* ---------------- НЕОН: HUD data-dust, glitch flicker, digital ripple ---------------- */
const neon: ThemeFx = {
  ambient(fx, dt) {
    if (every("neon", dt, 0.12))
      fx.add({ x: rnd(0, fx.w), y: fx.h + 5, vy: rnd(-40, -15), vx: rnd(-6, 6), size: rnd(0.8, 2), color: Math.random() < 0.5 ? v("--cyan") : v("--magenta"), max: rnd(6, 12), kind: "glow", fade: "inout" });
    if (every("neon-glitch", dt, 7)) fx.dom("", "fx-neon-glitch", 450);
  },
  click(fx, x, y) {
    fx.ring(x, y, v("--cyan"), 70, 0.5, 2);
    fx.ring(x, y, v("--magenta"), 40, 0.4, 1);
    fx.burst(x, y, 8, { kind: "rect", size: 6, color: v("--cyan"), speed: 160, max: 0.5, drag: 3 });
  },
  event(fx, t, x, y) {
    fx.dom(`<span>${label(t).toUpperCase()}</span>`, "fx-neon-hud", 1400);
    for (let i = 0; i < 24; i++) fx.add({ x: rnd(0, fx.w), y: rnd(0, fx.h), kind: "text", text: Math.random() < 0.5 ? "1" : "0", font: "700 14px JetBrains Mono", color: v("--cyan"), vy: 80, max: 1 });
    fx.ring(x, y, v("--green"), 300, 0.9, 3);
  },
};

/* ---------------- МАЯМІ: headlight streaks, palm sparkle, mission banner ---------------- */
const miami: ThemeFx = {
  ambient(fx, dt) {
    if (every("mia-car", dt, 2.2)) {
      const y = fx.h * rnd(0.82, 0.95);
      const left = Math.random() < 0.5;
      fx.add({ x: left ? -40 : fx.w + 40, y, vx: left ? rnd(500, 800) : -rnd(500, 800), size: 3, kind: "streak", color: left ? "#ffd36b" : "#ff3d6e", max: 3.5 });
    }
    if (every("mia-dust", dt, 0.25)) fx.add({ x: rnd(0, fx.w), y: rnd(fx.h * 0.2, fx.h), vy: rnd(-12, -4), size: rnd(1, 2.5), color: "#ffb547", kind: "glow", max: 5, fade: "inout" });
  },
  click(fx, x, y) {
    fx.burst(x, y, 14, { kind: "spark", size: 2.5, color: Math.random() < 0.5 ? "#ff3d8b" : "#2ee6d6", speed: 320, max: 0.6, drag: 4 });
    fx.add({ x, y, kind: "glow", size: 40, color: "rgba(255,61,139,.5)", max: 0.35 });
  },
  event(fx, t) {
    const txt = t === "income" ? "ГРОШІ НА РАХУНКУ" : t === "expense" ? "ПОКУПКА ЗДІЙСНЕНА" : t === "transfer" ? "ЗАНАЧКА ПОПОВНЕНА" : "ЗБЕРЕЖЕНО";
    fx.dom(`<div class="t">${txt}</div><div class="s">+ повага</div>`, "fx-miami-banner", 2600);
  },
};

/* ---------------- СІМЕЙНА СПРАВА: lightning flash, typewriter ink, PAID stamp ---------------- */
const family: ThemeFx = {
  ambient(fx, dt) {
    if (every("fam-flash", dt, 11)) fx.dom("", "fx-flash", 700);
    if (every("fam-smoke", dt, 0.4)) fx.add({ x: rnd(0, fx.w), y: fx.h + 30, vy: rnd(-25, -12), vx: rnd(-6, 6), size: rnd(40, 90), color: "rgba(200,190,170,.06)", kind: "glow", max: 12, fade: "inout" });
  },
  click(fx, x, y) {
    fx.burst(x, y, 6, { kind: "dot", size: 2.2, color: "#161412", speed: 90, max: 0.6, g: 300 });
    fx.text(x, y - 6, "клац", "#9e1b16", "900 14px 'IBM Plex Mono'", { vy: -40, max: 0.6 });
  },
  event(_fx, t) {
    const txt = t === "income" ? "ОТРИМАНО" : t === "expense" ? "ОПЛАЧЕНО" : t === "transfer" ? "У СЕЙФ" : "ЗАПИСАНО";
    _fx.dom(`<span>${txt}</span>`, "fx-stamp", 1800);
  },
};

/* ---------------- ГЛИБОКОВОДНА БАЗА: bubbles, fish, sonar ping, PDA scan ---------------- */
const abyss: ThemeFx = {
  ambient(fx, dt) {
    if (every("aby-b", dt, 0.18)) fx.add({ x: rnd(0, fx.w), y: fx.h + 10, vy: rnd(-70, -30), vx: rnd(-8, 8), size: rnd(2, 6), color: "rgba(200,250,255,.7)", kind: "bubble", max: 14 });
    if (every("aby-f", dt, 4)) {
      const left = Math.random() < 0.5;
      const y = rnd(fx.h * 0.2, fx.h * 0.8);
      for (let i = 0; i < 7; i++) fx.add({ x: (left ? -30 : fx.w + 30) + (left ? -1 : 1) * i * rnd(10, 25), y: y + rnd(-25, 25), vx: left ? rnd(60, 80) : -rnd(60, 80), size: 4, kind: "ellipse", w: 7, h: 2.5, stroke: 3, color: "rgba(10,40,60,.75)", max: 30, fade: "inout" });
    }
  },
  click(fx, x, y) {
    fx.ring(x, y, "rgba(110,231,255,.9)", 120, 1.1, 1.5);
    fx.ring(x, y, "rgba(110,231,255,.5)", 60, 0.8, 1);
    fx.burst(x, y, 10, { kind: "bubble", size: 3, color: "rgba(220,255,255,.9)", speed: 80, dir: -Math.PI / 2, spread: 1.6, max: 1.2, vy: -40 });
  },
  event(fx, t) {
    fx.dom(`<div class="bar"></div><div class="t">КПК · ${label(t)} · дані збережено</div>`, "fx-pda", 2000);
  },
};

/* ---------------- КАНАЛІЗАЦІЯ: dripping slime, splats, pizza burst ---------------- */
const sewer: ThemeFx = {
  ambient(fx, dt) {
    if (every("sew", dt, 0.5)) fx.add({ x: rnd(0, fx.w), y: -6, vy: 0, g: rnd(500, 900), size: rnd(3, 5), color: "#7cff3a", kind: "drop", max: 3 });
    if (every("sew-b", dt, 0.4)) fx.add({ x: rnd(0, fx.w), y: fx.h + 6, vy: rnd(-30, -15), size: rnd(3, 7), color: "rgba(124,255,58,.6)", kind: "bubble", max: 6 });
  },
  click(fx, x, y) {
    fx.burst(x, y, 14, { kind: "drop", size: 4, color: "#7cff3a", speed: 260, g: 900, max: 0.9 });
    fx.add({ x, y, kind: "glow", size: 34, color: "rgba(124,255,58,.6)", max: 0.4 });
  },
  event(fx, _t, x, y) {
    for (let i = 0; i < 26; i++) fx.add({ x, y, vx: rnd(-380, 380), vy: rnd(-650, -250), g: 1000, kind: "text", text: "🍕", font: "26px sans-serif", rot: rnd(0, 6), vr: rnd(-8, 8), color: "#fff", max: 2 });
    fx.dom("КАВАБАНГА!", "fx-sewer-pop", 1500);
  },
};

export const THEME_FX: Record<string, ThemeFx> = { neon, miami, family, abyss, sewer };
export { Fx };
