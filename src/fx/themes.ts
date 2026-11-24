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

/* ---------------- МІНІМАЛ: soft bokeh, material ripple, check ---------------- */
const minimal: ThemeFx = {
  ambient(fx, dt) {
    if (every("min", dt, 0.9)) fx.add({ x: rnd(0, fx.w), y: rnd(0, fx.h), vy: rnd(-8, -3), size: rnd(30, 70), color: "rgba(47,107,255,.10)", max: 9, kind: "glow", fade: "inout" });
  },
  click(fx, x, y) {
    fx.add({ x, y, kind: "glow", color: "rgba(47,107,255,.25)", size: 4, grow: 160, max: 0.45 });
  },
  event(fx) {
    fx.dom('<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27 l8 8 l16 -18"/></svg>', "fx-min-check", 1300);
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

/* ---------------- ПСИХО-ТАБІР: floating thought bubbles, PSI rings, jelly confetti ---------------- */
const PSY = ["#e83f7b", "#13a89e", "#f08a00", "#5aa832", "#8b5cf6"];
const psycamp: ThemeFx = {
  ambient(fx, dt) {
    if (every("psy", dt, 0.5)) fx.add({ x: rnd(0, fx.w), y: fx.h + 20, vy: rnd(-40, -20), vx: rnd(-10, 10), size: rnd(6, 16), color: PSY[(Math.random() * 5) | 0], kind: "bubble", max: 14 });
  },
  click(fx, x, y) {
    PSY.forEach((c, i) => setTimeout(() => fx.ring(x, y, c, 40 + i * 14, 0.6, 4), i * 50));
    fx.text(x, y - 10, "PSI!", "#fff1d6", "400 26px Pangolin", { vy: -90, max: 0.9, rot: rnd(-0.3, 0.3) });
  },
  event(fx, _t, x, y) {
    for (let i = 0; i < 60; i++) fx.add({ x, y, vx: rnd(-420, 420), vy: rnd(-620, -200), g: 900, size: rnd(8, 14), rot: rnd(0, 6), vr: rnd(-10, 10), kind: "rect", color: PSY[i % 5], max: 2.2 });
    fx.dom("ЕВРИКА!", "fx-psy-pop", 1400);
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

/* ---------------- КАРАНТИН: night flashlight, ash, XP pop ---------------- */
const quarantine: ThemeFx = {
  setup(fx) {
    fx.persist("", "fx-flashlight");
  },
  ambient(fx, dt) {
    if (every("q-ash", dt, 0.15)) fx.add({ x: rnd(0, fx.w), y: -10, vy: rnd(15, 40), vx: rnd(-20, 5), size: rnd(1, 2.4), color: "rgba(220,200,180,.6)", kind: "dot", max: 18 });
  },
  click(fx, x, y) {
    fx.ring(x, y, "#ff9a2e", 50, 0.35, 3);
    fx.burst(x, y, 10, { kind: "spark", size: 2, color: "#ffcf4a", speed: 260, max: 0.4, drag: 5 });
  },
  event(fx, t, x, y) {
    const xp = t === "income" ? "+250 XP" : t === "expense" ? "+50 XP" : "+120 XP";
    fx.text(x, y, xp, "#ff9a2e", "700 34px Oswald", { vy: -120, max: 1.6 });
    fx.dom(`<div class="lvl">ВИЖИВАННЯ</div><div class="xp"><i></i></div>`, "fx-xp", 1800);
  },
};

/* ---------------- ЛАБОРАТОРІЯ ТЕСТІВ: alternate blue/orange portals, chamber voice ---------------- */
let portalBlue = true;
const testlab: ThemeFx = {
  ambient(fx, dt) {
    if (every("lab", dt, 0.6)) fx.add({ x: rnd(0, fx.w), y: rnd(0, fx.h), size: rnd(1, 2), color: "rgba(34,38,43,.25)", kind: "dot", max: 5, fade: "inout", vy: -5 });
  },
  click(fx, x, y) {
    const c = portalBlue ? "#1e90ff" : "#ff8c1a";
    portalBlue = !portalBlue;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * 6.283;
      fx.add({ x: x + Math.cos(a) * 18, y: y + Math.sin(a) * 30, vx: Math.cos(a) * 40, vy: Math.sin(a) * 60, size: 2, color: c, kind: "glow", max: 0.7 });
    }
    fx.add({ x, y, kind: "ellipse", w: 18, h: 30, color: c, stroke: 4, max: 0.9 });
  },
  event(fx, t) {
    const lines = {
      income: "Вітаємо. Дохід зафіксовано. Тест продовжується.",
      expense: "Витрату записано. Це не вплине на вашу оцінку. Майже.",
      transfer: "Відкладено. Наука вдячна за вашу обачність.",
      save: "Дані збережено. Будь ласка, продовжуйте тестування.",
      delete: "Запис видалено.",
      page: "",
    } as Record<FxEvent, string>;
    fx.dom(`<div class="ico">◉</div><div class="t">${lines[t]}</div>`, "fx-lab-voice", 3000);
  },
};

/* ---------------- ЗАВОД: welding sparks, smoke, crate on conveyor ---------------- */
const factory: ThemeFx = {
  ambient(fx, dt) {
    if (every("fac-smoke", dt, 0.35)) fx.add({ x: rnd(0, fx.w), y: fx.h + 30, vy: rnd(-30, -15), size: rnd(30, 70), color: "rgba(120,110,95,.08)", kind: "glow", max: 10, fade: "inout" });
    if (every("fac-spark", dt, 3)) {
      const x = rnd(fx.w * 0.2, fx.w * 0.95);
      const y = rnd(fx.h * 0.3, fx.h * 0.9);
      fx.burst(x, y, 12, { kind: "spark", size: 1.6, color: "#ffb52e", speed: 220, g: 600, max: 0.8 });
    }
  },
  click(fx, x, y) {
    fx.burst(x, y, 22, { kind: "spark", size: 2, color: Math.random() < 0.5 ? "#ffd54a" : "#ff8a00", speed: 380, g: 900, max: 0.9, dir: -Math.PI / 2, spread: 2.6 });
    fx.add({ x, y, kind: "glow", size: 28, color: "rgba(255,200,80,.8)", max: 0.2 });
  },
  event(fx, t) {
    fx.dom(`<div class="crate">${t === "income" ? "₴" : t === "expense" ? "−" : "⇄"}</div>`, "fx-conveyor", 2600);
  },
};

/* ---------------- ПАНТЕОН: golden motes, lightning strike, coin rain ---------------- */
const pantheon: ThemeFx = {
  ambient(fx, dt) {
    if (every("pan", dt, 0.2)) fx.add({ x: rnd(0, fx.w), y: rnd(0, fx.h), vy: rnd(-10, -3), size: rnd(1, 2.5), color: "#ffe39a", kind: "glow", max: 6, fade: "inout" });
    if (every("pan-bolt", dt, 14)) {
      fx.add({ x: rnd(fx.w * 0.3, fx.w), y: fx.h * 0.5, x2: rnd(fx.w * 0.3, fx.w), kind: "bolt", size: 2, color: "#fff6d0", max: 0.25 });
      fx.dom("", "fx-flash gold", 400);
    }
  },
  click(fx, x, y) {
    fx.add({ x, y, x2: x + rnd(-80, 80), kind: "bolt", size: 2.5, color: "#ffe39a", max: 0.22 });
    fx.ring(x, y, "#e6c15a", 50, 0.4, 3);
    fx.burst(x, y, 10, { kind: "spark", size: 2, color: "#fff6d0", speed: 220, max: 0.4, drag: 4 });
  },
  event(fx, t) {
    for (let i = 0; i < 40; i++) fx.add({ x: rnd(0, fx.w), y: rnd(-200, -10), vy: rnd(200, 420), vx: rnd(-20, 20), size: rnd(5, 9), kind: "dot", color: i % 2 ? "#e6c15a" : "#ffe39a", max: 3, g: 200 });
    fx.dom(`<div class="t">${t === "expense" ? "ЖЕРТВУ ПРИЙНЯТО" : "БОГИ ПРИХИЛЬНІ"}</div>`, "fx-pantheon", 2200);
  },
};

/* ---------------- ДАЛЕКА ГАЛАКТИКА: parallax stars, blaster bolts, hyperspace ---------------- */
const galaxy: ThemeFx = {
  ambient(fx, dt) {
    if (every("gal", dt, 0.08)) fx.add({ x: rnd(0, fx.w), y: rnd(0, fx.h), size: rnd(0.4, 1.4), color: "#fff", kind: "dot", max: rnd(2, 5), fade: "inout" });
    if (every("gal-ship", dt, 9)) fx.add({ x: -20, y: rnd(fx.h * 0.1, fx.h * 0.4), vx: 900, vy: rnd(-30, 30), size: 2, kind: "streak", color: "#ff2a2a", max: 2.5 });
  },
  click(fx, x, y) {
    const sx = Math.random() < 0.5 ? 0 : fx.w;
    const d = Math.hypot(x - sx, y - fx.h);
    const sp = 2600;
    const col = Math.random() < 0.5 ? "#ff2a2a" : "#3aff3a";
    fx.add({ x: sx, y: fx.h, vx: ((x - sx) / d) * sp, vy: ((y - fx.h) / d) * sp, kind: "streak", size: 3, color: col, max: d / sp });
    setTimeout(() => fx.burst(x, y, 12, { kind: "spark", size: 2, color: col, speed: 200, max: 0.4, drag: 4 }), (d / sp) * 1000);
  },
  event(fx) {
    const cx = fx.w / 2;
    const cy = fx.h / 2;
    for (let i = 0; i < 90; i++) {
      const a = rnd(0, 6.283);
      const r = rnd(10, 80);
      fx.add({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: Math.cos(a) * rnd(800, 2000), vy: Math.sin(a) * rnd(800, 2000), kind: "streak", size: 1.2, color: "rgba(207,232,255,.8)", max: 0.6 });
    }
    fx.dom("", "fx-flash white", 500);
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

/* ---------------- LO-FI: rain on window, floating notes, vinyl ---------------- */
const lofi: ThemeFx = {
  ambient(fx, dt) {
    if (every("lofi-r", dt, 0.05)) fx.add({ x: rnd(0, fx.w), y: -10, vx: -30, vy: rnd(500, 700), size: 1, kind: "streak", color: "rgba(200,210,255,.35)", max: 2.5 });
    if (every("lofi-n", dt, 1.6)) fx.add({ x: rnd(fx.w * 0.1, fx.w * 0.9), y: fx.h + 10, vy: rnd(-40, -25), vx: rnd(-10, 10), kind: "text", text: Math.random() < 0.5 ? "♪" : "♫", font: "22px Nunito", color: "rgba(255,214,165,.8)", max: 10, fade: "inout" });
  },
  click(fx, x, y) {
    for (let i = 0; i < 3; i++) fx.add({ x: x + rnd(-10, 10), y, vy: rnd(-70, -40), vx: rnd(-30, 30), kind: "text", text: ["♪", "♫", "♩"][i], font: "24px Nunito", color: "#f6a5c0", max: 1.4 });
    fx.ring(x, y, "rgba(165,216,255,.6)", 40, 0.8, 1.5);
  },
  event(fx, t) {
    fx.dom(`<div class="vinyl"></div><div class="t">${label(t)} · <i>chill</i></div>`, "fx-lofi", 2400);
  },
};

/* ---------------- ОКЕАН: caustics, bubbles, wave sweep ---------------- */
const ocean: ThemeFx = {
  setup(fx) {
    fx.persist("", "fx-caustics");
  },
  ambient(fx, dt) {
    if (every("oc", dt, 0.25)) fx.add({ x: rnd(0, fx.w), y: fx.h + 10, vy: rnd(-60, -25), vx: rnd(-6, 6), size: rnd(2, 7), color: "rgba(220,255,255,.65)", kind: "bubble", max: 15 });
  },
  click(fx, x, y) {
    for (let i = 0; i < 3; i++) setTimeout(() => fx.ring(x, y, "rgba(46,230,201,.7)", 50 + i * 25, 0.9, 1.5), i * 120);
  },
  event(fx) {
    fx.dom("", "fx-wave", 1600);
  },
};

export const THEME_FX: Record<string, ThemeFx> = {
  neon, minimal, miami, psycamp, family, abyss, quarantine, testlab, factory, pantheon, galaxy, sewer, lofi, ocean,
};
export { Fx };
