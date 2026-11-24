/* Theme FX engine: one fixed canvas (pointer-events: none) + DOM overlays.
   Each theme supplies ambient(), click() and event() hooks (see themes.ts). */

export type FxEvent = "income" | "expense" | "transfer" | "save" | "delete" | "page";

export interface P {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  kind: "dot" | "glow" | "bubble" | "spark" | "ring" | "text" | "rect" | "line" | "drop" | "streak" | "bolt" | "ellipse";
  rot?: number; vr?: number; g?: number; drag?: number; text?: string; font?: string;
  x2?: number; y2?: number; w?: number; h?: number; fade?: "out" | "inout"; grow?: number; stroke?: number;
}

export interface ThemeFx {
  ambient?(fx: Fx, dt: number): void;
  click?(fx: Fx, x: number, y: number): void;
  event?(fx: Fx, type: FxEvent, x: number, y: number): void;
  setup?(fx: Fx): void;
  teardown?(fx: Fx): void;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export { rnd };

export class Fx {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ps: P[] = [];
  w = 0;
  h = 0;
  t = 0;
  mx = -999;
  my = -999;
  theme: ThemeFx | null = null;
  private raf = 0;
  private last = 0;
  private layer: HTMLDivElement;
  enabled = true;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "fx-canvas";
    this.ctx = this.canvas.getContext("2d")!;
    this.layer = document.createElement("div");
    this.layer.className = "fx-layer";
    document.body.append(this.canvas, this.layer);
    this.resize();
    addEventListener("resize", () => this.resize());
    addEventListener("pointermove", (e) => {
      this.mx = e.clientX;
      this.my = e.clientY;
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    });
    addEventListener("pointerdown", (e) => {
      if (!this.enabled || !this.theme?.click) return;
      if ((e.target as HTMLElement).closest("input, select, textarea")) return;
      this.theme.click(this, e.clientX, e.clientY);
    });
    addEventListener("fx", (e) => {
      const d = (e as CustomEvent).detail as { type: FxEvent; x?: number; y?: number };
      if (this.enabled) this.theme?.event?.(this, d.type, d.x ?? this.w / 2, d.y ?? this.h / 2);
    });
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - (this.last || ts)) / 1000);
      this.last = ts;
      this.t += dt;
      if (this.enabled && !document.hidden) {
        this.theme?.ambient?.(this, dt);
        this.step(dt);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  use(theme: ThemeFx | null) {
    if (this.theme === theme) return;
    this.theme?.teardown?.(this);
    this.ps = [];
    this.layer.innerHTML = "";
    this.layer.className = "fx-layer";
    this.theme = theme;
    this.ctx.clearRect(0, 0, this.w, this.h);
    if (this.enabled) theme?.setup?.(this);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) {
      this.ps = [];
      this.layer.innerHTML = "";
      this.ctx.clearRect(0, 0, this.w, this.h);
    } else this.theme?.setup?.(this);
  }

  add(p: Partial<P> & { x: number; y: number }) {
    if (this.ps.length > 900) return;
    this.ps.push({ vx: 0, vy: 0, life: 0, max: 1, size: 3, color: "#fff", kind: "dot", ...p });
  }

  burst(x: number, y: number, n: number, o: Partial<P> & { speed?: number; spread?: number; dir?: number }) {
    const { speed = 200, spread = Math.PI * 2, dir = -Math.PI / 2, ...rest } = o;
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - 0.5) * spread;
      const s = speed * rnd(0.35, 1);
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: rnd(0, 6.28), vr: rnd(-6, 6), ...rest, max: (rest.max ?? 1) * rnd(0.7, 1.2) });
    }
  }

  ring(x: number, y: number, color: string, size = 60, max = 0.7, stroke = 2) {
    this.add({ x, y, kind: "ring", color, size: 4, grow: size / max, max, stroke });
  }

  text(x: number, y: number, text: string, color: string, font: string, o: Partial<P> = {}) {
    this.add({ x, y, kind: "text", text, color, font, vy: -60, max: 1.4, ...o });
  }

  /** DOM overlay element with a CSS animation; removed after ms. */
  dom(html: string, cls: string, ms = 1500, style: Partial<CSSStyleDeclaration> = {}) {
    const el = document.createElement("div");
    el.className = `fx-dom ${cls}`;
    el.innerHTML = html;
    Object.assign(el.style, style);
    this.layer.append(el);
    setTimeout(() => el.remove(), ms);
    return el;
  }

  /** persistent DOM element (cleared on theme change) */
  persist(html: string, cls: string) {
    const el = document.createElement("div");
    el.className = `fx-dom ${cls}`;
    el.innerHTML = html;
    this.layer.append(el);
    return el;
  }

  private step(dt: number) {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    const keep: P[] = [];
    for (const p of this.ps) {
      p.life += dt;
      if (p.life >= p.max) continue;
      p.vy += (p.g ?? 0) * dt;
      if (p.drag) {
        p.vx *= 1 - p.drag * dt;
        p.vy *= 1 - p.drag * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.vr) p.rot = (p.rot ?? 0) + p.vr * dt;
      if (p.grow) p.size += p.grow * dt;
      const k = p.life / p.max;
      const a = p.fade === "inout" ? Math.sin(Math.PI * k) : 1 - k;
      c.globalAlpha = Math.max(0, Math.min(1, a));
      this.draw(c, p);
      keep.push(p);
    }
    c.globalAlpha = 1;
    this.ps = keep;
  }

  private draw(c: CanvasRenderingContext2D, p: P) {
    c.fillStyle = p.color;
    c.strokeStyle = p.color;
    switch (p.kind) {
      case "dot":
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, 6.283);
        c.fill();
        break;
      case "glow": {
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, p.color);
        g.addColorStop(1, "transparent");
        c.fillStyle = g;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, 6.283);
        c.fill();
        break;
      }
      case "bubble":
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, 6.283);
        c.stroke();
        c.globalAlpha *= 0.6;
        c.beginPath();
        c.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.25, 0, 6.283);
        c.fill();
        break;
      case "spark": {
        c.lineWidth = p.size;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        c.stroke();
        break;
      }
      case "streak":
        c.lineWidth = p.size;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.12, p.y - p.vy * 0.12);
        c.stroke();
        break;
      case "ring":
        c.lineWidth = p.stroke ?? 2;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, 6.283);
        c.stroke();
        break;
      case "ellipse":
        c.lineWidth = p.stroke ?? 4;
        c.beginPath();
        c.ellipse(p.x, p.y, p.w ?? p.size, p.h ?? p.size * 1.6, 0, 0, 6.283);
        c.stroke();
        break;
      case "rect":
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot ?? 0);
        c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        c.restore();
        break;
      case "drop":
        c.beginPath();
        c.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, 6.283);
        c.fill();
        break;
      case "line":
        c.lineWidth = p.size;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x2 ?? p.x, p.y2 ?? p.y);
        c.stroke();
        break;
      case "bolt": {
        c.lineWidth = p.size;
        c.shadowColor = p.color;
        c.shadowBlur = 18;
        c.beginPath();
        let x = p.x2 ?? p.x;
        let y = 0;
        c.moveTo(x, y);
        const steps = 9;
        for (let i = 1; i <= steps; i++) {
          y = (p.y * i) / steps;
          x = (p.x2 ?? p.x) + ((p.x - (p.x2 ?? p.x)) * i) / steps + (i < steps ? rnd(-26, 26) : 0);
          c.lineTo(x, y);
        }
        c.stroke();
        c.shadowBlur = 0;
        break;
      }
      case "text":
        c.save();
        c.font = p.font ?? "700 20px sans-serif";
        c.textAlign = "center";
        c.translate(p.x, p.y);
        if (p.rot) c.rotate(p.rot);
        c.fillText(p.text ?? "", 0, 0);
        c.restore();
        break;
    }
  }
}

/** Fire a themed FX event from anywhere (e.g. after saving a transaction). */
export function fxEmit(type: FxEvent, x?: number, y?: number) {
  dispatchEvent(new CustomEvent("fx", { detail: { type, x, y } }));
}
