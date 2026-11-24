import { useEffect, useState, type ReactNode } from "react";
import type { Cur } from "./types";

export function Panel({
  title,
  right,
  children,
  className = "",
  accent = "cyan",
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: "cyan" | "magenta" | "yellow" | "green" | "red";
}) {
  return (
    <section className={`panel accent-${accent} ${className}`}>
      {(title || right) && (
        <header className="panel-head">
          <h3>{title}</h3>
          <div className="panel-right">{right}</div>
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "cyan",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "cyan" | "magenta" | "yellow" | "green" | "red";
}) {
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Bar({ value, max, tone }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  const t = tone || (over ? "red" : pct > 80 ? "yellow" : "cyan");
  return (
    <div className="bar">
      <div className={`bar-fill tone-${t}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ pct, size = 120, label, sub }: { pct: number; size?: number; label: ReactNode; sub?: ReactNode }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-fg"
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-label">{label}</div>
        {sub && <div className="ring-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрити">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function CurSelect({ value, onChange }: { value: Cur; onChange: (c: Cur) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Cur)}>
      <option value="UAH">₴ UAH</option>
      <option value="USD">$ USD</option>
      <option value="EUR">€ EUR</option>
    </select>
  );
}

export const num = (s: string) => {
  const n = parseFloat(s.replace(",", ".").replace(/\s/g, ""));
  return isFinite(n) ? n : 0;
};

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** Two-step delete button (no native confirm dialogs in webview). */
export function DelBtn({ onDelete }: { onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      className={`icon-btn del ${armed ? "armed" : ""}`}
      title="Видалити"
      onClick={() => (armed ? onDelete() : setArmed(true))}
    >
      {armed ? "ТОЧНО?" : "✕"}
    </button>
  );
}
