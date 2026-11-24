import type { Bucket, Cur, Data, Debt, Deposit, Rates } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const pad = (n: number) => String(n).padStart(2, "0");
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const curMonth = () => todayStr().slice(0, 7);

export const shiftMonth = (m: string, delta: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const MONTHS = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
const MONTHS_FULL = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
export const monthShort = (m: string) => MONTHS[Number(m.slice(5, 7)) - 1] + " " + m.slice(2, 4);
export const monthFull = (m: string) => MONTHS_FULL[Number(m.slice(5, 7)) - 1] + " " + m.slice(0, 4);

export const SYM: Record<Cur, string> = { UAH: "₴", USD: "$", EUR: "€" };

export const fmt = (n: number, cur: Cur = "UAH", digits = 0) =>
  new Intl.NumberFormat("uk-UA", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(
    Math.abs(n) < 1e-9 ? 0 : n,
  ) +
  " " +
  SYM[cur];

export const rateOf = (cur: Cur, rates: Rates) => (cur === "UAH" ? 1 : rates[cur] || 0);
export const toUAH = (amount: number, cur: Cur, rates: Rates) => amount * rateOf(cur, rates);

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export interface MonthStats {
  income: number;
  salary: number;
  expense: number;
  saved: number; // net transfers into pots
  byCategory: Record<string, number>;
  byBucket: Record<Bucket, number>;
}

export function monthStats(d: Data, month: string): MonthStats {
  const s: MonthStats = { income: 0, salary: 0, expense: 0, saved: 0, byCategory: {}, byBucket: { needs: 0, wants: 0 } };
  const catBucket = Object.fromEntries(d.categories.map((c) => [c.id, c.bucket]));
  for (const t of d.txs) {
    if (!t.date.startsWith(month)) continue;
    if (t.type === "income") {
      s.income += t.uah;
      if (t.source === "salary") s.salary += t.uah;
    } else if (t.type === "expense") {
      s.expense += t.uah;
      const c = t.categoryId || "other";
      s.byCategory[c] = (s.byCategory[c] || 0) + t.uah;
      s.byBucket[catBucket[c] || "wants"] += t.uah;
    } else if (t.type === "transfer") {
      s.saved += t.uah;
    }
  }
  return s;
}

export function freeBalance(d: Data) {
  let b = d.settings.startBalance;
  for (const t of d.txs) {
    if (t.type === "income") b += t.uah;
    else if (t.type === "expense") b -= t.uah;
    else b -= t.uah;
  }
  return b;
}

export const potBalance = (d: Data, potId: string) =>
  d.txs.filter((t) => t.type === "transfer" && t.potId === potId).reduce((a, t) => a + t.uah, 0);

/** Average monthly expense over last n months that have data, up to and including `month`. */
export function avgMonthlyExpense(d: Data, month: string, n = 3) {
  const vals: number[] = [];
  for (let i = 0; i < 12 && vals.length < n; i++) {
    const m = shiftMonth(month, -i);
    const e = monthStats(d, m).expense;
    if (e > 0) vals.push(e);
  }
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function cushionInfo(d: Data) {
  const pot = d.pots.find((p) => p.isCushion);
  const avg = avgMonthlyExpense(d, curMonth());
  const target = avg * d.settings.cushionMonths;
  const balance = pot ? potBalance(d, pot.id) : 0;
  const months = avg > 0 ? balance / avg : 0;
  return { pot, avg, target, balance, months, pct: target > 0 ? Math.min(1, balance / target) : 0 };
}

export function depositNow(dep: Deposit, today = todayStr()) {
  const end = today < dep.end ? today : dep.end;
  const days = Math.max(0, daysBetween(dep.start, end));
  const accrued = (dep.amount * dep.rate * days) / 36500;
  const totalDays = Math.max(1, daysBetween(dep.start, dep.end));
  const projected = (dep.amount * dep.rate * totalDays) / 36500;
  return { accrued, projected, value: dep.amount + accrued, progress: Math.min(1, days / totalDays) };
}

export const debtLeft = (debt: Debt) => debt.amount - debt.payments.reduce((a, p) => a + p.amount, 0);

export function portfolio(d: Data) {
  const r = d.settings.rates;
  const deposits = d.deposits.reduce((a, x) => a + toUAH(depositNow(x).value, x.currency, r), 0);
  const stocks = d.stocks.reduce((a, x) => a + toUAH(x.qty * x.price, x.currency, r), 0);
  const stocksCost = d.stocks.reduce((a, x) => a + toUAH(x.qty * x.buyPrice, x.currency, r), 0);
  const cash = d.cash.reduce((a, x) => a + toUAH(x.amount, x.currency, r), 0);
  const lent = d.debts.filter((x) => x.direction === "lent").reduce((a, x) => a + toUAH(Math.max(0, debtLeft(x)), x.currency, r), 0);
  const borrowed = d.debts
    .filter((x) => x.direction === "borrowed")
    .reduce((a, x) => a + toUAH(Math.max(0, debtLeft(x)), x.currency, r), 0);
  const pots = d.pots.reduce((a, p) => a + potBalance(d, p.id), 0);
  const free = freeBalance(d);
  const net = free + pots + deposits + stocks + cash + lent - borrowed;
  return { deposits, stocks, stocksCost, cash, lent, borrowed, pots, free, net };
}

export function pendingRecurring(d: Data, month: string) {
  const applied = new Set(d.appliedRecurring[month] || []);
  return d.recurring.filter((r) => r.active && !applied.has(r.id));
}
