export type Cur = "UAH" | "USD" | "EUR";
export type Bucket = "needs" | "wants";
export type IncomeSource = "salary" | "bonus" | "freelance" | "passive" | "other";

export interface Category {
  id: string;
  name: string;
  icon: string;
  bucket: Bucket;
  color: string;
}

export interface Tx {
  id: string;
  date: string; // YYYY-MM-DD
  type: "income" | "expense" | "transfer";
  amount: number; // in original currency; for transfer: + to pot, - from pot
  currency: Cur;
  uah: number; // UAH value at entry time (same sign as amount)
  categoryId?: string;
  source?: IncomeSource;
  potId?: string;
  recurringId?: string;
  note?: string;
}

export interface Recurring {
  id: string;
  name: string;
  kind: "expense" | "income";
  amount: number;
  currency: Cur;
  categoryId?: string;
  source?: IncomeSource;
  day: number;
  active: boolean;
}

export interface Pot {
  id: string;
  name: string;
  icon: string;
  target: number; // UAH, 0 = no target
  deadline?: string;
  isCushion?: boolean;
}

export interface Deposit {
  id: string;
  kind: "deposit" | "ovdp";
  name: string;
  amount: number;
  currency: Cur;
  rate: number; // % annual
  start: string;
  end: string;
}

export interface Stock {
  id: string;
  ticker: string;
  qty: number;
  buyPrice: number;
  price: number;
  currency: Cur;
}

export interface CashFx {
  id: string;
  currency: Cur;
  amount: number;
  note: string;
}

export interface DebtPayment {
  date: string;
  amount: number;
}

export interface Debt {
  id: string;
  direction: "lent" | "borrowed";
  person: string;
  amount: number;
  currency: Cur;
  date: string;
  due?: string;
  note?: string;
  payments: DebtPayment[];
}

export interface Rates {
  USD: number;
  EUR: number;
  date: string;
  manual: boolean;
}

export interface Settings {
  rule: { needs: number; wants: number; savings: number };
  cushionMonths: number;
  startBalance: number;
  rates: Rates;
  theme?: string;
}

export interface Data {
  version: 1;
  categories: Category[];
  txs: Tx[];
  budgets: Record<string, number>; // categoryId -> monthly UAH limit
  recurring: Recurring[];
  appliedRecurring: Record<string, string[]>; // month -> recurring ids
  pots: Pot[];
  deposits: Deposit[];
  stocks: Stock[];
  cash: CashFx[];
  debts: Debt[];
  settings: Settings;
}
