import { useState } from "react";
import { useStore } from "./store";
import { Field, CurSelect, Modal, num } from "./ui";
import type { Cur, IncomeSource, Tx } from "./types";
import { cushionInfo, fmt, rateOf, todayStr, uid } from "./calc";
import { fxEmit } from "./fx/engine";

export const SOURCES: Record<IncomeSource, string> = {
  salary: "Зарплата",
  bonus: "Премія / бонус",
  freelance: "Фріланс / підробіток",
  passive: "Відсотки / кешбек / дивіденди",
  other: "Інше",
};

type Mode = "income" | "expense" | "transfer";

export function TxModal({
  onClose,
  mode: initMode = "expense",
  source: initSource = "salary",
  edit,
}: {
  onClose: () => void;
  mode?: Mode;
  source?: IncomeSource;
  edit?: Tx;
}) {
  const { data, update } = useStore();
  const rates = data.settings.rates;
  const [mode, setMode] = useState<Mode>(edit?.type ?? initMode);
  const [amount, setAmount] = useState(edit ? String(Math.abs(edit.amount)) : "");
  const [currency, setCurrency] = useState<Cur>(edit?.currency ?? "UAH");
  const [rate, setRate] = useState(
    edit && edit.currency !== "UAH" ? String(Math.abs(edit.uah / edit.amount)) : "",
  );
  const [date, setDate] = useState(edit?.date ?? todayStr());
  const [categoryId, setCategoryId] = useState(edit?.categoryId ?? data.categories[0]?.id);
  const [source, setSource] = useState<IncomeSource>(edit?.source ?? initSource);
  const [potId, setPotId] = useState(edit?.potId ?? data.pots[0]?.id);
  const [withdraw, setWithdraw] = useState(edit ? edit.amount < 0 : false);
  const [note, setNote] = useState(edit?.note ?? "");
  const [split, setSplit] = useState<number | null>(null);

  const effRate = currency === "UAH" ? 1 : num(rate) || rateOf(currency, rates);
  const amt = num(amount);
  const uahVal = amt * effRate;

  const save = () => {
    if (amt <= 0) return;
    const sign = mode === "transfer" && withdraw ? -1 : 1;
    const tx: Tx = {
      id: edit?.id ?? uid(),
      date,
      type: mode,
      amount: amt * sign,
      currency,
      uah: uahVal * sign,
      note: note.trim() || undefined,
      recurringId: edit?.recurringId,
    };
    if (mode === "expense") tx.categoryId = categoryId;
    if (mode === "income") tx.source = source;
    if (mode === "transfer") tx.potId = potId;
    update((d) => {
      const i = d.txs.findIndex((t) => t.id === tx.id);
      if (i >= 0) d.txs[i] = tx;
      else d.txs.push(tx);
    });
    fxEmit(mode);
    if (!edit && mode === "income" && source === "salary") setSplit(uahVal);
    else onClose();
  };

  if (split !== null) return <SalarySplit amount={split} onClose={onClose} />;

  return (
    <Modal title={edit ? "Редагувати операцію" : "Нова операція"} onClose={onClose}>
      <div className="seg">
        {(["income", "expense", "transfer"] as Mode[]).map((m) => (
          <button key={m} className={`seg-btn ${mode === m ? "on" : ""} m-${m}`} onClick={() => setMode(m)}>
            {m === "income" ? "▲ Дохід" : m === "expense" ? "▼ Витрата" : "⇄ Накопичення"}
          </button>
        ))}
      </div>
      <div className="form-grid">
        <Field label="Сума">
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="0"
          />
        </Field>
        <Field label="Валюта">
          <CurSelect value={currency} onChange={setCurrency} />
        </Field>
        {currency !== "UAH" && (
          <Field label={`Курс ${currency} (НБУ: ${rateOf(currency, rates).toFixed(2)})`}>
            <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder={rateOf(currency, rates).toFixed(2)} />
          </Field>
        )}
        <Field label="Дата">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {mode === "income" && (
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
        {mode === "expense" && (
          <Field label="Категорія">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name} · {c.bucket === "needs" ? "потреби" : "бажання"}
                </option>
              ))}
            </select>
          </Field>
        )}
        {mode === "transfer" && (
          <>
            <Field label="Куди / звідки">
              <select value={potId} onChange={(e) => setPotId(e.target.value)}>
                {data.pots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Напрям">
              <select value={withdraw ? "out" : "in"} onChange={(e) => setWithdraw(e.target.value === "out")}>
                <option value="in">Поповнити (з вільних коштів)</option>
                <option value="out">Зняти (у вільні кошти)</option>
              </select>
            </Field>
          </>
        )}
        <Field label="Коментар" wide>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="необов'язково" />
        </Field>
      </div>
      {currency !== "UAH" && amt > 0 && <div className="hint">≈ {fmt(uahVal)}</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Скасувати
        </button>
        <button className="btn primary" onClick={save} disabled={amt <= 0}>
          Зберегти
        </button>
      </div>
    </Modal>
  );
}

