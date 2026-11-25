import { Bar as RBar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "../store";
import { Bar, Panel, Ring, Stat, Empty } from "../ui";
import {
  cushionInfo,
  daysBetween,
  debtLeft,
  fmt,
  monthShort,
  monthFull,
  monthStats,
  pendingRecurring,
  portfolio,
  shiftMonth,
  todayStr,
  curMonth,
  forecast,
} from "../calc";
import type { PageId } from "../App";
import { catColor, chartTheme } from "../theme";

const kfmt = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)));

export default function Dashboard({ go }: { go: (p: PageId) => void }) {
  const { data, month } = useStore();
  const ct = chartTheme();
  const tip = ct.tip;
  const s = monthStats(data, month);
  const pf = portfolio(data);
  const cush = cushionInfo(data);
  const { rule } = data.settings;
  const base = s.income;

  const history = Array.from({ length: 12 }, (_, i) => {
    const m = shiftMonth(month, i - 11);
    const ms = monthStats(data, m);
    return { m: monthShort(m), Дохід: Math.round(ms.income), Витрати: Math.round(ms.expense) };
  });

  const catMap = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  const pie = Object.entries(s.byCategory)
    .map(([id, v]) => ({ name: catMap[id]?.name ?? "Інше", value: Math.round(v), color: catColor(catMap[id]?.color), icon: catMap[id]?.icon ?? "∗" }))
    .sort((a, b) => b.value - a.value);

  const savingsRate = s.income > 0 ? ((s.income - s.expense) / s.income) * 100 : 0;

  // alerts
  const alerts: { tone: string; text: string; page: PageId }[] = [];
  for (const [cid, lim] of Object.entries(data.budgets)) {
    const spent = s.byCategory[cid] || 0;
    if (lim > 0 && spent > lim) alerts.push({ tone: "red", text: `Перевищено бюджет «${catMap[cid]?.name}»: ${fmt(spent)} / ${fmt(lim)}`, page: "budget" });
    else if (lim > 0 && spent > lim * 0.8) alerts.push({ tone: "yellow", text: `«${catMap[cid]?.name}» — ${Math.round((spent / lim) * 100)}% бюджету`, page: "budget" });
  }
  if (month === curMonth()) {
    const pend = pendingRecurring(data, month);
    if (pend.length) alerts.push({ tone: "cyan", text: `${pend.length} регулярних платежів ще не проведено цього місяця`, page: "rec" });
  }
  const today = todayStr();
  for (const d of data.debts) {
    if (!d.due || debtLeft(d) <= 0) continue;
    const days = daysBetween(today, d.due);
    if (days < 0) alerts.push({ tone: "red", text: `Прострочено: ${d.direction === "lent" ? `${d.person} винен тобі` : `ти винен ${d.person}`} ${fmt(debtLeft(d), d.currency)}`, page: "debt" });
    else if (days <= 7) alerts.push({ tone: "yellow", text: `Через ${days} дн.: ${d.direction === "lent" ? `${d.person} повертає` : `повернути ${d.person}`} ${fmt(debtLeft(d), d.currency)}`, page: "debt" });
  }
  if (s.salary === 0 && month === curMonth()) alerts.push({ tone: "magenta", text: "ЗП за цей місяць ще не внесено", page: "tx" });

  const assets = [
    { label: "Вільні кошти", v: pf.free, tone: "cyan" },
    { label: "Накопичення", v: pf.pots, tone: "green" },
    { label: "Депозити / ОВДП", v: pf.deposits, tone: "yellow" },
    { label: "Акції / ETF", v: pf.stocks, tone: "magenta" },
    { label: "Валюта готівкою", v: pf.cash, tone: "cyan" },
    { label: "Мені винні", v: pf.lent, tone: "green" },
    { label: "Я винен", v: -pf.borrowed, tone: "red" },
  ].filter((a) => Math.abs(a.v) > 0.5);
  const assetMax = Math.max(1, ...assets.map((a) => Math.abs(a.v)));

  return (
    <div className="grid dash">
      <section className="hero span-12">
        <div className="hero-inner">
          <div className="hero-kicker">{monthFull(month)}</div>
          <div className="hero-title">{fmt(pf.net)}</div>
          <div className="hero-sub">
            чистий капітал · вільні {fmt(pf.free)} · подушка {cush.months.toFixed(1)} з {data.settings.cushionMonths} міс
          </div>
        </div>
        <div className="hero-badge">
          <span>{s.income > 0 ? `${Math.round(savingsRate)}%` : "—"}</span>
          <small>норма заощаджень</small>
        </div>
      </section>
      <div className="stats-row span-12">
        <Stat label="ДОХІД МІСЯЦЯ" value={fmt(s.income)} sub={`з них ЗП ${fmt(s.salary)}`} tone="green" />
        <Stat label="ВИТРАТИ" value={fmt(s.expense)} sub={`потреби ${fmt(s.byBucket.needs)} · бажання ${fmt(s.byBucket.wants)}`} tone="magenta" />
        <Stat label="ВІДКЛАДЕНО" value={fmt(s.saved)} sub="у подушку та цілі" tone="yellow" />
        <Stat
          label="НОРМА ЗАОЩАДЖЕНЬ"
          value={`${Math.round(savingsRate)}%`}
          sub={s.income > 0 ? `залишок ${fmt(s.income - s.expense)}` : "немає доходу"}
          tone={savingsRate >= rule.savings ? "green" : savingsRate >= 0 ? "yellow" : "red"}
        />
      </div>

      {month === curMonth() && <Forecast go={go} />}

      <Panel title={`ПРАВИЛО ${rule.needs}/${rule.wants}/${rule.savings}`} className="span-5" accent="cyan">
        {base <= 0 ? (
          <Empty>Внеси дохід за місяць — і тут з'явиться розподіл.</Empty>
        ) : (
          <div className="rule">
            {[
              { k: "Потреби", pct: rule.needs, actual: s.byBucket.needs, tone: "cyan", over: true },
              { k: "Бажання", pct: rule.wants, actual: s.byBucket.wants, tone: "magenta", over: true },
              { k: "Майбутнє", pct: rule.savings, actual: Math.max(0, s.income - s.expense), tone: "green", over: false },
            ].map((x) => {
              const plan = (base * x.pct) / 100;
              const bad = x.over ? x.actual > plan : x.actual < plan;
              return (
                <div key={x.k} className="rule-row">
                  <div className="rule-head">
                    <span className={`tone-text-${x.tone}`}>{x.k}</span>
                    <span className="muted">
                      {fmt(x.actual)} / {fmt(plan)}
                    </span>
                  </div>
                  <Bar value={x.actual} max={plan} tone={bad ? (x.over ? "red" : "yellow") : x.tone} />
                  <div className="rule-foot muted">
                    {x.over
                      ? x.actual > plan
                        ? `понад план на ${fmt(x.actual - plan)}`
                        : `ще можна ${fmt(plan - x.actual)}`
                      : x.actual >= plan
                        ? "ціль виконана ✓"
                        : `не вистачає ${fmt(plan - x.actual)}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="ДИНАМІКА · 12 МІС" className="span-7" accent="magenta">
        <div style={{ height: 230 }}>
          <ResponsiveContainer>
            <BarChart data={history} barGap={2}>
              <CartesianGrid stroke={ct.grid} vertical={false} />
              <XAxis dataKey="m" tick={{ fill: ct.muted, fontSize: 11 }} axisLine={{ stroke: ct.line }} tickLine={false} />
              <YAxis tickFormatter={kfmt} tick={{ fill: ct.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...tip} formatter={(v) => fmt(Number(v))} />
              <RBar dataKey="Дохід" fill={ct.green} radius={[2, 2, 0, 0]} />
              <RBar dataKey="Витрати" fill={ct.magenta} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="ВИТРАТИ ЗА КАТЕГОРІЯМИ" className="span-5" accent="magenta">
        {pie.length === 0 ? (
          <Empty>Витрат за місяць ще немає.</Empty>
        ) : (
          <div className="pie-wrap">
            <div style={{ width: 170, height: 170 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                    {pie.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tip} formatter={(v) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="legend">
              {pie.slice(0, 8).map((p) => (
                <li key={p.name}>
                  <i style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                  <span className="lg-name">
                    {p.icon} {p.name}
                  </span>
                  <span className="lg-val">{fmt(p.value)}</span>
                  <span className="lg-pct muted">{Math.round((p.value / s.expense) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel title="ФІНАНСОВА ПОДУШКА" className="span-3" accent="green" right={<button className="link" onClick={() => go("save")}>→</button>}>
        <div className="cushion">
          <Ring pct={cush.pct} label={`${cush.months.toFixed(1)}`} sub={`з ${data.settings.cushionMonths} міс`} size={130} />
          <div className="cushion-info">
            <div>{fmt(cush.balance)}</div>
            <div className="muted">ціль {cush.target > 0 ? fmt(cush.target) : "—"}</div>
          </div>
        </div>
      </Panel>

      <Panel title="СТРУКТУРА КАПІТАЛУ" className="span-4" accent="yellow" right={<span className="big-num">{fmt(pf.net)}</span>}>
        {assets.length === 0 ? (
          <Empty>Поки порожньо.</Empty>
        ) : (
          <div className="assets">
            {assets.map((a) => (
              <div key={a.label} className="asset-row">
                <span>{a.label}</span>
                <span className={a.v < 0 ? "neg" : ""}>{fmt(a.v)}</span>
                <Bar value={Math.abs(a.v)} max={assetMax} tone={a.tone} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="СИСТЕМНІ СПОВІЩЕННЯ" className="span-12" accent="red">
        {alerts.length === 0 ? (
          <Empty>Все в нормі. Жодних тривог.</Empty>
        ) : (
          <ul className="alerts">
            {alerts.map((a, i) => (
              <li key={i} className={`alert tone-${a.tone}`} onClick={() => go(a.page)}>
                <span className="alert-dot" />
                {a.text}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Forecast({ go }: { go: (p: PageId) => void }) {
  const { data } = useStore();
  const f = forecast(data);
  if (f.base <= 0)
    return (
      <Panel title="ПРОГНОЗ МІСЯЦЯ" className="span-12" accent="green">
        <Empty>Внеси дохід (або ЗП) — і тут з'явиться ліміт на день і прогноз до кінця місяця.</Empty>
      </Panel>
    );
  const over = f.projSpend > f.cap;
  const tone = f.todayLeft < 0 ? "red" : f.todayLeft < f.daily * 0.25 ? "yellow" : "green";
  return (
    <Panel
      title="ПРОГНОЗ МІСЯЦЯ"
      className="span-12 forecast"
      accent={tone}
      right={<span className="muted small">залишилось {f.left} дн. з {f.total}{f.baseGuess ? " · дохід оцінено за 3 міс" : ""}</span>}
    >
      <div className="fc-grid">
        <div className="fc-main">
          <div className="fc-label">МОЖНА ВИТРАТИТИ СЬОГОДНІ</div>
          <div className={`fc-big tone-text-${tone}`}>{fmt(Math.max(0, f.todayLeft))}</div>
          <Bar value={f.spentToday} max={Math.max(1, f.daily)} tone={tone} />
          <div className="muted small">
            ліміт {fmt(f.daily)}/день · сьогодні витрачено {fmt(f.spentToday)}
            {f.todayLeft < 0 ? ` · понад ліміт на ${fmt(-f.todayLeft)}` : ""}
          </div>
        </div>
        <div className="fc-cell">
          <div className="fc-label">ЗАЛИШОК НА МІСЯЦЬ</div>
          <div className={`fc-num ${f.remaining < 0 ? "neg" : ""}`}>{fmt(f.remaining)}</div>
          <div className="muted small">
            з {fmt(f.cap)} на потреби+бажання{f.pendOut > 0 ? ` · ${fmt(f.pendOut)} ще піде на регулярні` : ""}
          </div>
        </div>
        <div className="fc-cell">
          <div className="fc-label">ВИТРАТИ НА КІНЕЦЬ МІСЯЦЯ</div>
          <div className={`fc-num ${over ? "neg" : "pos"}`}>{fmt(f.projSpend)}</div>
          <div className="muted small">
            {over ? `перевищення плану на ${fmt(f.projSpend - f.cap)}` : `в межах плану, запас ${fmt(f.cap - f.projSpend)}`} · темп {fmt(f.pace)}/день
          </div>
        </div>
        <div className="fc-cell">
          <div className="fc-label">НА РАХУНКАХ НА КІНЕЦЬ МІСЯЦЯ</div>
          <div className={`fc-num ${f.endBalance < 0 ? "neg" : ""}`}>{fmt(f.endBalance)}</div>
          <div className="muted small">зараз {fmt(f.free)}</div>
        </div>
      </div>
      {f.upcoming.length > 0 && (
        <div className="fc-up">
          <span className="muted small">Ще цього місяця:</span>
          {f.upcoming.slice(0, 6).map((u, i) => (
            <button key={i} className={`fc-chip ${u.kind === "income" ? "pos" : ""} ${u.day < f.day ? "late" : ""}`} onClick={() => go("rec")}>
              {u.day < f.day ? "не проведено" : `${u.day}-го`} · {u.name} · {u.kind === "income" ? "+" : "−"}
              {fmt(u.amount)}
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
