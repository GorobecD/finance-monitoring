import { useState } from "react";
import { useStore } from "../store";
import { CurSelect, DelBtn, Empty, Field, Modal, Panel, Stat, num } from "../ui";
import { fmt, monthFull, rateOf, toUAH, uid } from "../calc";
import { SOURCES } from "../TxModal";
import type { Cur, Data, IncomeSource, Recurring as Rec } from "../types";
import { fxEmit } from "../fx/engine";

export function applyRecurring(d: Data, r: Rec, month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const day = String(Math.min(r.day, last)).padStart(2, "0");
  const rate = rateOf(r.currency, d.settings.rates);
  d.txs.push({
    id: uid(),
    date: `${month}-${day}`,
    type: r.kind,
    amount: r.amount,
    currency: r.currency,
    uah: r.amount * rate,
    categoryId: r.kind === "expense" ? r.categoryId : undefined,
    source: r.kind === "income" ? r.source : undefined,
    recurringId: r.id,
    accountId: r.accountId,
    note: r.name,
  });
  d.appliedRecurring[month] = [...(d.appliedRecurring[month] || []), r.id];
}

export default function Recurring() {
  const { data, update, month } = useStore();
  const [edit, setEdit] = useState<Rec | "new" | null>(null);
  const applied = new Set(data.appliedRecurring[month] || []);
  const catMap = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  const r = data.settings.rates;
  const active = data.recurring.filter((x) => x.active);
  const monthlyOut = active.filter((x) => x.kind === "expense").reduce((a, x) => a + toUAH(x.amount, x.currency, r), 0);
  const monthlyIn = active.filter((x) => x.kind === "income").reduce((a, x) => a + toUAH(x.amount, x.currency, r), 0);
  const pending = active.filter((x) => !applied.has(x.id));
  const sorted = [...data.recurring].sort((a, b) => a.day - b.day);

  return (
    <div className="grid">
      <div className="stats-row span-12">
        <Stat label="ОБОВ'ЯЗКОВІ ВИТРАТИ / МІС" value={fmt(monthlyOut)} sub={`${active.filter((x) => x.kind === "expense").length} платежів`} tone="magenta" />
        <Stat label="РЕГУЛЯРНІ ДОХОДИ / МІС" value={fmt(monthlyIn)} tone="green" />
        <Stat label={`НЕ ПРОВЕДЕНО · ${monthFull(month)}`} value={String(pending.length)} tone={pending.length ? "yellow" : "cyan"} />
      </div>
      <Panel
        title="РЕГУЛЯРНІ ПЛАТЕЖІ"
        className="span-12"
        right={
          <div className="row gap">
            {pending.length > 0 && (
              <button className="btn green sm" onClick={() => { update((d) => pending.forEach((p) => applyRecurring(d, p, month))); fxEmit("expense"); }}>
                Провести всі ({pending.length})
              </button>
            )}
            <button className="btn primary sm" onClick={() => setEdit("new")}>
              + Платіж
            </button>
          </div>
        }
      >
        {sorted.length === 0 ? (
          <Empty>Додай оренду, комуналку, підписки, кредит — і щомісяця проводь їх одним кліком.</Empty>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>День</th>
                <th>Назва</th>
                <th>Категорія</th>
                <th className="r">Сума</th>
                <th>{monthFull(month)}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((x) => (
                <tr key={x.id} className={x.active ? "" : "dim"} onDoubleClick={() => setEdit(x)}>
                  <td>{x.day}</td>
                  <td>{x.name}</td>
                  <td className="muted">{x.kind === "income" ? `▲ ${SOURCES[x.source || "other"]}` : `${catMap[x.categoryId || ""]?.icon ?? ""} ${catMap[x.categoryId || ""]?.name ?? "—"}`}</td>
                  <td className={`r ${x.kind === "income" ? "pos" : ""}`}>{fmt(x.amount, x.currency)}</td>
                  <td>
                    {!x.active ? (
                      <span className="muted">пауза</span>
                    ) : applied.has(x.id) ? (
                      <span className="pos">✓ проведено</span>
                    ) : (
                      <button className="btn green xs" onClick={() => { update((d) => applyRecurring(d, x, month)); fxEmit(x.kind); }}>
                        Провести
                      </button>
                    )}
                  </td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => setEdit(x)}>
                      ✎
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {edit && <RecModal item={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function RecModal({ item, onClose }: { item: Rec | null; onClose: () => void }) {
  const { data, update } = useStore();
  const [kind, setKind] = useState<Rec["kind"]>(item?.kind ?? "expense");
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [currency, setCurrency] = useState<Cur>(item?.currency ?? "UAH");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? data.categories[0]?.id);
  const [source, setSource] = useState<IncomeSource>(item?.source ?? "salary");
  const [day, setDay] = useState(String(item?.day ?? 1));
  const [active, setActive] = useState(item?.active ?? true);
  const save = () => {
    if (!name.trim() || num(amount) <= 0) return;
    update((d) => {
      const x: Rec = { id: item?.id ?? uid(), kind, name: name.trim(), amount: num(amount), currency, categoryId, source, day: Math.min(31, Math.max(1, Math.round(num(day)) || 1)), active };
      const i = d.recurring.findIndex((y) => y.id === x.id);
      if (i >= 0) d.recurring[i] = x;
      else d.recurring.push(x);
    });
    onClose();
  };
  return (
    <Modal title={item ? "Регулярний платіж" : "Новий регулярний платіж"} onClose={onClose}>
      <div className="seg">
        <button className={`seg-btn ${kind === "expense" ? "on" : ""}`} onClick={() => setKind("expense")}>
          ▼ Витрата
        </button>
        <button className={`seg-btn ${kind === "income" ? "on" : ""}`} onClick={() => setKind("income")}>
          ▲ Дохід
        </button>
      </div>
      <div className="form-grid">
        <Field label="Назва">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Оренда, Netflix, інтернет…" />
        </Field>
        <Field label="День місяця">
          <input inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
        <Field label="Сума">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Валюта">
          <CurSelect value={currency} onChange={setCurrency} />
        </Field>
        {kind === "expense" ? (
          <Field label="Категорія">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Джерело">
            <select value={source} onChange={(e) => setSource(e.target.value as IncomeSource)}>
              {Object.entries(SOURCES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Статус">
          <select value={active ? "1" : "0"} onChange={(e) => setActive(e.target.value === "1")}>
            <option value="1">Активний</option>
            <option value="0">Пауза</option>
          </select>
        </Field>
      </div>
      <div className="modal-actions">
        {item && (
          <div className="mr-auto">
            <DelBtn
              onDelete={() => {
                update((d) => void (d.recurring = d.recurring.filter((y) => y.id !== item.id)));
                onClose();
              }}
            />
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
