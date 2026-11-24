import { useState } from "react";
import { useStore } from "../store";
import { Bar, CurSelect, DelBtn, Empty, Field, Modal, Panel, Stat, num } from "../ui";
import { daysBetween, debtLeft, fmt, portfolio, todayStr, uid } from "../calc";
import type { Cur, Debt } from "../types";

export default function Debts() {
  const { data } = useStore();
  const pf = portfolio(data);
  const [edit, setEdit] = useState<Debt | "lent" | "borrowed" | null>(null);
  const [pay, setPay] = useState<Debt | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const section = (dir: Debt["direction"]) => {
    const list = data.debts
      .filter((d) => d.direction === dir)
      .filter((d) => showClosed || debtLeft(d) > 0)
      .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
    return list.length === 0 ? (
      <Empty>{dir === "lent" ? "Ніхто тобі не винен." : "Боргів немає."}</Empty>
    ) : (
      <div className="debt-list">
        {list.map((d) => {
          const left = debtLeft(d);
          const days = d.due ? daysBetween(todayStr(), d.due) : null;
          const closed = left <= 0;
          return (
            <div key={d.id} className={`debt-card ${closed ? "closed" : ""}`}>
              <div className="debt-head">
                <span className="debt-person">{d.person}</span>
                <span className="debt-amt">{fmt(Math.max(0, left), d.currency)}</span>
              </div>
              <Bar value={d.amount - Math.max(0, left)} max={d.amount} tone={closed ? "green" : dir === "lent" ? "cyan" : "magenta"} />
              <div className="debt-meta muted small">
                <span>
                  з {fmt(d.amount, d.currency)} · {d.date}
                </span>
                {closed ? (
                  <span className="pos">✓ закрито</span>
                ) : days !== null ? (
                  <span className={days < 0 ? "neg" : days <= 7 ? "warn" : ""}>{days < 0 ? `прострочено ${-days} дн.` : `до ${d.due} (${days} дн.)`}</span>
                ) : (
                  <span>без терміну</span>
                )}
              </div>
              {d.note && <div className="muted small">{d.note}</div>}
              <div className="row gap">
                {!closed && (
                  <button className="btn green sm" onClick={() => setPay(d)}>
                    {dir === "lent" ? "Повернули" : "Повернув"}
                  </button>
                )}
                <button className="btn ghost sm" onClick={() => setEdit(d)}>
                  ✎
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid">
      <div className="stats-row span-12">
        <Stat label="МЕНІ ВИННІ" value={fmt(pf.lent)} tone="green" />
        <Stat label="Я ВИННЕН" value={fmt(pf.borrowed)} tone="red" />
        <Stat label="БАЛАНС" value={fmt(pf.lent - pf.borrowed)} tone={pf.lent >= pf.borrowed ? "cyan" : "magenta"} />
        <label className="stat check">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> показати закриті
        </label>
      </div>
      <Panel title="Я ПОЗИЧИВ" className="span-6" accent="green" right={<button className="btn primary sm" onClick={() => setEdit("lent")}>+ Позичив</button>}>
        {section("lent")}
      </Panel>
      <Panel title="Я ВИННЕН" className="span-6" accent="red" right={<button className="btn primary sm" onClick={() => setEdit("borrowed")}>+ Позичив у когось</button>}>
        {section("borrowed")}
      </Panel>
      {edit && <DebtModal item={typeof edit === "string" ? null : edit} dir={typeof edit === "string" ? edit : edit.direction} onClose={() => setEdit(null)} />}
      {pay && <PayModal debt={pay} onClose={() => setPay(null)} />}
    </div>
  );
}

function DebtModal({ item, dir, onClose }: { item: Debt | null; dir: Debt["direction"]; onClose: () => void }) {
  const { update } = useStore();
  const [person, setPerson] = useState(item?.person ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [currency, setCurrency] = useState<Cur>(item?.currency ?? "UAH");
  const [date, setDate] = useState(item?.date ?? todayStr());
  const [due, setDue] = useState(item?.due ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const save = () => {
    if (!person.trim() || num(amount) <= 0) return;
    update((d) => {
      const x: Debt = { id: item?.id ?? uid(), direction: dir, person: person.trim(), amount: num(amount), currency, date, due: due || undefined, note: note || undefined, payments: item?.payments ?? [] };
      const i = d.debts.findIndex((y) => y.id === x.id);
      if (i >= 0) d.debts[i] = x;
      else d.debts.push(x);
    });
    onClose();
  };
  return (
    <Modal title={dir === "lent" ? "Я позичив" : "Я винен"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Кому / в кого">
          <input autoFocus value={person} onChange={(e) => setPerson(e.target.value)} />
        </Field>
        <Field label="Сума">
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Валюта">
          <CurSelect value={currency} onChange={setCurrency} />
        </Field>
        <Field label="Дата">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Повернути до">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Примітка">
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      {item && item.payments.length > 0 && (
        <div className="payments">
          <div className="muted small">Повернення:</div>
          {item.payments.map((p, i) => (
            <div key={i} className="small">
              {p.date} — {fmt(p.amount, item.currency)}
            </div>
          ))}
        </div>
      )}
      <div className="modal-actions">
        {item && (
          <div className="mr-auto">
            <DelBtn
              onDelete={() => {
                update((d) => void (d.debts = d.debts.filter((y) => y.id !== item.id)));
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

function PayModal({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const { update } = useStore();
  const left = debtLeft(debt);
  const [amount, setAmount] = useState(String(left));
  const save = () => {
    const v = num(amount);
    if (v <= 0) return;
    update((d) => d.debts.find((x) => x.id === debt.id)!.payments.push({ date: todayStr(), amount: Math.min(v, left) }));
    onClose();
  };
  return (
    <Modal title={`Повернення · ${debt.person}`} onClose={onClose}>
      <div className="form-grid">
        <Field label={`Сума (залишок ${fmt(left, debt.currency)})`} wide>
          <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        </Field>
      </div>
      <div className="hint">Часткове повернення теж можна — борг закриється, коли залишок стане 0.</div>
      <div className="modal-actions">
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
