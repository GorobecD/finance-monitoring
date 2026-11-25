import { invoke } from "@tauri-apps/api/core";
import type { Data, Rates } from "./types";
import { todayStr, uid } from "./calc";

const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const LS_KEY = "neonfin-data";

export function defaultData(): Data {
  const cats: [string, string, "needs" | "wants", string][] = [
    ["Житло / оренда", "⌂", "needs", "#00f0ff"],
    ["Комуналка", "⚡", "needs", "#36c5ff"],
    ["Продукти", "◍", "needs", "#39ff88"],
    ["Транспорт", "⇆", "needs", "#7cffcb"],
    ["Здоров'я", "✚", "needs", "#5dffea"],
    ["Зв'язок / інтернет", "◉", "needs", "#4d9dff"],
    ["Кафе / доставка", "☕", "wants", "#ff2bd6"],
    ["Розваги", "✦", "wants", "#c03bff"],
    ["Одяг", "◇", "wants", "#ff6ad5"],
    ["Підписки", "▶", "wants", "#9d6bff"],
    ["Подорожі", "✈", "wants", "#ff8a3d"],
    ["Подарунки", "❖", "wants", "#ffd23d"],
    ["Інше", "∗", "wants", "#a0a8c0"],
  ];
  return {
    version: 1,
    categories: cats.map(([name, icon, bucket, color], i) => ({ id: i === cats.length - 1 ? "other" : uid(), name, icon, bucket, color })),
    accounts: [{ id: "main", name: "Основна картка", icon: "▭", kind: "card", currency: "UAH", initial: 0 }],
    txs: [],
    budgets: {},
    recurring: [],
    appliedRecurring: {},
    pots: [{ id: "cushion", name: "Фінансова подушка", icon: "⛨", target: 0, isCushion: true }],
    deposits: [],
    stocks: [],
    cash: [],
    debts: [],
    settings: {
      rule: { needs: 50, wants: 30, savings: 20 },
      cushionMonths: 6,
      startBalance: 0,
      defaultAccount: "main",
      rates: { USD: 41.5, EUR: 48, date: "", manual: false },
    },
  };
}

export async function loadData(): Promise<Data> {
  let raw: string | null = null;
  try {
    raw = isTauri() ? await invoke<string | null>("load_data") : localStorage.getItem(LS_KEY);
  } catch (e) {
    console.error("load failed", e);
  }
  if (!raw) return defaultData();
  try {
    const d = { ...defaultData(), ...JSON.parse(raw) } as Data;
    // migration: data from before accounts existed -> one default account holding the old start balance
    if (!Array.isArray((JSON.parse(raw) as Partial<Data>).accounts)) {
      d.accounts = [{ id: "main", name: "Основна картка", icon: "▭", kind: "card", currency: "UAH", initial: d.settings.startBalance || 0 }];
      d.settings.startBalance = 0;
    }
    if (!d.accounts.length) d.accounts = defaultData().accounts;
    if (!d.settings.defaultAccount || !d.accounts.some((a) => a.id === d.settings.defaultAccount)) d.settings.defaultAccount = d.accounts[0].id;
    return d;
  } catch {
    return defaultData();
  }
}

export async function saveData(d: Data) {
  const raw = JSON.stringify(d);
  if (isTauri()) await invoke("save_data", { data: raw });
  else {
    try {
      localStorage.setItem(LS_KEY, raw);
    } catch {
      /* ignore */
    }
  }
}

export async function dataLocation(): Promise<string> {
  return isTauri() ? invoke<string>("data_path") : "localStorage (браузер)";
}

/** Fetch official NBU rates. In Tauri goes through Rust (no CORS). */
export async function fetchNbuRates(): Promise<Rates> {
  const url = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
  const raw = isTauri() ? await invoke<string>("fetch_url", { url }) : await (await fetch(url)).text();
  const list = JSON.parse(raw) as { cc: string; rate: number; exchangedate: string }[];
  const usd = list.find((x) => x.cc === "USD");
  const eur = list.find((x) => x.cc === "EUR");
  if (!usd || !eur) throw new Error("NBU: немає USD/EUR");
  const [dd, mm, yyyy] = usd.exchangedate.split(".");
  return { USD: usd.rate, EUR: eur.rate, date: yyyy ? `${yyyy}-${mm}-${dd}` : todayStr(), manual: false };
}

/** Save a backup file. Tauri: writes to Downloads via Rust. Browser: triggers download. Returns location text. */
export async function exportBackup(json: string, filename: string): Promise<string> {
  if (isTauri()) return invoke<string>("export_backup", { data: json, filename });
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  return "Завантаження";
}
