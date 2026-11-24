import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useStore } from "../store";
import { Bar, CurSelect, DelBtn, Empty, Field, Modal, Panel, Stat, num } from "../ui";
import { daysBetween, depositNow, fmt, portfolio, toUAH, todayStr, uid } from "../calc";
import { chartTheme } from "../theme";
import { fxEmit } from "../fx/engine";
import type { CashFx, Cur, Deposit, Stock } from "../types";

export default function Investments() {
  const { data, update } = useStore();
  const pf = portfolio(data);
  const ct = chartTheme();
  const r = data.settings.rates;
  const [dep, setDep] = useState<Deposit | "new" | null>(null);
  const [stk, setStk] = useState<Stock | "new" | null>(null);
  const [cash, setCash] = useState<CashFx | "new" | null>(null);

  const total = pf.deposits + pf.stocks + pf.cash;
  const pnl = pf.stocks - pf.stocksCost;
  const depIncome = data.deposits.reduce((a, d) => a + toUAH(depositNow(d).projected, d.currency, r), 0);
  const alloc = [
    { name: "Депозити / ОВДП", value: Math.round(pf.deposits), color: ct.yellow },
    { name: "Акції / ETF", value: Math.round(pf.stocks), color: ct.magenta },
    { name: "Валюта", value: Math.round(pf.cash), color: ct.cyan },
  ].filter((x) => x.value > 0);

  return (
    <div className="grid">
      <div className="stats-row span-9">
        <Stat label="ПОРТФЕЛЬ" value={fmt(total)} tone="cyan" />
        <Stat label="P&L АКЦІЙ" value={`${pnl >= 0 ? "+" : ""}${fmt(pnl)}`} sub={pf.stocksCost > 0 ? `${((pnl / pf.stocksCost) * 100).toFixed(1)}%` : "—"} tone={pnl >= 0 ? "green" : "red"} />
        <Stat label="% ПО ДЕПОЗИТАХ" value={fmt(depIncome)} sub="очікуваний дохід до погашення" tone="yellow" />
      </div>
      <Panel className="span-3" title="АЛОКАЦІЯ">
        {alloc.length === 0 ? (
          <Empty>—</Empty>
        ) : (
          <div style={{ height: 120 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={alloc} dataKey="value" innerRadius={34} outerRadius={55} stroke="none" paddingAngle={2}>
                  {alloc.map((a) => (
                    <Cell key={a.name} fill={a.color} />
                  ))}
                </Pie>
                <Tooltip {...ct.tip} formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel title="ДЕПОЗИТИ / ОВДП" className="span-12" accent="yellow" right={<button className="btn primary sm" onClick={() => setDep("new")}>+ Додати</button>}>
        {data.deposits.length === 0 ? (
          <Empty>Немає депозитів чи облігацій.</Empty>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Тип</th>
                <th className="r">Сума</th>
                <th className="r">Ставка</th>
                <th>Термін</th>
                <th className="r">Нараховано</th>
                <th className="r">На погашення</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.deposits.map((d) => {
                const n = depositNow(d);
                const left = daysBetween(todayStr(), d.end);
                return (
                  <tr key={d.id} onDoubleClick={() => setDep(d)}>
                    <td>{d.name}</td>
                    <td><span className="tag">{d.kind === "ovdp" ? "ОВДП" : "депозит"}</span></td>
                    <td className="r">{fmt(d.amount, d.currency)}</td>
                    <td className="r">{d.rate}%</td>
                    <td style={{ minWidth: 140 }}>
                      <Bar value={n.progress} max={1} tone={left <= 0 ? "green" : "yellow"} />
                      <span className="muted small">{left > 0 ? `${left} дн. до ${d.end}` : `погашено ${d.end}`}</span>
                    </td>
                    <td className="r pos">+{fmt(n.accrued, d.currency)}</td>
                    <td className="r">{fmt(d.amount + n.projected, d.currency)}</td>
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => setDep(d)}>✎</button>
                      <DelBtn onDelete={() => update((x) => void (x.deposits = x.deposits.filter((y) => y.id !== d.id)))} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="hint">Розрахунок — простий відсоток без податку. Для депозитів: −19.5% (ПДФО + військовий збір); ОВДП не оподатковуються.</div>
      </Panel>

      <Panel title="АКЦІЇ / ETF" className="span-8" accent="magenta" right={<button className="btn primary sm" onClick={() => setStk("new")}>+ Додати</button>}>
        {data.stocks.length === 0 ? (
          <Empty>Немає позицій.</Empty>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Тікер</th>
                <th className="r">К-сть</th>
                <th className="r">Купівля</th>
                <th className="r">Зараз</th>
                <th className="r">Вартість</th>
                <th className="r">P&L</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.stocks.map((s) => {
                const pl = (s.price - s.buyPrice) * s.qty;
                const plp = s.buyPrice > 0 ? ((s.price - s.buyPrice) / s.buyPrice) * 100 : 0;
                return (
                  <tr key={s.id} onDoubleClick={() => setStk(s)}>
                    <td><b>{s.ticker}</b></td>
                    <td className="r">{s.qty}</td>
                    <td className="r">{fmt(s.buyPrice, s.currency, 2)}</td>
                    <td className="r">
                      <input
                        className="cell-input"
                        defaultValue={s.price}
                        inputMode="decimal"
                        title="Оновити поточну ціну"
                        onBlur={(e) => {
                          const v = num(e.target.value);
                          if (v > 0) update((x) => void (x.stocks.find((y) => y.id === s.id)!.price = v));
                        }}
                      />
                    </td>
                    <td className="r">{fmt(s.qty * s.price, s.currency)}</td>
                    <td className={`r ${pl >= 0 ? "pos" : "neg"}`}>
                      {pl >= 0 ? "+" : ""}
                      {fmt(pl, s.currency)} <small>({plp.toFixed(1)}%)</small>
                    </td>
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => setStk(s)}>✎</button>
                      <DelBtn onDelete={() => update((x) => void (x.stocks = x.stocks.filter((y) => y.id !== s.id)))} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="ВАЛЮТА ГОТІВКОЮ" className="span-4" accent="cyan" right={<button className="btn primary sm" onClick={() => setCash("new")}>+ Додати</button>}>
        {data.cash.length === 0 ? (
          <Empty>Немає валюти.</Empty>
        ) : (
          <div className="assets">
            {data.cash.map((c) => (
              <div key={c.id} className="cash-row" onDoubleClick={() => setCash(c)}>
                <span>
                  <b>{fmt(c.amount, c.currency)}</b> <span className="muted small">{c.note}</span>
                </span>
                <span className="muted">≈ {fmt(toUAH(c.amount, c.currency, r))}</span>
                <span className="row-actions">
                  <button className="icon-btn" onClick={() => setCash(c)}>✎</button>
                  <DelBtn onDelete={() => update((x) => void (x.cash = x.cash.filter((y) => y.id !== c.id)))} />
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {dep && <DepositModal item={dep === "new" ? null : dep} onClose={() => setDep(null)} />}
      {stk && <StockModal item={stk === "new" ? null : stk} onClose={() => setStk(null)} />}
      {cash && <CashModal item={cash === "new" ? null : cash} onClose={() => setCash(null)} />}
    </div>
  );
}

function Actions({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <div className="modal-actions">
      <button className="btn ghost" onClick={onClose}>Скасувати</button>
      <button className="btn primary" onClick={() => { onSave(); fxEmit("save"); }}>Зберегти</button>
    </div>
  );
}

function upsert<T extends { id: string }>(arr: T[], item: T) {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i >= 0) arr[i] = item;
  else arr.push(item);
}

function DepositModal({ item, onClose }: { item: Deposit | null; onClose: () => void }) {
  const { update } = useStore();
  const [f, setF] = useState({
    kind: item?.kind ?? "deposit",
    name: item?.name ?? "",
    amount: item ? String(item.amount) : "",
    currency: (item?.currency ?? "UAH") as Cur,
    rate: item ? String(item.rate) : "",
    start: item?.start ?? todayStr(),
    end: item?.end ?? "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    if (!f.name || num(f.amount) <= 0 || !f.end) return;
    update((d) =>
      upsert(d.deposits, { id: item?.id ?? uid(), kind: f.kind as Deposit["kind"], name: f.name, amount: num(f.amount), currency: f.currency, rate: num(f.rate), start: f.start, end: f.end }),
    );
    onClose();
  };
  return (
    <Modal title={item ? "Депозит / ОВДП" : "Новий депозит / ОВДП"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Тип">
          <select value={f.kind} onChange={set("kind")}>
            <option value="deposit">Депозит</option>
            <option value="ovdp">ОВДП</option>
          </select>
        </Field>
        <Field label="Назва / банк">
          <input autoFocus value={f.name} onChange={set("name")} placeholder="Моно, ПриватБанк, ОВДП UA4000…" />
        </Field>
        <Field label="Сума">
          <input inputMode="decimal" value={f.amount} onChange={set("amount")} />
        </Field>
        <Field label="Валюта">
          <CurSelect value={f.currency} onChange={(c) => setF({ ...f, currency: c })} />
        </Field>
        <Field label="Ставка, % річних">
          <input inputMode="decimal" value={f.rate} onChange={set("rate")} />
        </Field>
        <Field label="Відкрито">
          <input type="date" value={f.start} onChange={set("start")} />
        </Field>
        <Field label="Погашення">
          <input type="date" value={f.end} onChange={set("end")} />
        </Field>
      </div>
      <Actions onClose={onClose} onSave={save} />
    </Modal>
  );
}

function StockModal({ item, onClose }: { item: Stock | null; onClose: () => void }) {
  const { update } = useStore();
  const [f, setF] = useState({
    ticker: item?.ticker ?? "",
    qty: item ? String(item.qty) : "",
    buyPrice: item ? String(item.buyPrice) : "",
    price: item ? String(item.price) : "",
    currency: (item?.currency ?? "USD") as Cur,
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    if (!f.ticker || num(f.qty) <= 0) return;
    update((d) =>
      upsert(d.stocks, {
        id: item?.id ?? uid(),
        ticker: f.ticker.toUpperCase(),
        qty: num(f.qty),
        buyPrice: num(f.buyPrice),
        price: num(f.price) || num(f.buyPrice),
        currency: f.currency,
      }),
    );
    onClose();
  };
  return (
    <Modal title={item ? "Позиція" : "Нова позиція"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Тікер">
          <input autoFocus value={f.ticker} onChange={set("ticker")} placeholder="VOO, AAPL…" />
        </Field>
        <Field label="Кількість">
          <input inputMode="decimal" value={f.qty} onChange={set("qty")} />
        </Field>
        <Field label="Середня ціна купівлі">
          <input inputMode="decimal" value={f.buyPrice} onChange={set("buyPrice")} />
        </Field>
        <Field label="Поточна ціна">
          <input inputMode="decimal" value={f.price} onChange={set("price")} placeholder="= ціна купівлі" />
        </Field>
        <Field label="Валюта">
          <CurSelect value={f.currency} onChange={(c) => setF({ ...f, currency: c })} />
        </Field>
      </div>
      <Actions onClose={onClose} onSave={save} />
    </Modal>
  );
}

function CashModal({ item, onClose }: { item: CashFx | null; onClose: () => void }) {
  const { update } = useStore();
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [currency, setCurrency] = useState<Cur>(item?.currency ?? "USD");
  const [note, setNote] = useState(item?.note ?? "");
  const save = () => {
    if (num(amount) <= 0) return;
    update((d) => upsert(d.cash, { id: item?.id ?? uid(), amount: num(amount), currency, note }));
    onClose();
  };
  return (
    <Modal title="Валюта готівкою" onClose={onClose}>
      <div className="form-grid">
        <Field label="Сума">
          <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Валюта">
          <CurSelect value={currency} onChange={setCurrency} />
        </Field>
        <Field label="Де / примітка" wide>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="сейф, конверт…" />
        </Field>
      </div>
      <Actions onClose={onClose} onSave={save} />
    </Modal>
  );
}
