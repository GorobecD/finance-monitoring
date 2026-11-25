import type { Account, Bucket, Cur, Data, Debt, Deposit, Rates, Tx } from "./types";

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

export const accOf = (d: Data, t: Tx) => t.accountId || d.settings.defaultAccount || d.accounts[0]?.id;

/** Balance of one account in its own currency. */
export function accountBalance(d: Data, acc: Account) {
  const r = d.settings.rates;
  const inAcc = (t: Tx, amount: number) => (t.currency === acc.currency ? amount : (t.uah * (amount / (t.amount || 1))) / (rateOf(acc.currency, r) || 1));
  let b = acc.initial;
  for (const t of d.txs) {
    if (t.type === "move") {
      if (accOf(d, t) === acc.id) b -= t.amount;
      if (t.toAccountId === acc.id) b += t.toAmount ?? t.amount;
      continue;
    }
    if (accOf(d, t) !== acc.id) continue;
    if (t.type === "income") b += inAcc(t, t.amount);
    else if (t.type === "expense") b -= inAcc(t, t.amount);
    else b -= inAcc(t, t.amount); // transfer into pot (negative amount = withdrawal back)
  }
  return b;
}

/** Money on all accounts, in UAH at current rates. */
export function freeBalance(d: Data) {
  const r = d.settings.rates;
  return d.settings.startBalance + d.accounts.reduce((s, a) => s + toUAH(accountBalance(d, a), a.currency, r), 0);
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

const daysIn = (m: string) => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate();

/** Current-month forecast: daily allowance, projected spend and end-of-month money. */
export function forecast(d: Data) {
  const month = curMonth();
  const today = todayStr();
  const day = Number(today.slice(8, 10));
  const total = daysIn(month);
  const left = total - day + 1; // incl. today
  const r = d.settings.rates;
  const s = monthStats(d, month);
  const pend = pendingRecurring(d, month);
  const pendOut = pend.filter((x) => x.kind === "expense").reduce((a, x) => a + toUAH(x.amount, x.currency, r), 0);
  const pendIn = pend.filter((x) => x.kind === "income").reduce((a, x) => a + toUAH(x.amount, x.currency, r), 0);
  // income base: this month's income (+ expected regular income); if none yet — average of 3 previous months
  let base = s.income + pendIn;
  let baseGuess = false;
  if (s.income === 0) {
    const prev = [1, 2, 3].map((i) => monthStats(d, shiftMonth(month, -i)).income).filter((x) => x > 0);
    if (prev.length) {
      base = prev.reduce((a, b) => a + b, 0) / prev.length;
      baseGuess = true;
    }
  }
  const { needs, wants } = d.settings.rule;
  const cap = (base * (needs + wants)) / 100; // spendable this month per rule
  // discretionary spend so far = expenses not created from regular payments
  const recSpent = d.txs.filter((t) => t.type === "expense" && t.recurringId && t.date.startsWith(month)).reduce((a, t) => a + t.uah, 0);
  const flexSpent = s.expense - recSpent;
  const spentToday = d.txs.filter((t) => t.type === "expense" && !t.recurringId && t.date === today).reduce((a, t) => a + t.uah, 0);
  const spentBeforeToday = flexSpent - spentToday;
  const remaining = cap - s.expense - pendOut; // what's still free to spend this month
  const daily = Math.max(0, (remaining + spentToday) / left); // allowance per day (today's spend counted against today)
  const todayLeft = daily - spentToday;
  const pace = day > 1 ? spentBeforeToday / (day - 1) : flexSpent; // avg flexible spend per day so far
  const projSpend = s.expense + pendOut + pace * Math.max(0, left - (spentToday > 0 ? 1 : 0));
  const free = freeBalance(d);
  const endBalance = free + pendIn - pendOut - pace * Math.max(0, left - (spentToday > 0 ? 1 : 0));
  const upcoming = pend
    .map((x) => ({ name: x.name, kind: x.kind, day: Math.min(x.day, total), amount: toUAH(x.amount, x.currency, r) }))
    .sort((a, b) => a.day - b.day);
  return { month, day, total, left, base, baseGuess, cap, remaining, daily, spentToday, todayLeft, pace, projSpend, endBalance, pendOut, pendIn, upcoming, free };
}
