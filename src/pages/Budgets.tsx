import { useState } from "react";
import { useStore } from "../store";
import { Bar, DelBtn, Field, Modal, Panel, num } from "../ui";
import { avgMonthlyExpense, fmt, monthStats, shiftMonth, uid } from "../calc";
import type { Bucket, Category } from "../types";
import { catColor } from "../theme";

const COLORS = ["#00f0ff", "#ff2bd6", "#39ff88", "#f5ff3b", "#ff8a3d", "#c03bff", "#4d9dff", "#ff3b5c", "#7cffcb"];

export default function Budgets() {
  const { data, update, month } = useStore();
  const s = monthStats(data, month);
  const [catEdit, setCatEdit] = useState<Category | "new" | null>(null);

  const prev = (cid: string) => {
    const vals = [1, 2, 3].map((i) => monthStats(data, shiftMonth(month, -i)).byCategory[cid] || 0).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const totalLimit = Object.values(data.budgets).reduce((a, b) => a + (b || 0), 0);

  const groups: [Bucket, string][] = [
    ["needs", "ПОТРЕБИ"],
    ["wants", "БАЖАННЯ"],
  ];

  return (
    <div className="grid">
      <Panel
        title="МІСЯЧНІ ЛІМІТИ"
        className="span-12"
        right={
          <div className="row gap">
            <span className="muted">
              Ліміти: {fmt(totalLimit)} · витрачено {fmt(s.expense)} · середнє {fmt(avgMonthlyExpense(data, shiftMonth(month, -1)))}
            </span>
            <button className="btn ghost sm" onClick={() => setCatEdit("new")}>
              + Категорія
            </button>
          </div>
        }
      >
        {groups.map(([b, title]) => (
          <div key={b} className="budget-group">
            <h4 className={b === "needs" ? "tone-text-cyan" : "tone-text-magenta"}>{title}</h4>
            {data.categories
              .filter((c) => c.bucket === b)
              .map((c) => {
                const spent = s.byCategory[c.id] || 0;
                const lim = data.budgets[c.id] || 0;
                const avg = prev(c.id);
                return (
                  <div key={c.id} className="budget-row">
                    <span className="b-name" onDoubleClick={() => setCatEdit(c)}>
                      <span style={{ color: catColor(c.color), textShadow: `0 0 8px ${catColor(c.color)}` }}>{c.icon}</span> {c.name}
                    </span>
                    <span className="b-spent">{fmt(spent)}</span>
                    <div className="b-bar">
                      {lim > 0 ? <Bar value={spent} max={lim} /> : <span className="muted small">без ліміту</span>}
                    </div>
                    <input
                      className="b-input"
                      inputMode="decimal"
                      placeholder={avg > 0 ? `~${Math.round(avg)}` : "ліміт"}
                      defaultValue={lim || ""}
                      onBlur={(e) => {
                        const v = num(e.target.value);
                        update((d) => {
                          if (v > 0) d.budgets[c.id] = v;
                          else delete d.budgets[c.id];
                        });
                      }}
                    />
                    <button className="icon-btn" onClick={() => setCatEdit(c)} title="Редагувати категорію">
                      ✎
                    </button>
                  </div>
                );
              })}
          </div>
        ))}
        <div className="hint">Підказка в полі ліміту — твої середні витрати за 3 попередні місяці.</div>
      </Panel>
      {catEdit && <CatModal cat={catEdit === "new" ? null : catEdit} onClose={() => setCatEdit(null)} />}
    </div>
  );
}

function CatModal({ cat, onClose }: { cat: Category | null; onClose: () => void }) {
  const { data, update } = useStore();
  const [name, setName] = useState(cat?.name ?? "");
  const [icon, setIcon] = useState(cat?.icon ?? "◆");
  const [bucket, setBucket] = useState<Bucket>(cat?.bucket ?? "wants");
  const [color, setColor] = useState(cat?.color ?? COLORS[data.categories.length % COLORS.length]);
  const used = cat ? data.txs.some((t) => t.categoryId === cat.id) : false;

  const save = () => {
    if (!name.trim()) return;
    update((d) => {
      const c: Category = { id: cat?.id ?? uid(), name: name.trim(), icon: icon || "◆", bucket, color };
      const i = d.categories.findIndex((x) => x.id === c.id);
      if (i >= 0) d.categories[i] = c;
      else d.categories.push(c);
    });
    onClose();
  };

  return (
    <Modal title={cat ? "Категорія" : "Нова категорія"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Назва">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Символ">
          <input value={icon} maxLength={2} onChange={(e) => setIcon(e.target.value)} />
        </Field>
        <Field label="Тип (для правила 50/30/20)">
          <select value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
            <option value="needs">Потреби</option>
            <option value="wants">Бажання</option>
          </select>
        </Field>
        <Field label="Колір">
          <div className="swatches">
            {COLORS.map((c) => (
              <button key={c} className={`swatch ${c === color ? "on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </Field>
      </div>
      <div className="modal-actions">
        {cat && cat.id !== "other" && (
          <div className="mr-auto">
            {used ? (
              <span className="muted small">є операції — не можна видалити</span>
            ) : (
              <DelBtn
                onDelete={() => {
                  update((d) => {
                    d.categories = d.categories.filter((x) => x.id !== cat.id);
                    delete d.budgets[cat.id];
                  });
                  onClose();
                }}
              />
            )}
          </div>
        )}
        <button className="btn ghost" onClick={onClose}>
          Скасувати
        </button>
        <button className="btn primary" onClick={save}>
          Зберегти
        </button>
      </div>
    </Modal>
  );
}