export function SalarySplit({ amount, onClose }: { amount: number; onClose: () => void }) {
  const { data, update } = useStore();
  const { rule } = data.settings;
  const cush = cushionInfo(data);
  const savings = (amount * rule.savings) / 100;
  const cushionLeft = Math.max(0, cush.target - cush.balance);
  const toCushion = cush.target > 0 ? Math.min(savings, cushionLeft) : savings;
  const toInvest = savings - toCushion;
  const [done, setDone] = useState(false);

  const moveToCushion = () => {
    if (!cush.pot || toCushion <= 0) return;
    update((d) =>
      d.txs.push({
        id: uid(),
        date: todayStr(),
        type: "transfer",
        amount: Math.round(toCushion),
        currency: "UAH",
        uah: Math.round(toCushion),
        potId: cush.pot!.id,
        note: "Авто з ЗП",
      }),
    );
    setDone(true);
    fxEmit("transfer");
  };

  return (
    <Modal title="Розподіл зарплати" onClose={onClose}>
      <div className="split-total">
        ЗП зараховано: <b>{fmt(amount)}</b>
      </div>
      <div className="split-grid">
        <div className="split-card tone-cyan">
          <div className="split-pct">{rule.needs}%</div>
          <div className="split-name">Потреби</div>
          <div className="split-val">{fmt((amount * rule.needs) / 100)}</div>
          <div className="split-desc">житло, їжа, транспорт, комуналка</div>
        </div>
        <div className="split-card tone-magenta">
          <div className="split-pct">{rule.wants}%</div>
          <div className="split-name">Бажання</div>
          <div className="split-val">{fmt((amount * rule.wants) / 100)}</div>
          <div className="split-desc">кафе, розваги, покупки</div>
        </div>
        <div className="split-card tone-green">
          <div className="split-pct">{rule.savings}%</div>
          <div className="split-name">Майбутнє</div>
          <div className="split-val">{fmt(savings)}</div>
          <div className="split-desc">
            {cush.target > 0 && cushionLeft > 0
              ? `подушка ${fmt(toCushion)}${toInvest > 0 ? ` · інвестиції ${fmt(toInvest)}` : ""}`
              : cush.target > 0
                ? "подушка повна → усе в інвестиції"
                : "подушка + інвестиції"}
          </div>
        </div>
      </div>
      {cush.target === 0 && <div className="hint">Ціль подушки з'явиться після першого місяця витрат.</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Готово
        </button>
        {cush.pot && toCushion > 0 && (
          <button className="btn primary" onClick={moveToCushion} disabled={done}>
            {done ? "✓ Відкладено" : `Відкласти ${fmt(toCushion)} у подушку`}
          </button>
        )}
      </div>
    </Modal>
  );
}
