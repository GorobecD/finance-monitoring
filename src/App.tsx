import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useStore } from "./store";
import { fetchNbuRates } from "./storage";
import { fmt, monthFull, portfolio, shiftMonth, curMonth, todayStr } from "./calc";
import { TxModal } from "./TxModal";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Savings from "./pages/Savings";
import Investments from "./pages/Investments";
import Debts from "./pages/Debts";
import Recurring from "./pages/Recurring";
import Settings from "./pages/Settings";
import { Updater } from "./Updater";
import { applyTheme, THEMES } from "./theme";
import { Fx } from "./fx/engine";
import { THEME_FX } from "./fx/themes";

let fxEngine: Fx | null = null;

const PAGES = [
  ["dash", "◈", "Огляд"],
  ["tx", "≡", "Операції"],
  ["budget", "◔", "Бюджети"],
  ["save", "⛨", "Накопичення"],
  ["inv", "◆", "Інвестиції"],
  ["debt", "⇋", "Борги"],
  ["rec", "↻", "Регулярні"],
  ["set", "⚙", "Налаштування"],
] as const;
export type PageId = (typeof PAGES)[number][0];

export default function App() {
  const { data, update, month, setMonth, saveState } = useStore();
  applyTheme(data.settings.theme); // before children render so charts read the right CSS vars
  const themeId = THEMES.some((t) => t.id === data.settings.theme) ? data.settings.theme! : "neon";
  const fxOn = data.settings.fx !== false;
  useEffect(() => {
    if (!fxEngine) fxEngine = new Fx();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    fxEngine.setEnabled(fxOn && !reduce);
    document.documentElement.dataset.fx = fxOn && !reduce ? "on" : "off";
    fxEngine.use(THEME_FX[themeId] ?? null);
  }, [themeId, fxOn]);
  const [page, setPage] = useState<PageId>("dash");
  const [modal, setModal] = useState<null | "salary" | "expense" | "income">(null);
  const [version, setVersion] = useState("");
  useEffect(() => {
    if ("__TAURI_INTERNALS__" in window) getVersion().then(setVersion).catch(() => {});
  }, []);
  const [ratesState, setRatesState] = useState<"idle" | "loading" | "error">("idle");
  const pf = portfolio(data);

  const refreshRates = async () => {
    setRatesState("loading");
    try {
      const r = await fetchNbuRates();
      update((d) => {
        d.settings.rates = r;
      });
      setRatesState("idle");
    } catch (e) {
      console.warn(e);
      setRatesState("error");
    }
  };

  useEffect(() => {
    const r = data.settings.rates;
    if (!r.manual && r.date !== todayStr()) refreshRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setModal("expense");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const r = data.settings.rates;

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="scanlines" />
      <aside className="side">
        <div className="logo">
          <span className="logo-mark">◢◤</span>
          <span>
            NEON<em>//</em>FIN
          </span>
        </div>
        <nav>
          {PAGES.map(([id, icon, label]) => (
            <button key={id} className={`nav-btn ${page === id ? "on" : ""}`} onClick={() => setPage(id)}>
              <span className="nav-ico">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="networth-label">ЧИСТИЙ КАПІТАЛ</div>
          <div className={`networth ${pf.net < 0 ? "neg" : ""}`}>{fmt(pf.net)}</div>
          <div className={`save-dot s-${saveState}`}>
            {saveState === "saved" ? "● синхр." : saveState === "saving" ? "◌ запис…" : "✕ помилка запису"}
            {version && <span className="ver"> · v{version}</span>}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="month-nav">
            <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))}>
              ◀
            </button>
            <div className="month-label" onClick={() => setMonth(curMonth())} title="Поточний місяць">
              {monthFull(month)}
            </div>
            <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))}>
              ▶
            </button>
          </div>
          <div className="rates" title={r.date ? `НБУ на ${r.date}` : "Курс не оновлено"}>
            <span>$ {r.USD.toFixed(2)}</span>
            <span>€ {r.EUR.toFixed(2)}</span>
            {r.manual ? (
              <span className="tag">ручний</span>
            ) : (
              <button className={`icon-btn ${ratesState === "loading" ? "spin" : ""}`} onClick={refreshRates} title="Оновити курс НБУ">
                ↻
              </button>
            )}
            {ratesState === "error" && <span className="tag red">офлайн</span>}
          </div>
          <div className="top-actions">
            <button className="btn green" onClick={() => setModal("salary")}>
              + ЗП
            </button>
            <button className="btn ghost" onClick={() => setModal("income")}>
              + Дохід
            </button>
            <button className="btn primary" onClick={() => setModal("expense")} title="Ctrl+N">
              + Витрата
            </button>
          </div>
        </header>

        <div className="content" key={page}>
          {page === "dash" && <Dashboard go={setPage} />}
          {page === "tx" && <Transactions />}
          {page === "budget" && <Budgets />}
          {page === "save" && <Savings />}
          {page === "inv" && <Investments />}
          {page === "debt" && <Debts />}
          {page === "rec" && <Recurring />}
          {page === "set" && <Settings />}
        </div>
      </main>

      {modal === "salary" && <TxModal mode="income" source="salary" onClose={() => setModal(null)} />}
      {modal === "income" && <TxModal mode="income" source="bonus" onClose={() => setModal(null)} />}
      {modal === "expense" && <TxModal mode="expense" onClose={() => setModal(null)} />}
      <Updater />
    </div>
  );
}
