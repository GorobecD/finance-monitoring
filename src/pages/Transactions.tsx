import { useState } from "react";
import { useStore } from "../store";
import { DelBtn, Empty, Panel } from "../ui";
import { fmt, monthFull, monthStats } from "../calc";
import { SOURCES, TxModal } from "../TxModal";
import type { Tx } from "../types";
import { catColor, cssVar } from "../theme";

type Filter = "all" | "income" | "expense" | "transfer";

export default function Transactions() {
  const { data, update, month } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Tx | null>(null);
  const [add, setAdd] = useState(false);
  const catMap = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  const potMap = Object.fromEntries(data.pots.map((p) => [p.id, p]));
  const s = monthStats(data, month);

  const list = data.txs
    .filter((t) => t.date.startsWith(month))
    .filter((t) => filter === "all" || t.type === filter)
    .filter((t) => {
      if (!q) return true;
      const hay = `${t.note ?? ""} ${t.categoryId ? catMap[t.categoryId]?.name : ""} ${t.source ? SOURCES[t.source] : ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const byDay = new Map<string, Tx[]>();
  for (const t of list) byDay.set(t.date, [...(byDay.get(t.date) || []), t]);

  const label = (t: Tx) => {
    if (t.type === "income") return { icon: "▲", name: SOURCES[t.source || "other"], color: cssVar("--green") };
    if (t.type === "transfer") {
      const p = t.potId ? potMap[t.potId] : undefined;
      return { icon: p?.icon ?? "⇄", name: `${t.amount < 0 ? "Зняття з" : "Поповнення:"} ${p?.name ?? "—"}`, color: cssVar("--yellow") };
    }
    const c = t.categoryId ? catMap[t.categoryId] : undefined;
    return { icon: c?.icon ?? "∗", name: c?.name ?? "Інше", color: catColor(c?.color) };
  };

  return (
    <div className="grid">
      <Panel
        title={`ОПЕРАЦІЇ · ${monthFull(month).toUpperCase()}`}
        className="span-12"
        right={
          <button className="btn primary sm" onClick={() => setAdd(true)}>
            + Операція
          </button>
        }
      >
        <div className="toolbar">
          <div className="seg">
            {(
              [
                ["all", "Усі"],
                ["income", "Доходи"],
                ["expense", "Витрати"],
                ["transfer", "Накопичення"],
              ] as [Filter, string][]
            ).map(([k, v]) => (
              <button key={k} className={`seg-btn ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
                {v}
              </button>
            ))}
          </div>
          <input className="search" placeholder="Пошук…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="toolbar-sum">
            <span className="pos">+{fmt(s.income)}</span>
            <span className="neg">−{fmt(s.expense)}</span>
          </div>
        </div>
        {list.length === 0 ? (
          <Empty>Операцій немає. Додай першу кнопкою «+ Витрата» або «+ ЗП» вгорі.</Empty>
        ) : (
          <div className="tx-list">
            {[...byDay.entries()].map(([day, txs]) => (
              <div key={day} className="tx-day">
                <div className="tx-date">{new Date(day).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", weekday: "short" })}</div>
                {txs.map((t) => {
                  const l = label(t);
                  const sign = t.type === "income" ? "+" : t.type === "expense" ? "−" : t.amount < 0 ? "←" : "→";
                  return (
                    <div key={t.id} className="tx-row" onDoubleClick={() => setEdit(t)}>
                      <span className="tx-ico" style={{ color: l.color, textShadow: `0 0 8px ${l.color}` }}>
                        {l.icon}
                      </span>
                      <span className="tx-name">
                        {l.name}
                        {t.recurringId && <span className="tag">↻</span>}
                        {t.note && <span className="tx-note">{t.note}</span>}
                      </span>
                      <span className={`tx-amt t-${t.type}`}>
                        {sign}
                        {fmt(Math.abs(t.amount), t.currency, t.currency === "UAH" ? 0 : 2)}
                        {t.currency !== "UAH" && <small> ≈{fmt(Math.abs(t.uah))}</small>}
                      </span>
                      <span className="row-actions">
                        <button className="icon-btn" onClick={() => setEdit(t)} title="Редагувати">
                          ✎
                        </button>
                        <DelBtn onDelete={() => update((d) => void (d.txs = d.txs.filter((x) => x.id !== t.id)))} />
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Panel>
      {edit && <TxModal edit={edit} onClose={() => setEdit(null)} />}
      {add && <TxModal onClose={() => setAdd(false)} />}
    </div>
  );
}
