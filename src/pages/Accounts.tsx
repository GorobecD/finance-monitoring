import { useState } from "react";
import { useStore } from "../store";
import { CurSelect, DelBtn, Empty, Field, Modal, Panel, Stat, num } from "../ui";
import { accOf, accountBalance, fmt, freeBalance, rateOf, toUAH, todayStr, uid } from "../calc";
import type { Account, Cur } from "../types";
import { fxEmit } from "../fx/engine";

const KINDS: Record<Account["kind"], { label: string; icon: string }> = {
  card: { label: "Картка", icon: "▭" },
  cash: { label: "Готівка", icon: "◍" },
  deposit: { label: "Рахунок / скарбничка", icon: "◈" },
};

export default function Accounts() {
  const { data, update } = useStore();
  const r = data.settings.rates;
  const [edit, setEdit] = useState<Account | "new" | null>(null);
  const [move, setMove] = useState<string | null>(null);
  const [fix, setFix] = useState<Account | null>(null);
  const [showArch, setShowArch] = useState(false);
  const list = data.accounts.filter((a) => showArch || !a.archived);
  const total = freeBalance(data);
  const cash = data.accounts.filter((a) => a.kind === "cash").reduce((s, a) => s + toUAH(accountBalance(data, a), a.currency, r), 0);

  return (
    <div className="grid">
      <div className="stats-row span-12">
        <Stat label="УСЬОГО НА РАХУНКАХ" value={fmt(total)} sub={`${data.accounts.filter((a) => !a.archived).length} рахунків`} tone="cyan" />
        <Stat label="НА КАРТКАХ" value={fmt(total - cash)} tone="green" />
        <Stat label="ГОТІВКОЮ" value={fmt(cash)} tone="yellow" />
      </div>

      <Panel
        title="РАХУНКИ"
        className="span-12"
        right={
          <div className="row gap">
            {data.accounts.some((a) => a.archived) && (
              <label className="row gap muted small" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={showArch} onChange={(e) => setShowArch(e.target.checked)} /> архів
              </label>
            )}
            {data.accounts.length > 1 && (
              <button className="btn ghost sm" onClick={() => setMove(data.settings.defaultAccount ?? data.accounts[0].id)}>
                ⇆ Переказ
              </button>
            )}
            <button className="btn primary sm" onClick={() => setEdit("new")}>
              + Рахунок
            </button>
          </div>
        }
      >
        {list.length === 0 ? (
          <Empty>Немає рахунків.</Empty>
        ) : (
          <div className="cards">
            {list.map((a) => {
              const bal = accountBalance(data, a);
              const isDef = data.settings.defaultAccount === a.id;
              const n = data.txs.filter((t) => accOf(data, t) === a.id || t.toAccountId === a.id).length;
              return (
                <div key={a.id} className={`goal-card acc-card ${a.archived ? "dim" : ""}`}>
                  <div className="goal-head">
                    <span className="goal-ico">{a.icon}</span>
                    <span className="goal-name">{a.name}</span>
                    {isDef && <span className="tag">основний</span>}
                    <button className="icon-btn" onClick={() => setEdit(a)} title="Редагувати">
                      ✎
                    </button>
                  </div>
                  <div className={`goal-amt ${bal < 0 ? "neg" : ""}`}>
                    {fmt(bal, a.currency, a.currency === "UAH" ? 0 : 2)}
                    {a.currency !== "UAH" && <span className="muted"> ≈ {fmt(toUAH(bal, a.currency, r))}</span>}
                  </div>
                  <div className="goal-meta muted">
                    {KINDS[a.kind].label} · {n} операцій
                  </div>
                  <div className="row gap">
                    {data.accounts.length > 1 && (
                      <button className="btn ghost sm" onClick={() => setMove(a.id)}>
                        ⇆ Переказ
                      </button>
                    )}
                    <button className="btn ghost sm" onClick={() => setFix(a)} title="Вказати реальний баланс з банку">
                      ✓ Звірити
                    </button>
                    {!isDef && !a.archived && (
                      <button className="btn ghost sm" onClick={() => update((d) => void (d.settings.defaultAccount = a.id))}>
                        Зробити основним
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="hint">
          «Звірити» — впиши, скільки зараз реально на картці, і програма вирівняє баланс. Основний рахунок підставляється у нові операції автоматично.
        </div>
      </Panel>
      {edit && <AccountModal item={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {move && <MoveModal from={move} onClose={() => setMove(null)} />}
      {fix && <FixModal acc={fix} onClose={() => setFix(null)} />}
    </div>
  );
}

function AccountModal({ item, onClose }: { item: Account | null; onClose: () => void }) {
  const { data, update } = useStore();
  const [name, setName] = useState(item?.name ?? "");
  const [kind, setKind] = useState<Account["kind"]>(item?.kind ?? "card");
  const [icon, setIcon] = useState(item?.icon ?? KINDS.card.icon);
  const [currency, setCurrency] = useState<Cur>(item?.currency ?? "UAH");
  const [initial, setInitial] = useState(item ? String(item.initial) : "");
  const used = item ? data.txs.some((t) => accOf(data, t) === item.id || t.toAccountId === item.id) : false;
  const isLast = data.accounts.filter((a) => !a.archived).length <= 1;

  const save = () => {
    if (!name.trim()) return;
    update((d) => {
      const a: Account = { id: item?.id ?? uid(), name: name.trim(), kind, icon: icon || KINDS[kind].icon, currency: used ? item!.currency : currency, initial: num(initial), archived: item?.archived };
      const i = d.accounts.findIndex((x) => x.id === a.id);
      if (i >= 0) d.accounts[i] = a;
      else d.accounts.push(a);
    });
    onClose();
  };

  return (
    <Modal title={item ? "Рахунок" : "Новий рахунок"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Назва">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Моно чорна, Приват, гаманець…" />
        </Field>
        <Field label="Тип">
          <select
            value={kind}
            onChange={(e) => {
              const k = e.target.value as Account["kind"];
              setKind(k);
              if (!item) setIcon(KINDS[k].icon);
            }}
          >
            {Object.entries(KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Валюта">
          {used ? <input value={item!.currency} disabled /> : <CurSelect value={currency} onChange={setCurrency} />}
        </Field>
        <Field label="Початковий баланс">
          <input inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="скільки було до обліку" />
        </Field>
        <Field label="Символ">
          <input value={icon} maxLength={2} onChange={(e) => setIcon(e.target.value)} />
        </Field>
      </div>
      {used && <div className="hint">Валюту не можна змінити: на рахунку вже є операції.</div>}
      <div className="modal-actions">
        {item && !isLast && (
          <div className="mr-auto row gap">
            {used ? (
              <button
                className="btn ghost sm"
                onClick={() => {
                  update((d) => {
                    const a = d.accounts.find((x) => x.id === item.id)!;
                    a.archived = !a.archived;
                    if (a.archived && d.settings.defaultAccount === a.id) d.settings.defaultAccount = d.accounts.find((x) => !x.archived)!.id;
                  });
                  onClose();
                }}
              >
                {item.archived ? "Повернути з архіву" : "В архів"}
              </button>
            ) : (
              <DelBtn
                onDelete={() => {
                  update((d) => {
                    d.accounts = d.accounts.filter((x) => x.id !== item.id);
                    if (d.settings.defaultAccount === item.id) d.settings.defaultAccount = d.accounts[0].id;
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

function MoveModal({ from: initFrom, onClose }: { from: string; onClose: () => void }) {
  const { data, update } = useStore();
  const live = data.accounts.filter((a) => !a.archived);
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(live.find((a) => a.id !== initFrom)?.id ?? "");
  const [amount, setAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const A = data.accounts.find((a) => a.id === from)!;
  const B = data.accounts.find((a) => a.id === to);
  const r = data.settings.rates;
  const cross = B && A.currency !== B.currency;
  const autoTo = B ? (num(amount) * rateOf(A.currency, r)) / (rateOf(B.currency, r) || 1) : 0;

  const save = () => {
    const v = num(amount);
    if (v <= 0 || !B || from === to) return;
    const arrive = cross ? num(toAmount) || autoTo : v;
    update((d) =>
      d.txs.push({ id: uid(), date, type: "move", amount: v, currency: A.currency, uah: toUAH(v, A.currency, r), accountId: from, toAccountId: to, toAmount: arrive, note: note.trim() || undefined }),
    );
    fxEmit("transfer");
    onClose();
  };

  return (
    <Modal title="Переказ між рахунками" onClose={onClose}>
      <div className="form-grid">
        <Field label="З рахунку">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {live.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name} · {fmt(accountBalance(data, a), a.currency)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="На рахунок">
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {live
              .filter((a) => a.id !== from)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name} · {a.currency}
                </option>
              ))}
          </select>
        </Field>
        <Field label={`Сума, ${A.currency}`}>
          <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        </Field>
        {cross ? (
          <Field label={`Надійде, ${B!.currency}`}>
            <input inputMode="decimal" value={toAmount} onChange={(e) => setToAmount(e.target.value)} placeholder={autoTo ? autoTo.toFixed(2) : "за курсом"} />
          </Field>
        ) : (
          <Field label="Дата">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        )}
        <Field label="Коментар" wide>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="необов'язково" />
        </Field>
      </div>
      {cross && <div className="hint">Обмін валюти: впиши, скільки реально надійшло, або залиш за курсом НБУ.</div>}
      <div className="hint">Переказ між своїми рахунками не рахується ні доходом, ні витратою.</div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Скасувати
        </button>
        <button className="btn primary" onClick={save} disabled={!B || num(amount) <= 0}>
          Переказати
        </button>
      </div>
    </Modal>
  );
}

function FixModal({ acc, onClose }: { acc: Account; onClose: () => void }) {
  const { data, update } = useStore();
  const cur = accountBalance(data, acc);
  const [real, setReal] = useState(String(Math.round(cur * 100) / 100));
  const diff = num(real) - cur;
  const save = () => {
    update((d) => void (d.accounts.find((a) => a.id === acc.id)!.initial += diff));
    onClose();
  };
  return (
    <Modal title={`Звірка · ${acc.name}`} onClose={onClose}>
      <div className="form-grid">
        <Field label={`Реальний баланс зараз, ${acc.currency}`} wide>
          <input autoFocus inputMode="decimal" value={real} onChange={(e) => setReal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        </Field>
      </div>
      <div className="hint">
        У програмі: {fmt(cur, acc.currency, 2)}. {Math.abs(diff) >= 0.01 ? `Різниця ${diff > 0 ? "+" : ""}${fmt(diff, acc.currency, 2)} — скоригую початковий баланс, операції не зміняться.` : "Збігається ✓"}
      </div>
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
